<template>
    <div class="artist-panel" :style="{ '--artist-track-digits': digits }">
        <DynamicScroller id="artist-scroller" :items="items" :min-item-size="68" class="artist-scroller">
            <!-- the hero and the tab bar are one block; it is sticky and moves up by the height of the hero,
                 so only the tab bar stays on the top (see .vue-recycle-scroller__slot below) -->
            <template #before>
                <ArtistHero />
                <ArtistTabs :tabs="tabs" :model-value="currentTab" @update:model-value="openTab" />
            </template>
            <template #default="{ item, index, active }">
                <DynamicScrollerItem :item="item" :active="active" :size-dependencies="[item.size]" :data-index="index">
                    <div v-if="item.kind === 'spacer'" :style="{ height: `${item.size}px` }"></div>
                    <p v-else-if="item.kind === 'empty'" class="artist-tab-empty">{{ item.text }}</p>
                    <div v-else-if="item.kind === 'albums'" class="artist-albums-grid">
                        <AlbumThumb v-for="album in item.albums" :key="album.albumhash" :album="album" :variant="item.variant" />
                    </div>
                    <div v-else class="artist-track-item">
                        <SongItem
                            panel
                            :track="item.track"
                            :index="item.position"
                            :source="dropSources.artist"
                            @play-this="playTrack(item.position - 1)"
                        />
                    </div>
                </DynamicScrollerItem>
            </template>
        </DynamicScroller>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { dropSources } from '@/enums'
import { Album, Track } from '@/interfaces'
import { useT } from '@/i18n'
import { getArtistAlbums, getArtistTracks } from '@/requests/artists'
import useArtistPageStore from '@/stores/pages/artist'
import useQueue from '@/stores/queue'
import useTracklist from '@/stores/queue/tracklist'
import useSettings from '@/stores/settings'
import updatePageTitle from '@/utils/updatePageTitle'

import AlbumThumb from '@/components/FeedPanel/AlbumThumb.vue'
import SongItem from '@/components/shared/SongItem.vue'
import ArtistHero from './ArtistHero.vue'
import ArtistTabs from './ArtistTabs.vue'

// The artist page of the Figma (node 12452:929) for the grid of panels: the hero, the tab bar (sticky) and the
// content of the open tab. This stage only has "Most played tracks"; the tabs of releases come next.
const { t } = useT()
const route = useRoute()
const router = useRouter()
const store = useArtistPageStore()
const queue = useQueue()
const tracklist = useTracklist()
const settings = useSettings()

// SECTION: tabs
// six tabs always (even if one is empty), Soundtracks only when the artist has some; the first is always the tracks
const tabs = computed(() => {
    const list = [
        { id: 'tracks', label: t('ArtistView.Tabs.MostPlayed') },
        { id: 'albums', label: t('ArtistView.Tabs.Albums') },
        { id: 'singles', label: t('ArtistView.Tabs.Singles') },
        { id: 'live', label: t('ArtistView.Tabs.Lives') },
        { id: 'appearances', label: t('ArtistView.Tabs.Appearances') },
        { id: 'compilations', label: t('ArtistView.Tabs.Compilations') },
    ]

    if (store.soundtracks.length) list.push({ id: 'soundtracks', label: t('ArtistView.Tabs.Soundtracks') })

    return list
})

// the open tab lives in the URL (?tab=albums); a missing or unknown value is the first tab
const currentTab = computed(() => {
    const id = String(route.query.tab ?? '')
    return tabs.value.some(tab => tab.id === id) ? id : 'tracks'
})

function openTab(id: string) {
    if (id === currentTab.value) return

    const query = { ...route.query }
    if (id === 'tracks') delete query.tab
    else query.tab = id

    // a push, so the back button goes back to the previous tab
    router.push({ query })
}

// a new tab starts at the tab bar: if the page was scrolled further down, the bar stays on the top
watch(currentTab, async () => {
    await nextTick()
    const scroller = document.getElementById('artist-scroller')
    const hero = scroller?.querySelector<HTMLElement>('.artist-hero')
    if (scroller && hero && scroller.scrollTop > hero.offsetHeight) scroller.scrollTop = hero.offsetHeight
})

// SECTION: tracks (all of them, most played first: the server sorts by play count)
const allTracks = ref<Track[]>([])

async function loadTracks() {
    const hash = store.info.artisthash
    allTracks.value = store.tracks

    if (store.info.trackcount <= settings.artist_top_tracks_count) return

    const tracks = await getArtistTracks(hash)
    if (store.info.artisthash === hash && tracks) allTracks.value = tracks
}

