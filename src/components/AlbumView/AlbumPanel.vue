<template>
    <div class="album-panel-page">
        <div class="album-panel">
            <!-- "album" of the Figma: the cover and what the album is; it scrolls by itself only when it cannot fit -->
            <div ref="side" class="album-side" :style="{ '--album-cover-fit': coverFit }">
                <button class="album-cover" :aria-label="$t('AlbumView.ExpandCover')" @click="coverOpen = true">
                    <img v-if="album.image" :src="coverSrc" alt="" draggable="false" />
                </button>
                <div ref="functions" class="album-functions">
                    <!-- the year is part of the text of the title: it stays next to its last word, and goes to the next line
                         with the words when the title is too long -->
                    <h1 class="album-title">
                        {{ album.title }}<template v-if="year"
                            ><span class="album-year-gap">{{ ' ' }}</span
                            ><span class="album-year">{{ year }}</span></template
                        >
                    </h1>
                    <InfoLine class="album-infos" :items="infos" />
                    <div class="hero-buttons album-buttons">
                        <button
                            class="hero-btn hero-play"
                            :class="{ 'is-pause': isPlaying }"
                            :title="isPlaying ? $t('BottomBar.Pause') : $t('BottomBar.Play')"
                            :aria-label="isPlaying ? $t('BottomBar.Pause') : $t('BottomBar.Play')"
                            @click="togglePlay"
                        >
                            <PauseSvg v-if="isPlaying" />
                            <PlaySvg v-else />
                        </button>
                        <button
                            class="hero-btn hero-fav"
                            :class="{ favorited: album.is_favorite }"
                            :title="$t('BottomBar.Favorite')"
                            :aria-label="$t('BottomBar.Favorite')"
                            :aria-pressed="!!album.is_favorite"
                            @click="handleFav"
                        >
                            <FavoriteSvg :class="{ 'icon-active': album.is_favorite }" />
                        </button>
                        <button
                            ref="addButton"
                            class="hero-btn hero-fav"
                            :class="{ 'context-open': addOpen }"
                            :title="$t('BottomBar.Add')"
                            :aria-label="$t('BottomBar.Add')"
                            @click="showAdd"
                        >
                            <AddSvg />
                        </button>
                        <button
                            class="hero-btn hero-options"
                            :class="{ 'context-open': contextOpen }"
                            :aria-label="$t('AlbumView.Options')"
                            @click="showContext"
                        >
                            <OptionsSvg />
                        </button>
                    </div>
                    <div v-if="genres.length" class="album-genres">
                        <span v-for="genre in genres" :key="genre.genrehash" class="genre-pill">{{ genre.name }}</span>
                    </div>
                    <div v-if="artists.length" class="album-artists">
                        <ArtistThumb v-for="artist in artists" :key="artist.artisthash" :artist="artist" />
                    </div>
                </div>
            </div>

            <!-- "tracks" of the Figma: the rows of the artist page, with no album column -->
            <div ref="tracks" class="album-tracks panel-tracks" :style="{ '--artist-track-digits': digits }">
                <template v-for="item in rows" :key="rowKey(item)">
                    <AlbumDiscBar
                        v-if="item.is_album_disc_number"
                        :album_disc="item"
                        @play-disc="playDisc"
                    />
                    <SongItem
                        v-else
                        panel
                        hide_album
                        :track="item"
                        :index="item.track"
                        :source="dropSources.album"
                        @play-this="playFromAlbum(item.master_index ?? 0)"
                    />
                </template>
            </div>
        </div>

        <AlbumCoverOverlay
            :open="coverOpen"
            :src="coverOriginal"
            :placeholder="coverSrc"
            :title="album.title"
            @close="coverOpen = false"
        />
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import AddSvg from '@/assets/icons/figma/add.svg'
import FavoriteSvg from '@/assets/icons/figma/favorite.svg'
import OptionsSvg from '@/assets/icons/figma/options.svg'
import PauseSvg from '@/assets/icons/figma/pause.svg'
import PlaySvg from '@/assets/icons/figma/play.svg'
import { paths } from '@/config'
import { FromOptions, dropSources, favType } from '@/enums'
import { showAlbumAddMenu, showAlbumContextMenu } from '@/helpers/contextMenuHandler'
import favoriteHandler from '@/helpers/favoriteHandler'
import { useT } from '@/i18n'
import { Artist, Track } from '@/interfaces'
import useAlbumStore from '@/stores/pages/album'
import useQueue from '@/stores/queue'
import useTracklist from '@/stores/queue/tracklist'
import updatePageTitle from '@/utils/updatePageTitle'
import formatSeconds from '@/utils/useFormatSeconds'

