<template>
    <aside class="playing-panel" :class="{ open }" :aria-hidden="!open" :inert="!open">
        <div class="pp-inner">
            <div class="pp-title">
                <h2 class="pp-heading">{{ $t('PlayingPanel.Title') }}</h2>
                <button
                    v-if="hasItems"
                    class="pp-clear"
                    :title="$t('PlayingPanel.Clear')"
                    :aria-label="$t('PlayingPanel.Clear')"
                    @click="queue.clearQueueKeepingCurrent()"
                >
                    <DeleteSvg />
                </button>
            </div>

            <div class="pp-list" :style="fadeStyle">
                <NoItems
                    :flag="!hasItems"
                    :title="$t('RightSidebar.NoQueueTitle')"
                    :description="$t('RightSidebar.NoQueueDescription')"
                    :icon="QueueSvg"
                />
                <DynamicScroller
                    v-if="hasItems"
                    ref="scroller"
                    class="pp-scroller"
                    :items="rows"
                    :min-item-size="16"
                    @mouseover="mouseover = true"
                    @mouseout="mouseover = false"
                >
                    <template #default="{ item, index: at, active }">
                        <DynamicScrollerItem :item="item" :active="active" :size-dependencies="[item.kind]" :data-index="at" :data-track="item.index ?? -1">
                            <div v-if="item.kind === 'header'" class="pp-row pp-row-header">
                                <QueueGroupHeader
                                    :group="item.group"
                                    :repeating="tracklist.repeatGroups.includes(item.group.id)"
                                    @dragstart="onGroupDragStart($event, item.group, item.start)"
                                />
                            </div>
                            <div v-else-if="item.kind === 'divider'" class="pp-row pp-row-divider"></div>
                            <div v-else class="pp-row pp-row-track">
                                <QueueTrack
                                    :track="item.track"
                                    :index="item.index"
                                    :is-current="item.index === queue.currentindex"
                                    @play="queue.play(item.index)"
                                    @dragstart="onDragStart($event, item.index)"
                                />
                            </div>
                        </DynamicScrollerItem>
                    </template>
                </DynamicScroller>
            </div>

            <!-- the album that is playing, with a vinyl behind it that turns while the music plays -->
            <div v-if="hasItems && queue.currenttrack" class="pp-thumb">
                <img class="pp-disc" :class="{ spinning: queue.playing }" :src="discUrl" alt="" />
                <component
                    :is="queue.currenttrack.albumhash ? 'RouterLink' : 'div'"
                    class="pp-cover-link"
                    :to="queue.currenttrack.albumhash ? { name: Routes.album, params: { albumhash: queue.currenttrack.albumhash } } : undefined"
                    :title="$t('BottomBar.GoToAlbum')"
                >
                    <img class="pp-cover" :src="paths.images.thumb.large + queue.currenttrack.image" alt="" />
                    <Bitrate />
                </component>
            </div>
        </div>

        <!-- while a row is dragged: the row that follows the pointer and the line of the destination -->
        <template v-if="drag.state.active && dragTrack">
            <div
                class="pp-ghost"
                :style="{ left: drag.state.left + 'px', width: drag.state.width + 'px', top: drag.state.pointerY - 18 + 'px' }"
            >
                <QueueTrack :track="dragTrack" :index="drag.state.from" held />
            </div>
            <div
                v-if="drag.state.lineY >= 0"
                class="pp-line"
                :style="{ left: drag.state.left + 'px', width: drag.state.width + 'px', top: drag.state.lineY + 'px' }"
            ></div>
        </template>
        <!-- the same for a whole group: its header follows the pointer -->
        <template v-if="groupDrag.state.active && draggedGroup">
            <div
                class="pp-ghost pp-ghost-group"
                :style="{ left: groupDrag.state.left + 'px', width: groupDrag.state.width + 'px', top: groupDrag.state.pointerY - 8 + 'px' }"
            >
                <QueueGroupHeader :group="draggedGroup" />
            </div>
            <div
                v-if="groupDrag.state.lineY >= 0"
                class="pp-line"
                :style="{ left: groupDrag.state.left + 'px', width: groupDrag.state.width + 'px', top: groupDrag.state.lineY + 'px' }"
            ></div>
        </template>
    </aside>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { paths } from '@/config'