watch(() => store.info.artisthash, loadTracks, { immediate: true })

// the column of the number is as wide as the widest number (12px per digit, the 12px of the Figma for one digit)
const digits = computed(() => String(Math.max(allTracks.value.length, 1)).length)

async function playTrack(index: number) {
    tracklist.setFromArtist(store.info.artisthash, store.info.name, allTracks.value)
    queue.play(index)
}

// SECTION: releases (every album of the artist, newest first: the page only receives the first few of each kind)
// the key of each tab in the list of the store and in the answer of the server (`/artist/<hash>/albums?all=true`)
const releaseKeys: Record<string, { store: 'albums' | 'singles' | 'live_albums' | 'appearances' | 'compilations' | 'soundtracks'; api: string }> = {
    albums: { store: 'albums', api: 'albums' },
    singles: { store: 'singles', api: 'singles_and_eps' },
    live: { store: 'live_albums', api: 'live_albums' },
    appearances: { store: 'appearances', api: 'appearances' },
    compilations: { store: 'compilations', api: 'compilations' },
    soundtracks: { store: 'soundtracks', api: 'soundtracks' },
}

const allAlbums = ref<{ hash: string; data: Record<string, Album[]> } | null>(null)

async function loadAlbums() {
    const hash = store.info.artisthash
    if (allAlbums.value?.hash === hash) return

    const res = await getArtistAlbums(hash, 0, true)
    if (store.info.artisthash === hash && res) allAlbums.value = { hash, data: res as unknown as Record<string, Album[]> }
}

// the first albums come with the page; the whole list is fetched when a tab of releases opens
watch(
    [currentTab, () => store.info.artisthash],
    ([tab]) => {
        if (tab !== 'tracks') loadAlbums()
    },
    { immediate: true }
)

function releasesOf(tab: string): Album[] {
    const keys = releaseKeys[tab]
    if (!keys) return []

    if (allAlbums.value?.hash === store.info.artisthash) return allAlbums.value.data[keys.api] ?? []
    return store[keys.store] ?? []
}

// the 40px between the tab bar and the first row, and the 16px after the last (plus its 4 of gap = the 20 of the Figma)
const items = computed(() => {
    if (currentTab.value !== 'tracks') {
        const albums = releasesOf(currentTab.value)

        if (!albums.length) return [{ id: 'empty', kind: 'empty', size: 0, text: t('ArtistView.TabEmpty') }]

        // the artist is the same in all of them, except in Appearances (decision of the Figma): there the card shows it
        const variant = currentTab.value === 'appearances' ? 'home' : 'artist'
        return [{ id: `albums-${currentTab.value}`, kind: 'albums', size: albums.length, albums, variant }]
    }

    if (!allTracks.value.length) {
        return [{ id: 'empty', kind: 'empty', size: 0, text: t('ArtistView.NoTracks') }]
    }

    return [
        { id: 'top', kind: 'spacer', size: 40 },
        ...allTracks.value.map((track, i) => ({ id: `track-${i}`, kind: 'track', size: 68, track, position: i + 1 })),
        { id: 'bottom', kind: 'spacer', size: 16 },
    ]
})

// the title of the tab follows the artist (it changes when the route goes from one artist to another)
watch(() => store.info.name, name => updatePageTitle(name), { immediate: true })
</script>

