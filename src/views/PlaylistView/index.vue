<template>
    <div class="folder-view v-scroll-page" style="height: 100%" :class="{ isSmall, isMedium }">
        <DynamicScroller
            id="contentscroller"
            :items="scrollerItems"
            :min-item-size="64"
            class="scroller"
            style="height: 100%"
        >
            <template #default="{ item, index, active }">
                <DynamicScrollerItem
                    :item="item"
                    :active="active"
                    :size-dependencies="[item.props]"
                    :data-index="index"
                >
                    <component
                        :is="item.component"
                        :key="index"
                        v-bind="item.props"
                        @playThis="playFromPlaylistPage(item.props.index - 1)"
                        @dragStart="(event: PointerEvent, fromRow?: boolean) => onDragStart(event, item.props.index - 1, fromRow)"
                        @dragHover="ensureAllLoaded"
                    ></component>
                </DynamicScrollerItem>
            </template>
        </DynamicScroller>

        <!-- while a row is dragged: the row that follows the pointer and the line of the destination -->
        <template v-if="drag.state.active && dragTrack">
            <div
                class="drag-ghost"
                :style="{ left: drag.state.left + 'px', width: drag.state.width + 'px', top: drag.state.pointerY - 32 + 'px' }"
            >
                <SongItem :track="dragTrack" :index="drag.state.from + 1" :source="dropSources.playlist" reorderable held />
            </div>
            <div
                v-if="drag.state.lineY >= 0"
                class="drag-line"
                :style="{ left: drag.state.left + 'px', width: drag.state.width + 'px', top: drag.state.lineY + 'px' }"
            ></div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { onMounted, onUpdated, watch } from 'vue'

import useTrackDrag from '@/composables/useTrackDrag'
import { FromOptions } from '@/enums'
import { movePlaylistTrack } from '@/requests/playlists'
import { NotifType, useToast } from '@/stores/notification'

import { isMedium, isSmall, isSmallPhone } from '@/stores/content-width'
import { dropSources } from '@/enums'
import useQueue from '@/stores/queue'
import useTracklist from '@/stores/queue/tracklist'
import usePlaylistStore from '@/stores/pages/playlist'

import updatePageTitle from '@/utils/updatePageTitle'

import playlistSvg from '@/assets/icons/playlist.svg'
import Header from '@/components/PlaylistView/Header.vue'
import NoItems from '@/components/shared/NoItems.vue'
import SongItem from '@/components/shared/SongItem.vue'
import AfterHeader from '@/components/PlaylistView/AfterHeader.vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
import AlbumsFetcher from '@/components/ArtistView/AlbumsFetcher.vue'
import { useT } from '@/i18n'
import useTracker from '@/stores/tracker'

const { t } = useT()

const queue = useQueue()
const tracklist = useTracklist()
const playlist = usePlaylistStore()

// the number of plays comes with each track from the server; a play counted while the page is open updates that track
const tracker = useTracker()

watch(
    () => tracker.lastLogged,
    logged => {
        if (!logged) return

        for (const track of playlist.allTracks) {
            if (track.trackhash === logged.trackhash) track.help_text = logged.help_text
        }
    }
)

interface ScrollerItem {
    id: string | number
    component: typeof Header | typeof SongItem | typeof NoItems | typeof AlbumsFetcher
    size: number
    props?: {}
}

const getNoItemsComponent = () =>
    <ScrollerItem>{
        id: 'Noitems',
        component: NoItems,
        size: 300, // somehow it doesn't work, patched with CSS
        props: {
            icon: playlistSvg,
            flag: playlist.tracks.length === 0,
            title: t('Views.PlaylistView.NoTracks'),
            description: t('Views.PlaylistView.AddMoreDesc'),
        },
    }

// The rows can be dragged to another position, unless the list is filtered or it is a special
// playlist ("recently added"). The rest of the tracks is loaded the first time the user goes for a handle.
const reorderable = computed(() => Number.isInteger(playlist.info.id) && !playlist.query)

let loadingAll: Promise<void> | null = null
// the id of the playlist whose tracks were all asked for (a playlist with tracks that are not in the
// library has a count that the page never reaches: it is asked once)
let askedAllOf: number | null = null

function ensureAllLoaded(): Promise<void> {
    if (playlist.allTracks.length >= playlist.info.count || askedAllOf === playlist.info.id) return Promise.resolve()

    askedAllOf = playlist.info.id
    loadingAll ??= playlist.loadAllTracks(playlist.info.id).finally(() => (loadingAll = null))
    return loadingAll
}

const drag = useTrackDrag({
    scroller: () => document.getElementById('contentscroller'),
    rowsBefore: 2,
    onDrop: dropTrack,
})

const dragTrack = computed(() => playlist.allTracks[drag.state.from])

function onDragStart(event: PointerEvent, index: number, fromRow = false) {
    if (!reorderable.value) return

    drag.begin(event, index, ensureAllLoaded, fromRow)
}