import useTrackDrag from '@/composables/useTrackDrag'
import { QueueGroup, Track } from '@/interfaces'
import { Routes } from '@/router'
import useInterface from '@/stores/interface'
import useSettings from '@/stores/settings'
import useQueue from '@/stores/queue'
import useTracklist from '@/stores/queue/tracklist'

import DeleteSvg from '@/assets/icons/figma/delete.svg'
import QueueSvg from '@/assets/icons/queue.svg'
import discUrl from '@/assets/images/queue-disc.png'
import Bitrate from '@/components/LeftSidebar/NP/Bitrate.vue'
import NoItems from '@/components/shared/NoItems.vue'
import QueueGroupHeader from './QueueGroupHeader.vue'
import QueueTrack from './QueueTrack.vue'

// PlayingPanel of the Figma (node 12408:1964): the queue as a list, with the tracks of an album or of a playlist that
// went in whole under a header. Only the desktop, above 600px (App.vue). It opens and closes with the
// thumbnail of the PlayerBar (settings.queue_panel_open).
type Row =
    | { id: string; kind: 'header'; group: QueueGroup; start: number }
    | { id: string; kind: 'track'; index: number; track: Track }
    | { id: string; kind: 'divider' }

const settings = useSettings()
const queue = useQueue()
const tracklist = useTracklist()
const { focusCurrentInSidebar, setScrollFunction } = useInterface()

const open = computed(() => settings.queue_panel_open)
const hasItems = computed(() => tracklist.tracklist.length > 0)

// a header before the first track of a group, and a divider after its last one (when something follows)
const rows = computed<Row[]>(() => {
    const list = tracklist.tracklist
    const out: Row[] = []

    list.forEach((track, i) => {
        const group = track.group
        const prev = list[i - 1]?.group
        const next = list[i + 1]

        if (group && prev?.id !== group.id) out.push({ id: `h-${i}`, kind: 'header', group, start: i })

        // ids are queue positions: the same track can be in the queue more than once
        out.push({ id: `t-${i}`, kind: 'track', index: i, track })

        if (group && next && next.group?.id !== group.id) out.push({ id: `d-${i}`, kind: 'divider' })
    })

    return out
})

// ---- the scroll: a fade at the edges that still have more to show ----
const scroller = ref<any>(null)
const mouseover = ref(false)
const fade = ref({ top: false, bottom: false })

const fadeStyle = computed(() => ({
    '--pp-fade-top': fade.value.top ? 'var(--playingpanel-fade)' : '0px',
    '--pp-fade-bottom': fade.value.bottom ? 'var(--playingpanel-fade)' : '0px',
}))

function updateFade() {
    const el: HTMLElement | undefined = scroller.value?.$el

    if (!el) {
        fade.value = { top: false, bottom: false }
        return
    }

    fade.value = {
        top: el.scrollTop > 1,
        bottom: el.scrollTop + el.clientHeight < el.scrollHeight - 1,
    }
}

let observer: ResizeObserver | null = null

function watchScroller() {
    const el: HTMLElement | undefined = scroller.value?.$el

    observer?.disconnect()

    if (!el) return updateFade()

    el.addEventListener('scroll', updateFade, { passive: true })
    observer = new ResizeObserver(updateFade)
    observer.observe(el)
    updateFade()
}

watch([rows, hasItems, open], async () => {
    await nextTick()
    watchScroller()
})

// ---- the song that is playing comes into view (one row above it) ----
function scrollToCurrent() {
    const at = rows.value.findIndex(r => r.kind === 'track' && r.index === queue.currentindex)

    if (at < 0) return

    scroller.value?.scrollToItem(Math.max(at - 1, 0))
}

onMounted(() => {
    setScrollFunction(scrollToCurrent, mouseover)
    focusCurrentInSidebar()
    nextTick(watchScroller)
})