<style lang="scss">
.artist-panel {
    // the height of the hero follows the width of the panel (3.3 : 1) between 280 and 400px; the sticky block needs it too
    container: artist-panel / inline-size;
    --artist-hero-height: clamp(
        var(--artist-hero-height-min),
        calc(100cqw / var(--artist-hero-ratio)),
        var(--artist-hero-height-max)
    );
    height: 100%;

    .artist-scroller {
        height: 100%;
        padding: 0;
        overflow-x: hidden;
        scrollbar-gutter: auto;
    }

    // the hero and the tab bar scroll away together, except for the bar: the block sticks when only the bar is left
    .vue-recycle-scroller__slot {
        position: sticky;
        top: calc(-1 * var(--artist-hero-height));
        z-index: 5;
    }

    .artist-tab-empty {
        @include text('paragraph-14px');
        margin: 0;
        padding: 40px 20px;
        color: var(--artist-tab-empty-color);
    }

    // the grid of the tabs of releases (Figma node 12462:3137): at most 8 columns, 20 between them and between the rows
    .artist-albums-grid {
        box-sizing: border-box;
        display: grid;
        grid-template-columns: repeat(
            auto-fill,
            minmax(
                max(
                    var(--artist-albums-card-min),
                    calc((100% - (var(--artist-albums-columns) - 1) * var(--artist-albums-gap)) / var(--artist-albums-columns))
                ),
                1fr
            )
        );
        gap: var(--artist-albums-gap);
        padding: var(--artist-albums-padding);
    }

    .artist-track-item {
        box-sizing: border-box;
        padding: 0 8px var(--artist-tracks-gap) 8px;
    }

    // ROW (Figma TrackList, node 12462:2882): number, cover and title, artist, album, heart, time and options
    .songlist-item.panel {
        @include text('track-title-18px');
        box-sizing: border-box;
        display: grid;
        grid-template-columns:
            calc(var(--artist-track-digits) * var(--artist-track-order-digit))
            minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) max-content;
        align-items: center;
        column-gap: var(--artist-track-gap);
        height: var(--artist-track-height);
        padding: var(--artist-track-padding);
        border-radius: var(--artist-track-radius);
        color: var(--artist-track-color);
        cursor: pointer;

        &:hover,
        &.current {
            background-color: var(--artist-track-hover-bg);
        }

        &.contexton {
            background-color: var(--artist-track-hover-bg) !important;
        }

        > .index {
            width: auto;
            height: auto;
            justify-content: flex-start;
            font-size: inherit;

            .text {
                width: auto;
                margin: 0;
                opacity: 1;
                transform: none;
                text-align: left;
            }
        }

        > .tracktitle {
            min-width: 0;
            gap: var(--artist-track-name-gap);

            .thumbnail {
                margin-right: 0;
                flex: none;

                .album-art {
                    width: var(--artist-track-thumb-size);
                    height: var(--artist-track-thumb-size);
                    border-radius: var(--artist-track-thumb-radius);
                }
            }

            .song-title {
                min-width: 0;
                font: inherit;

                .with-flag {
                    min-width: 0;
                }
            }
        }

        > .song-artists {
            width: auto;
            max-width: 100%;
            min-width: 0;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
        }

        > .song-album {
            display: block;
            max-width: 100%;
            min-width: 0;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
        }

        > .options-and-duration {
            gap: var(--artist-track-actions-gap);
            margin: 0;

            // the heart is always there: the outline when it is not a favorite, filled (error/300) when it is
            .heart-icon {
                display: grid;
                place-items: center;
                width: var(--artist-track-icon-size);
                height: var(--artist-track-icon-size);
                margin: 0;
                transform: none;
                cursor: pointer;

                svg {
                    display: block;
                    width: var(--artist-track-icon-size);
                    height: var(--artist-track-icon-size);
                    color: var(--artist-track-icon-color);
                }

                .heart-button.favorited svg {
                    color: var(--artist-hero-fav-color);
                }
            }

            .song-duration {
                @include text('track-title-18px');
                text-align: right;
            }

            // "N plays" is not in the Figma: the time stays
            .song-duration.help-text {
                display: none;
            }

            .song-duration.has_help_text {
                opacity: 1;
            }

            .options-icon {
                width: var(--artist-track-icon-size);
                height: var(--artist-track-icon-size);
                aspect-ratio: auto;
                color: var(--artist-track-icon-color);

                &:hover {
                    background-color: transparent;
                }

                svg {
                    width: var(--artist-track-icon-size);
                    height: var(--artist-track-icon-size);
                    stroke: none;
                }
            }
        }
    }

    // narrow panel (own decision, the Figma only has the wide one): the album goes first, then the artist
    @container artist-panel (max-width: 760px) {
        .songlist-item.panel {
            grid-template-columns:
                calc(var(--artist-track-digits) * var(--artist-track-order-digit))
                minmax(0, 1fr) minmax(0, 1fr) max-content;

            > .song-album {
                display: none;
            }
        }
    }

    @container artist-panel (max-width: 540px) {
        .songlist-item.panel {
            grid-template-columns:
                calc(var(--artist-track-digits) * var(--artist-track-order-digit))
                minmax(0, 1fr) max-content;

            > .song-artists {
                display: none;
            }
        }
    }

    // very narrow panel (a small window with both side panels open): only the cover and the title, the time and the options
    @container artist-panel (max-width: 420px) {
        .songlist-item.panel {
            grid-template-columns: minmax(0, 1fr) max-content;

            > .index,
            > .options-and-duration .heart-icon {
                display: none;
            }
        }
    }
}
</style>
