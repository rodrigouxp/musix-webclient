<template>
    <aside class="queue-panel" :class="{ open }" :aria-hidden="!open" :inert="!open">
        <div class="qp-inner">
            <div class="qp-title">
                <h2 class="qp-heading">{{ $t('QueuePanel.Title') }}</h2>
                <button v-if="hasItems" class="qp-clear" @click="queue.clearQueue()">{{ $t('QueuePanel.Clear') }}</button>
            </div>

            <div class="qp-list" :style="fadeStyle">
                <NoItems
                    :flag="!hasItems"
                    :title="$t('RightSidebar.NoQueueTitle')"
                    :description="$t('RightSidebar.NoQueueDescription')"
                    :icon="QueueSvg"
                />
                <DynamicScroller
                    v-if="hasItems"
                    ref="scroller"
                    class="qp-scroller"
                    :items="rows"
                    :min-item-size="16"
                    @mouseover="mouseover = true"
                    @mouseout="mouseover = false"
                >
                    <template #default="{ item, index: at, active }">
                        <DynamicScrollerItem :item="item" :active="active" :size-dependencies="[item.kind]" :data-index="at" :data-track="item.index ?? -1">
                            <div v-if="item.kind === 'header'" class="qp-row qp-row-header">
                                <QueueGroupHeader :group="item.group" />
                            </div>
                            <div v-else-if="item.kind === 'divider'" class="qp-row qp-row-divider"></div>
                            <div v-else class="qp-row qp-row-track">
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
            <div v-if="hasItems && queue.currenttrack" class="qp-thumb">
                <img class="qp-disc" :class="{ spinning: queue.playing }" :src="discUrl" alt="" />
                <img class="qp-cover" :src="paths.images.thumb.large + queue.currenttrack.image" alt="" />
            </div>
        </div>

        <!-- while a row is dragged: the row that follows the pointer and the line of the destination -->
        <template v-if="drag.state.active && dragTrack">
            <div
                class="qp-ghost"
                :style="{ left: drag.state.left + 'px', width: drag.state.width + 'px', top: drag.state.pointerY - 18 + 'px' }"
            >
                <QueueTrack :track="dragTrack" :index="drag.state.from" held />
            </div>
            <div
                v-if="drag.state.lineY >= 0"
                class="qp-line"
                :style="{ left: drag.state.left + 'px', width: drag.state.width + 'px', top: drag.state.lineY + 'px' }"
            ></div>
        </template>
    </aside>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { paths } from '@/config'
import useTrackDrag from '@/composables/useTrackDrag'
import { QueueGroup, Track } from '@/interfaces'
import useInterface from '@/stores/interface'
import useSettings from '@/stores/settings'
import useQueue from '@/stores/queue'
import useTracklist from '@/stores/queue/tracklist'

import QueueSvg from '@/assets/icons/queue.svg'
import discUrl from '@/assets/images/queue-disc.png'
import NoItems from '@/components/shared/NoItems.vue'
import QueueGroupHeader from './QueueGroupHeader.vue'
import QueueTrack from './QueueTrack.vue'

// QueuePanel of the Figma (node 12408:1964): the queue as a list, with the tracks of an album or of a playlist that
// went in whole under a header. Only the desktop, in the default layout (App.vue). It opens and closes with the
// thumbnail of the PlayerBar (settings.queue_panel_open).
type Row =
    | { id: string; kind: 'header'; group: QueueGroup }
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

        if (group && prev?.id !== group.id) out.push({ id: `h-${i}`, kind: 'header', group })

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
    '--qp-fade-top': fade.value.top ? 'var(--queuepanel-fade)' : '0px',
    '--qp-fade-bottom': fade.value.bottom ? 'var(--queuepanel-fade)' : '0px',
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
</script>