onBeforeUnmount(() => {
    setScrollFunction(() => {}, null)
    observer?.disconnect()
})

// ---- drag: the handle of a track moves it inside the queue ----
const drag = useTrackDrag({
    scroller: () => scroller.value?.$el ?? null,
    rowsBefore: 0,
    // the rows of tracks carry their position in the queue; headers and dividers are not slots
    rowIndex: el => Number(el.dataset.track ?? -1),
    onDrop: (from, to) => tracklist.moveTrack(from, to),
})

const dragTrack = computed(() => tracklist.tracklist[drag.state.from])

function onDragStart(event: PointerEvent, index: number) {
    drag.begin(event, index)
}

// drag of a whole group: the slots are the same as for a track, and the group goes to the one that is chosen
const draggedGroup = ref<QueueGroup | null>(null)

const groupDrag = useTrackDrag({
    scroller: () => scroller.value?.$el ?? null,
    rowsBefore: 0,
    rowIndex: el => Number(el.dataset.track ?? -1),
    // `to` is the position after the move of one row; the slot (before the move) comes back from it
    onDrop: (from, to) => {
        if (draggedGroup.value) tracklist.moveGroup(draggedGroup.value.id, to >= from ? to + 1 : to)
    },
})

function onGroupDragStart(event: PointerEvent, group: QueueGroup, start: number) {
    draggedGroup.value = group
    groupDrag.begin(event, start)
}
</script>

