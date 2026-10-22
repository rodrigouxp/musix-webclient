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
                        @dragStart="onDragStart($event, item.props.index - 1)"
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
                <SongItem :track="dragTrack" :index="drag.state.from + 1" :source="dropSources.playlist" />
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
import { onMounted, onUpdated } from 'vue'

import useTrackDrag from '@/composables/useTrackDrag'
import { FromOptions } from '@/enums'
import { movePlaylistTrack } from '@/requests/playlists'
import { NotifType, useToast } from '@/stores/notification'

import { isMedium, isSmall, isSmallPhone, track_limit } from '@/stores/content-width'
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

const { t } = useT()

const queue = useQueue()
const tracklist = useTracklist()
const playlist = usePlaylistStore()

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

function ensureAllLoaded(): Promise<void> {
    if (playlist.allTracks.length >= playlist.info.count) return Promise.resolve()

    loadingAll ??= playlist.fetchAll(playlist.info.id, false, true).finally(() => (loadingAll = null))
    return loadingAll
}

const drag = useTrackDrag({
    scroller: () => document.getElementById('contentscroller'),
    rowsBefore: 2,
    onDrop: dropTrack,
})

const dragTrack = computed(() => playlist.allTracks[drag.state.from])

function onDragStart(event: PointerEvent, index: number) {
    if (!reorderable.value) return

    drag.begin(event, index, ensureAllLoaded)
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

    playlist.moveTrack(from, to)
    if (queued) tracklist.moveTrack(from, to)

    if (await movePlaylistTrack(pid, hash, to)) return

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

    const tracks = playlist.tracks.map(track => {
        return {
            id: track.filepath,
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

    if (playlist.tracks.length >= track_limit.value) {
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
    // neutral/500 of the design system at 15%
    background: color-mix(in srgb, var(--color-neutral-500) 15%, transparent);
}
</style>