import ArtistThumb from '@/components/FeedPanel/ArtistThumb.vue'
import InfoLine from '@/components/shared/InfoLine.vue'
import SongItem from '@/components/shared/SongItem.vue'
import AlbumCoverOverlay from './AlbumCoverOverlay.vue'
import AlbumDiscBar from './AlbumDiscBar.vue'

// The album page of the Figma (AlbumPanel, node 12506:4909) for the grid of panels: on the left the album (cover, title
// and year, numbers, buttons, genres, artists), on the right its tracks. Each side scrolls by itself; the cover gets
// smaller in a short window so the left side fits without scrolling.
const { t } = useT()
const store = useAlbumStore()
const queue = useQueue()
const tracklist = useTracklist()

const album = computed(() => store.info)

// SECTION: the album
const coverSrc = computed(() => paths.images.thumb.large + album.value.image + store.coverQuery)
const coverOriginal = computed(() => paths.images.thumb.original + album.value.image + store.coverQuery)
const coverOpen = ref(false)

const year = computed(() => (album.value.date ? new Date(album.value.date * 1000).getUTCFullYear() : ''))

// "14 tracks • 52 minutes": the same line as the artist page (the words in lowercase, as in the Figma)
const infos = computed(() => {
    const { trackcount, duration } = album.value
    const list: string[] = []

    if (trackcount) list.push(`${trackcount.toLocaleString()} ${t('Common.Track', trackcount).toLowerCase()}`)
    if (duration) list.push(formatSeconds(duration, true))

    return list
})

// the genres of the tags of the tracks (the server joins them in the album)
const genres = computed(() => album.value.genres ?? [])

// First the artists of the album, then everyone who takes part in any of its tracks (in the order of the tracks),
// each one once. The album answer has no image in its artists: it is the file of the artist (its hash).
const artists = computed(() => {
    const seen = new Set<string>()
    const list: Artist[] = []

    const add = (artist: Artist) => {
        if (!artist?.artisthash || seen.has(artist.artisthash)) return

        seen.add(artist.artisthash)
        list.push(<Artist>{ ...artist, image: artist.image || `${artist.artisthash}.webp` })
    }

    ;(album.value.albumartists ?? []).forEach(add)
    store.srcTracks.forEach(track => (track.artists ?? []).forEach(add))

    return list
})

// SECTION: buttons
const contextOpen = ref(false)
const addOpen = ref(false)
const addButton = ref<HTMLElement | null>(null)

// the queue is the one of this album (it was started from this page, a card or this button)
const isThisAlbum = computed(() => {
    const from = tracklist.from as { type?: FromOptions; albumhash?: string }
    return from?.type === FromOptions.album && from.albumhash === album.value.albumhash
})
const isPlaying = computed(() => isThisAlbum.value && queue.playing)

function playFromAlbum(index: number, tracks = store.srcTracks) {
    const { title, albumhash } = album.value
    tracklist.setFromAlbum(title, albumhash, tracks)
    queue.play(index)
}

function playDisc(disc: number) {
    playFromAlbum(
        0,
        store.srcTracks.filter(track => track.disc == disc)
    )
}