/**
 * The track at `from` goes to `to`: the list changes at once, and goes back if the server says no.
 * If the queue is this playlist in the same order, the queue follows (the music does not stop).
 */
async function dropTrack(from: number, to: number) {
    const pid = playlist.info.id
    const hash = playlist.allTracks[from]?.trackhash

    if (!hash) return

    const before = playlist.allTracks.map(track => track.trackhash)
    const queued =
        tracklist.from.type === FromOptions.playlist &&
        (tracklist.from as { id?: number }).id === pid &&
        tracklist.tracklist.length === before.length &&
        before.every((trackhash, i) => tracklist.tracklist[i].trackhash === trackhash)

    // the same track can be in the playlist more than once: the server is told which one of them moves (and which one it goes
    // after), counted among the ones with the same trackhash
    const timesBefore = (list: string[], index: number) => list.slice(0, index).filter(h => h === list[index]).length
    const occurrence = timesBefore(before, from)

    playlist.moveTrack(from, to)
    if (queued) tracklist.moveTrack(from, to)

    // "right after the one above" (the start has none)
    const hashes = playlist.allTracks.map(track => track.trackhash)
    const after = to > 0 ? hashes[to - 1] : null

    if (await movePlaylistTrack(pid, hash, after, occurrence, to > 0 ? timesBefore(hashes, to - 1) : 0)) return

    // the server did not move it: the list goes back to what it was
    playlist.moveTrack(to, from)
    if (queued) tracklist.moveTrack(to, from)

    useToast().showNotification(t('Views.PlaylistView.MoveError'), NotifType.Error)
}

const scrollerItems = computed(() => {
    const header: ScrollerItem = {
        id: 'header',
        component: Header,
        size: isSmallPhone.value ? 24 * 16 : 18 * 16,
    }

    const afterHeader: ScrollerItem = {
        id: 'afterHeader',
        component: AfterHeader,
        size: 4 * 16,
    }

    // The scroller needs a different `id` for each row. A playlist can have the same track more than once (the same file), so
    // the file alone is not one: the same file twice made the scroller draw only one of the rows and leave the other blank. The
    // key is the file plus how many times it came before in the list.
    const seen = new Map<string, number>()

    const tracks = playlist.tracks.map(track => {
        const times = seen.get(track.filepath) ?? 0

        seen.set(track.filepath, times + 1)

        return {
            id: `${track.filepath}#${times}`,
            component: SongItem,
            props: {
                track: track,
                index: track.index + 1,
                is_last: track.index === playlist.tracks.length - 1,
                droppable: true,
                source: dropSources.playlist,
                reorderable: reorderable.value,
                dragging: drag.state.active && drag.state.from === track.index,
            },
            size: 64,
        }
    })

    const body = playlist.tracks.length === 0 ? [getNoItemsComponent()] : tracks

    // more pages while there are positions of the playlist that were not read (not `tracks.length`: a playlist can have tracks
    // that are not in the library, which come in no page, so a page can have fewer tracks than its size and the list stopped early)
    if (playlist.nextStart < playlist.info.count) {
        body.push({
            id: Math.random(),
            size: 1,
            component: AlbumsFetcher,
            props: {
                fetch_callback: () => playlist.fetchAll(playlist.info.id),
            },
        })
    }

    return [header, afterHeader, ...body]
})

async function playFromPlaylistPage(index: number) {
    const { name, id } = playlist.info

    if (playlist.tracks.length !== playlist.info.count) {
        // fetch all the tracks
        playlist.fetchAll(id, false, true)
    }

    tracklist.setFromPlaylist(name, id, playlist.allTracks)
    queue.play(index)
}

;[onMounted, onUpdated].forEach(() => {
    updatePageTitle(playlist.info.name)
})

// from a playlist to another one (the page stays, only the id changes): the other playlist is loaded
onBeforeRouteUpdate(async to => {
    if (String(to.params.pid) === String(playlist.info.id)) return

    playlist.allTracks = []
    await playlist.fetchAll(to.params.pid as unknown as number)
})

onBeforeRouteLeave(() => playlist.resetAll())
</script>

<style lang="scss">
.playlist-virtual-scroller {
    .nothing {
        height: 25rem;
    }
}

// the row that follows the pointer while it is dragged, and the line of the destination
.drag-ghost {
    position: fixed;
    z-index: 30;
    pointer-events: none;
    background: var(--menu-bg);
    border-radius: var(--menu-item-radius);
    box-shadow: var(--menu-shadow);
}

.drag-line {
    position: fixed;
    z-index: 31;
    height: 2px;
    margin-top: -1px;
    border-radius: 1px;
    pointer-events: none;
    // the old neutral/500 at 15% (no design in the Figma for this page: legacy token, see _musix-tokens.scss)
    background: color-mix(in srgb, var(--color-legacy-neutral-500) 15%, transparent);
}
</style>
