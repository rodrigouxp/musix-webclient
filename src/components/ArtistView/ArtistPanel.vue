<template>
    <div class="artist-panel panel-tracks" :style="{ '--artist-track-digits': digits }">
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
        <!-- the scrollbar goes over the page (and over the hero, which reaches the border): the native one would take a
             strip of the width; this one is drawn on top, as the thin one of the panels -->
        <div v-show="bar.visible" class="artist-scrollbar" aria-hidden="true">
            <div
                class="bar-thumb"
                :style="{ height: `${bar.height}px`, transform: `translateY(${bar.top}px)` }"
                @pointerdown="onThumbDown"
                @pointermove="onThumbMove"
                @pointerup="onThumbUp"
                @pointercancel="onThumbUp"
            ></div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { dropSources } from '@/enums'
import { Album, Track } from '@/interfaces'
import { useT } from '@/i18n'
import { getArtistAlbums, getArtistTracks } from '@/requests/artists'
import useArtistPageStore from '@/stores/pages/artist'
import useQueue from '@/stores/queue'
import useTracklist from '@/stores/queue/tracklist'
import useSettings from '@/stores/settings'
import useTracker from '@/stores/tracker'
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

// a play was counted while the page is open: the number of that track ("12 plays", on the hover of the row) follows
// it. The order of the list stays as it is until the page is opened again, so a row does not move under the pointer.
const tracker = useTracker()

watch(
    () => tracker.lastLogged,
    logged => {
        if (!logged) return

        for (const track of [...allTracks.value, ...store.tracks]) {
            if (track.trackhash === logged.trackhash) track.help_text = logged.help_text
        }
    }
)

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

// SECTION: the scrollbar over the page
const bar = reactive({ visible: false, height: 0, top: 0 })
let scroller: HTMLElement | null = null
let observer: ResizeObserver | undefined
let drag: { y: number; scrollTop: number } | null = null

// the thumb moves inside the track: the height of the page less the space that the ends leave (--layout-scrollbar-inset)
function trackSize() {
    const inset = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--layout-scrollbar-inset')) || 0
    return Math.max((scroller?.clientHeight ?? 0) - inset * 2, 0)
}

function updateBar() {
    if (!scroller) return

    const { scrollTop, scrollHeight, clientHeight } = scroller
    const track = trackSize()

    bar.visible = scrollHeight > clientHeight + 1

    if (!bar.visible) return

    bar.height = Math.min(Math.max((clientHeight / scrollHeight) * track, 32), track)
    bar.top = (scrollTop / (scrollHeight - clientHeight)) * (track - bar.height)
}

function onThumbDown(e: PointerEvent) {
    if (!scroller) return

    drag = { y: e.clientY, scrollTop: scroller.scrollTop }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}

function onThumbMove(e: PointerEvent) {
    if (!drag || !scroller) return

    const room = trackSize() - bar.height

    if (room > 0) {
        scroller.scrollTop = drag.scrollTop + ((e.clientY - drag.y) * (scroller.scrollHeight - scroller.clientHeight)) / room
    }
}

function onThumbUp() {
    drag = null
}

onMounted(() => {
    scroller = document.getElementById('artist-scroller')
    if (!scroller) return

    scroller.addEventListener('scroll', updateBar, { passive: true })
    observer = new ResizeObserver(updateBar)
    observer.observe(scroller)

    const wrapper = scroller.querySelector('.vue-recycle-scroller__item-wrapper')
    if (wrapper) observer.observe(wrapper)

    updateBar()
})

onBeforeUnmount(() => {
    scroller?.removeEventListener('scroll', updateBar)
    observer?.disconnect()
})

watch(items, () => nextTick(updateBar))

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
    position: relative;
    height: 100%;

    .artist-scroller {
        @include hideScrollbars;
        height: 100%;
        padding: 0;
        overflow-x: hidden;
        scrollbar-gutter: auto;
    }

    // the scrollbar over the page: 4px, round, neutral-700, 3px from the edge, as the thin one of the panels; the hover
    // is the next grey of the system. The ends keep the inset that the native one leaves.
    .artist-scrollbar {
        position: absolute;
        top: var(--layout-scrollbar-inset);
        bottom: var(--layout-scrollbar-inset);
        right: var(--artist-scrollbar-edge);
        width: var(--artist-scrollbar-thumb);
        z-index: 6;
        pointer-events: none;
        // it shows while the page scrolls and fades out after it, as the native ones (Global/scrollbars.scss)
        opacity: 0;
        transition: opacity 0.3s ease-out;

        .bar-thumb {
            width: 100%;
            border-radius: 400px;
            background-color: var(--color-neutral-700);
            pointer-events: auto;
            touch-action: none;

            &:hover {
                background-color: var(--color-neutral-500);
            }
        }
    }

    .artist-scroller[data-scrolling='true'] ~ .artist-scrollbar,
    .artist-scrollbar:hover {
        opacity: 1;
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
}
</style>