<style lang="scss">
// The panel is a column of the grid of the app (see app-grid.scss): its width goes from 0 to 280 (+ the gap of 8)
// when it opens, and what is inside keeps its size and is clipped.
.playing-panel {
    grid-area: r-sidebar;
    min-width: 0;
    min-height: 0;
    margin-left: var(--layout-panel-gap);
    overflow: hidden;
    visibility: hidden;
    transition: visibility 0s var(--playingpanel-duration);

    &.open {
        visibility: visible;
        transition-delay: 0s;
    }

    .pp-inner {
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: var(--playingpanel-gap);
        width: var(--playingpanel-width);
        height: 100%;
        padding: var(--playingpanel-padding);
        border: var(--layout-panel-border);
        border-radius: var(--layout-panel-radius);
    }

    // "Now playing" centered; the delete button (clear the queue) sits at the right end of the same line
    .pp-title {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .pp-heading {
        @include text('paragraph-18px');
        margin: 0;
        color: var(--playingpanel-title-color);
    }

    // the icon "delete" is 14 x 14 (its vector is 9.33 x 12); the click area is bigger (24, own decision) and goes out of
    // the line by what it has over the icon, so the icon keeps the right edge
    .pp-clear {
        position: absolute;
        top: 50%;
        right: calc(var(--playingpanel-clear-pad-right) - (var(--playingpanel-button-hit) - var(--playingpanel-clear-size)) / 2);
        display: grid;
        place-items: center;
        width: var(--playingpanel-button-hit);
        height: var(--playingpanel-button-hit);
        padding: 0;
        border: none;
        border-radius: 400px;
        background: transparent;
        color: var(--playingpanel-clear-color);
        cursor: pointer;
        transform: translateY(-50%);

        svg {
            display: block;
            width: var(--playingpanel-clear-size);
            height: var(--playingpanel-clear-size);
        }

        &:hover {
            background-color: var(--hover-bg);
        }
    }

    // the list ends before the thumbnail. The fade is a mask: transparent at the edge that has more to show
    .pp-list {
        flex: 1 1 0;
        min-height: 0;
        --pp-fade-top: 0px;
        --pp-fade-bottom: 0px;
        mask-image: linear-gradient(
            to bottom,
            transparent 0,
            #000 var(--pp-fade-top),
            #000 calc(100% - var(--pp-fade-bottom)),
            transparent 100%
        );
        transition: --pp-fade-top 0.2s, --pp-fade-bottom 0.2s;

        .nothing {
            max-width: none;
        }
    }

    .pp-scroller {
        height: 100%;
        box-sizing: border-box;
        // 4 of the scrollbar and 4 of room: the 8 of the right padding of the Figma
        padding-right: calc(var(--playingpanel-list-pad-right) - var(--playingpanel-scrollbar-width));
        // not the side margin that the other lists of the app get
        padding-left: 0;
        scrollbar-gutter: auto;
        overflow-x: hidden;

        &::-webkit-scrollbar {
            width: var(--playingpanel-scrollbar-width);
            background: transparent;
        }

        &::-webkit-scrollbar-track {
            background: transparent;
        }

        // the thumb shows while the list scrolls and fades out after it (Global/scrollbars.scss), or with the pointer on it
        &::-webkit-scrollbar-thumb {
            background-color: var(--scrollbar-thumb);
            border-radius: 400px;
            border: 0;
        }

        &::-webkit-scrollbar-thumb:hover {
            background-color: var(--color-neutral-500);
        }
    }

    // the rows of the virtual list keep the spaces of the Figma as padding (4 between tracks, 8 under a header)
    .pp-row-track {
        padding-bottom: var(--playingpanel-item-gap);
    }

    .pp-row-header {
        padding-bottom: var(--playingpanel-group-gap);
    }

    .pp-row-divider {
        height: 1px;
        margin-bottom: var(--playingpanel-item-gap);
        background-color: var(--color-neutral-700);
    }

    // the vinyl is a square of the width, 55 above the cover; the cover is a square under it. 8 from each border of
    // the panel (the padding of the panel has 4 on the right: the thumbnail takes the other 4 itself). On a short
    // window it gets smaller (never more than 45% of the height)
    .pp-thumb {
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        flex-shrink: 0;
        align-self: flex-start;
        // the cover is a square of the width; the vinyl peeks out above it by 55/264 of that width (the Figma numbers
        // at 280), so the whole set scales with the panel. On a short window it is never taller than 45% of it
        width: min(calc(100% - var(--playingpanel-thumb-gap-right)), calc(45vh * var(--playingpanel-thumb-ratio)));
        aspect-ratio: calc(1 / (1 + var(--playingpanel-disc-lift-ratio)));
        border-radius: var(--playingpanel-cover-radius);
    }

    .pp-disc {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        aspect-ratio: 1;
        object-fit: contain;
        // clockwise, one turn in 8s, only while the music plays (paused it stays where it is)
        animation: pp-disc-spin var(--playingpanel-disc-duration) linear infinite;
        animation-play-state: paused;

        &.spinning {
            animation-play-state: running;
        }
    }

    .pp-cover-link {
        position: relative;
        display: block;
        cursor: pointer;
    }

    // the file type and the bitrate (FLAC • 3200) over the lower left corner of the cover; the component is the one of
    // the old card of the left panel (LeftSidebar/NP/Bitrate.vue), here with the tag tokens of the app
    .pp-cover-link .bitrate {
        @include text('paragraph-12px');
        bottom: var(--playingpanel-format-inset);
        left: var(--playingpanel-format-inset);
        max-width: calc(100% - 2 * var(--playingpanel-format-inset));
        padding: var(--playingpanel-format-padding);
        border-radius: var(--playingpanel-format-radius);
        background-color: var(--playingpanel-format-bg);
        color: var(--playingpanel-format-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .pp-cover {
        display: block;
        width: 100%;
        aspect-ratio: 1;
        box-sizing: border-box;
        object-fit: cover;
        border: var(--playingpanel-cover-border);
        border-radius: var(--playingpanel-cover-radius);
    }
}

@keyframes pp-disc-spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

@media (prefers-reduced-motion: reduce) {
    .playing-panel .pp-disc {
        animation: none;
    }
}

// the row that follows the pointer while it is dragged, and the line of the destination
.pp-ghost {
    position: fixed;
    z-index: 30;
    pointer-events: none;
    background: var(--menu-bg);
    border-radius: var(--playingpanel-track-radius);
    box-shadow: var(--menu-shadow);
}

.pp-line {
    position: fixed;
    z-index: 31;
    height: 2px;
    margin-top: -1px;
    border-radius: 1px;
    pointer-events: none;
    background: var(--color-neutral-300);
}
</style>