function togglePlay() {
    if (isThisAlbum.value) return queue.playPause()
    if (store.srcTracks.length) playFromAlbum(0)
}

function handleFav() {
    favoriteHandler(album.value.is_favorite, favType.album, album.value.albumhash, store.makeFavorite, store.removeFavorite)
}

function showAdd() {
    if (addButton.value) showAlbumAddMenu(addButton.value, album.value, addOpen)
}

function showContext(e: MouseEvent) {
    showAlbumContextMenu(e, contextOpen)
}

// SECTION: tracks
// the column of the number is as wide as the widest track number
const digits = computed(() => String(Math.max(...store.srcTracks.map(track => track.track || 0), 1)).length)

// "Disc 2" only splits the list when the album has more than one disc
const rows = computed(() =>
    Object.keys(store.discs).length > 1 ? store.tracks : store.tracks.filter(item => !item.is_album_disc_number)
)

function rowKey(item: Track) {
    return item.is_album_disc_number ? `disc-${item.album_page_disc_number}` : `${item.trackhash}-${item.master_index}`
}

// SECTION: the size of the cover
// The cover is a square as wide as the column (400px in the Figma). In a short window it takes what the texts under it
// leave of the height, down to --album-panel-cover-min; only then the column scrolls.
const side = ref<HTMLElement | null>(null)
const functions = ref<HTMLElement | null>(null)
const tracks = ref<HTMLElement | null>(null)
const coverFit = ref('100%')
let observer: ResizeObserver | undefined

function fitCover() {
    if (!side.value || !functions.value) return

    const style = getComputedStyle(side.value)
    const room =
        side.value.clientHeight -
        parseFloat(style.paddingTop) -
        parseFloat(style.paddingBottom) -
        parseFloat(style.rowGap || '0') -
        functions.value.offsetHeight

    coverFit.value = `${Math.max(Math.floor(room), 0)}px`
}

onMounted(() => {
    observer = new ResizeObserver(fitCover)
    if (side.value) observer.observe(side.value)
    if (functions.value) observer.observe(functions.value)
    fitCover()
})

onBeforeUnmount(() => observer?.disconnect())

// another album in the same page: both sides start at the top, the open cover closes
watch(
    () => album.value.albumhash,
    async () => {
        coverOpen.value = false
        await nextTick()
        side.value?.scrollTo({ top: 0 })
        tracks.value?.scrollTo({ top: 0 })
    }
)

// the title of the tab follows the album
watch(
    () => [album.value.title, album.value.albumartists?.[0]?.name],
    ([title, artist]) => {
        if (title) updatePageTitle(artist ? `${title} - ${artist}` : String(title))
    },
    { immediate: true }
)
</script>

<style lang="scss">
.album-panel-page {
    container: album-panel / inline-size;
    height: 100%;
}