<style lang="scss">
// The panel is a column of the grid of the app (see app-grid.scss): its width goes from 0 to 280 (+ the gap of 8)
// when it opens, and what is inside keeps its size and is clipped.
.queue-panel {
    grid-area: r-sidebar;
    min-width: 0;
    min-height: 0;
    margin-left: var(--layout-panel-gap);
    overflow: hidden;
    visibility: hidden;
    transition: visibility 0s var(--queuepanel-duration);

    &.open {
        visibility: visible;
        transition-delay: 0s;
    }

    .qp-inner {
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: var(--queuepanel-gap);
        width: var(--queuepanel-width);
        height: 100%;
        padding: var(--queuepanel-padding);
        border: var(--layout-panel-border);
        border-radius: var(--layout-panel-radius);
    }

    .qp-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-shrink: 0;
        padding-right: 4px;
    }

    .qp-heading {
        @include text('paragraph-18px');
        margin: 0;
        color: var(--queuepanel-title-color);
    }

    .qp-clear {
        @include text('action-button-14px');
        height: auto;
        padding: 0;
        border: none;
        background: transparent;
        color: var(--queuepanel-clear-color);

        &:hover {
            text-decoration: underline;
        }
    }

    // the list ends before the thumbnail. The fade is a mask: transparent at the edge that has more to show
    .qp-list {
        flex: 1 1 0;
        min-height: 0;
        --qp-fade-top: 0px;
        --qp-fade-bottom: 0px;
        mask-image: linear-gradient(
            to bottom,
            transparent 0,
            #000 var(--qp-fade-top),
            #000 calc(100% - var(--qp-fade-bottom)),
            transparent 100%
        );
        transition: --qp-fade-top 0.2s, --qp-fade-bottom 0.2s;

        .nothing {
            max-width: none;
        }
    }

    .qp-scroller {
        height: 100%;
        box-sizing: border-box;
        // 4 of the scrollbar and 4 of room: the 8 of the right padding of the Figma
        padding-right: calc(var(--queuepanel-list-pad-right) - var(--queuepanel-scrollbar-width));
        // not the side margin that the other lists of the app get
        padding-left: 0;
        scrollbar-gutter: auto;
        overflow-x: hidden;

        &::-webkit-scrollbar {
            width: var(--queuepanel-scrollbar-width);
            background: transparent;
        }

        &::-webkit-scrollbar-track {
            background: transparent;
        }

        &::-webkit-scrollbar-thumb {
            background-color: var(--color-neutral-700);
            border-radius: 400px;
            border: 0;
        }
    }

    // the rows of the virtual list keep the spaces of the Figma as padding (4 between tracks, 8 under a header)
    .qp-row-track {
        padding-bottom: var(--queuepanel-item-gap);
    }

    .qp-row-header {
        padding-bottom: var(--queuepanel-group-gap);
    }

    .qp-row-divider {
        height: 1px;
        margin-bottom: var(--queuepanel-item-gap);
        background-color: var(--color-neutral-700);
    }

    // 266 x 322: the vinyl is a square of the width, 55 above the cover; the cover is a square at the bottom
    .qp-thumb {
        position: relative;
        flex-shrink: 0;
        align-self: center;
        height: min(var(--queuepanel-thumb-height), 45%);
        aspect-ratio: var(--queuepanel-thumb-ratio);
        border-radius: var(--queuepanel-cover-radius);
    }

    .qp-disc {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        aspect-ratio: 1;
        object-fit: contain;
        // clockwise, one turn in 8s, only while the music plays (paused it stays where it is)
        animation: qp-disc-spin var(--queuepanel-disc-duration) linear infinite;
        animation-play-state: paused;

        &.spinning {
            animation-play-state: running;
        }
    }

    .qp-cover {
        position: absolute;
        bottom: 0;
        left: -1px;
        right: 0;
        width: calc(100% + 1px);
        aspect-ratio: 1;
        box-sizing: border-box;
        object-fit: cover;
        border: var(--queuepanel-cover-border);
        border-radius: var(--queuepanel-cover-radius);
    }
}

@keyframes qp-disc-spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

@media (prefers-reduced-motion: reduce) {
    .queue-panel .qp-disc {
        animation: none;
    }
}

// the row that follows the pointer while it is dragged, and the line of the destination
.qp-ghost {
    position: fixed;
    z-index: 30;
    pointer-events: none;
    background: var(--menu-bg);
    border-radius: var(--queuepanel-track-radius);
    box-shadow: var(--menu-shadow);
}

.qp-line {
    position: fixed;
    z-index: 31;
    height: 2px;
    margin-top: -1px;
    border-radius: 1px;
    pointer-events: none;
    background: var(--color-neutral-300);
}
</style>
