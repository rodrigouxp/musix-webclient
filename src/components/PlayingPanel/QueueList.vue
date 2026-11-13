<template>
    <div class="queue-list">
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
                <template #default="{ item, index: at, active: visible }">
                    <DynamicScrollerItem :item="item" :active="visible" :size-dependencies="[item.kind]" :data-index="at" :data-track="item.index ?? -1">
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

        <!-- while a row is dragged: the row that follows the pointer and the line of the destination. They are outside
             of `.pp-list` because its mask would clip them -->
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
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import useTrackDrag from '@/composables/useTrackDrag'
import { QueueGroup, Track } from '@/interfaces'
import useInterface from '@/stores/interface'
import useQueue from '@/stores/queue'
import useTracklist from '@/stores/queue/tracklist'

import QueueSvg from '@/assets/icons/queue.svg'
import NoItems from '@/components/shared/NoItems.vue'
import QueueGroupHeader from './QueueGroupHeader.vue'
import QueueTrack from './QueueTrack.vue'

// The queue as a list, with the tracks of an album or of a playlist that went in whole under a header: the rows, the
// virtual scroller, the fade at its edges and the drag of tracks and groups. It is the list of the PlayingPanel (desktop)
// and of the Queue tab of NowPlaying (phone); the second one only changes the --playingpanel-* tokens in its scope.
type Row =
    | { id: string; kind: 'header'; group: QueueGroup; start: number }
    | { id: string; kind: 'track'; index: number; track: Track }
    | { id: string; kind: 'divider' }

const props = withDefaults(
    defineProps<{
        // the list is on screen: the PlayingPanel keeps it mounted while it is closed, and measures the list again when it opens
        shown?: boolean
    }>(),
    { shown: true }
)

const queue = useQueue()
const tracklist = useTracklist()
const { focusCurrentInSidebar, setScrollFunction } = useInterface()

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

watch([rows, hasItems, () => props.shown], async () => {
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
// fills what is left of its column (the title and the cover of the PlayingPanel take the rest)
.queue-list {
    display: flex;
    flex-direction: column;
    flex: 1 1 0;
    min-height: 0;

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
        // a finger that scrolls past the end of the list does not scroll what is behind it (the swipe down of NowPlaying
        // only starts when the list is at its top, and decides that itself)
        overscroll-behavior: contain;

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