.album-panel {
    display: flex;
    align-items: stretch;
    gap: var(--album-panel-gap);
    height: 100%;
    // the padding of the Figma (20) is in the two sides, so the scrollbar of each one runs the whole height of the panel
    // and the one of the tracks stays at the edge
    padding-left: var(--album-panel-padding);

    .album-side {
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: var(--album-panel-side-gap);
        flex: none;
        width: min(var(--album-panel-side-max), var(--album-panel-side-share));
        height: 100%;
        padding: var(--album-panel-padding) 0;
        overflow-x: hidden;
        overflow-y: auto;
        scrollbar-gutter: auto;
    }

    // the checkerboard of the hero while there is no cover
    .album-cover {
        display: block;
        flex: none;
        width: clamp(min(var(--album-panel-cover-min), 100%), var(--album-cover-fit, 100%), 100%);
        height: auto;
        aspect-ratio: 1;
        padding: 0;
        border: none;
        border-radius: var(--album-panel-cover-radius);
        overflow: hidden;
        cursor: zoom-in;
        background-color: var(--artist-hero-check-a);
        background-image: conic-gradient(
            var(--artist-hero-check-b) 25%,
            var(--artist-hero-check-a) 0 50%,
            var(--artist-hero-check-b) 0 75%,
            var(--artist-hero-check-a) 0
        );
        background-size: calc(var(--artist-hero-check-size) * 2) calc(var(--artist-hero-check-size) * 2);

        img {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: cover;
            -webkit-user-drag: none;
        }

        &:focus-visible {
            outline: solid 2px var(--color-neutral-100);
            outline-offset: 2px;
        }
    }

    .album-functions {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: var(--album-panel-text-gap);
        flex: none;
        min-width: 0;
    }

    .album-title {
        max-width: 100%;
        margin: 0;
        font-size: var(--album-panel-title-size);
        font-weight: var(--album-panel-title-weight);
        line-height: normal;
        color: var(--album-panel-title-color);
        overflow-wrap: anywhere;
    }

    // the space between the title and the year: a space character as wide as the gap of the Figma (it has no width of
    // its own, the letter-spacing gives it), so a line can break there and no gap is left at the start of a line
    .album-year-gap {
        font-size: 0;
        letter-spacing: var(--album-panel-title-gap);
        white-space: pre-wrap;
    }

    .album-year {
        @include text('album-title-24px');
        color: var(--album-panel-meta-color);
        white-space: nowrap;
    }

    .album-infos {
        padding-bottom: var(--album-panel-infos-pad-bottom);
        color: var(--album-panel-meta-color);
    }

    .album-buttons {
        gap: var(--album-panel-buttons-gap);
    }

    .album-genres {
        display: flex;
        flex-wrap: wrap;
        gap: var(--album-panel-genres-gap);
        padding: var(--album-panel-genres-padding);
    }

    .genre-pill {
        @include text('paragraph-14px');
        padding: var(--album-panel-pill-padding);
        border: var(--album-panel-pill-border);
        border-radius: 400px;
        color: var(--album-panel-meta-color);
        white-space: nowrap;
    }

    .album-artists {
        display: flex;
        flex-wrap: wrap;
        gap: var(--album-panel-artists-gap);
        max-width: 100%;

        .artist-thumb {
            width: var(--album-panel-artist-width);
            flex: none;

            .name {
                @include text('album-title-16px');
                color: var(--album-panel-artist-color);
            }
        }
    }

    .album-tracks {
        container-type: inline-size;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: var(--album-panel-tracks-gap);
        flex: 1;
        min-width: 0;
        height: 100%;
        // the scrollbar (7 of track, the thumb at 3 from the edge) is inside the 20 of the right padding
        padding: var(--album-panel-padding) calc(var(--album-panel-padding) - var(--feedpanel-scrollbar-width))
            var(--album-panel-padding) 0;
        overflow-x: hidden;
        overflow-y: scroll;

        .songlist-item.panel {
            flex: none;
        }

        // "Disc 2" between the discs (not in the Figma): a short line of text in line with the rows
        .album_disc_header {
            flex: none;
            height: auto;
            margin: 0;
            padding: var(--artist-track-padding);

            .disc_number {
                @include text('paragraph-14px');
                opacity: 1;
                color: var(--album-panel-meta-color);
            }
        }
    }
}

// narrow panel (own decision, the Figma only has the wide one): one column, the album over its tracks, one scroll
@container album-panel (max-width: 760px) {
    .album-panel {
        flex-direction: column;
        padding: 0 calc(var(--album-panel-padding) - var(--feedpanel-scrollbar-width)) 0 var(--album-panel-padding);
        overflow-x: hidden;
        overflow-y: scroll;

        .album-side {
            width: 100%;
            height: auto;
            padding-bottom: 0;
            overflow: visible;
        }

        .album-cover {
            width: min(var(--album-panel-side-max), 100%);
        }

        .album-tracks {
            flex: none;
            height: auto;
            padding: 0 0 var(--album-panel-padding) 0;
            overflow: visible;
        }
    }
}
</style>
