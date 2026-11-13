<template>
    <div class="queue-group-header">
        <div class="qg-name">
            <!-- the album icon turns while the header is shown (the playlist one stands still) -->
            <SoundtrackSvg v-if="group.type === 'album'" class="qg-icon qg-spin" />
            <PlaylistSvg v-else class="qg-icon" />
            <div ref="box" class="qg-text" :class="{ marquee: overflows }" :title="group.name">
                <div ref="run" class="qg-run">
                    <span ref="label" class="qg-label">{{ group.name }}</span>
                    <span v-if="overflows" class="qg-label" aria-hidden="true">{{ group.name }}</span>
                </div>
            </div>
        </div>
        <!-- the buttons act only on the tracks of this group -->
        <div class="qg-functions">
            <button class="qg-button" :title="$t('BottomBar.Shuffle')" :aria-label="$t('BottomBar.Shuffle')" @click="tracklist.shuffleGroup(group.id)">
                <ShuffleSvg />
            </button>
            <button
                class="qg-button"
                :class="{ on: repeating }"
                :title="$t('PlayingPanel.RepeatGroup')"
                :aria-label="$t('PlayingPanel.RepeatGroup')"
                :aria-pressed="repeating"
                @click="tracklist.toggleGroupRepeat(group.id)"
            >
                <RepeatSvg />
            </button>
            <button class="qg-button" :title="$t('PlayingPanel.RemoveGroup')" :aria-label="$t('PlayingPanel.RemoveGroup')" @click="tracklist.removeGroup(group.id)">
                <DeleteSvg />
            </button>
            <button class="qg-button qg-drag" :aria-label="$t('PlayingPanel.Move')" @pointerdown="$emit('dragstart', $event)">
                <DragSvg />
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { QueueGroup } from '@/interfaces'
import useTracklist from '@/stores/queue/tracklist'

import DeleteSvg from '@/assets/icons/figma/delete.svg'
import DragSvg from '@/assets/icons/figma/drag.svg'
import PlaylistSvg from '@/assets/icons/figma/add-to-playlist.svg'
import RepeatSvg from '@/assets/icons/figma/repeat.svg'
import ShuffleSvg from '@/assets/icons/figma/shuffle.svg'
import SoundtrackSvg from '@/assets/icons/figma/soundtrack.svg'

// AlbumQueue header of the Figma (node 12408:964): the icon, the name (one line) and the buttons of the group.
// A name that does not fit runs to the left in a loop, like a marquee.
const props = defineProps<{
    group: QueueGroup
    // the group repeats
    repeating?: boolean
}>()

defineEmits<{
    (e: 'dragstart', event: PointerEvent): void
}>()

const tracklist = useTracklist()

// pixels per second, and the pause at the start of every lap (seconds)
const SPEED = 30
const PAUSE = 1
// the space between the end of the name and its copy
const GAP = 32

const box = ref<HTMLElement>()
const label = ref<HTMLElement>()
const overflows = ref(false)
const textWidth = ref(0)

const run = ref<HTMLElement>()
let animation: Animation | null = null

// the name rests for the first second of the lap and then runs to the left at a constant speed; the copy that
// follows it takes its place, so the loop does not jump
function runMarquee() {
    animation?.cancel()
    animation = null

    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!overflows.value || still || !run.value) return

    const travel = textWidth.value + GAP
    const total = travel / SPEED + PAUSE

    animation = run.value.animate(
        [
            { transform: 'translateX(0)', offset: 0 },
            { transform: 'translateX(0)', offset: PAUSE / total },
            { transform: `translateX(${-travel}px)`, offset: 1 },
        ],
        { duration: total * 1000, iterations: Infinity, easing: 'linear' }
    )
}

watch([overflows, textWidth], async () => {
    await nextTick()
    runMarquee()
})

function measure() {
    const el = box.value
    const text = label.value

    if (!el || !text) return

    // the first label is the whole name: it is measured as it is, not as the run is laid out
    const width = text.getBoundingClientRect().width
    textWidth.value = width
    overflows.value = width > el.clientWidth + 0.5
}

let observer: ResizeObserver | null = null

onMounted(() => {
    measure()
    observer = new ResizeObserver(measure)
    if (box.value) observer.observe(box.value)
})

onBeforeUnmount(() => {
    observer?.disconnect()
    animation?.cancel()
})

watch(
    () => props.group.name,
    async () => {
        overflows.value = false
        await nextTick()
        measure()
    }
)
</script>

<style lang="scss">
.queue-group-header {
    display: flex;
    align-items: center;
    gap: var(--playingpanel-header-gap);
    box-sizing: border-box;
    height: calc(var(--playingpanel-header-height) + var(--playingpanel-header-pad-top));
    padding: var(--playingpanel-header-pad-top) 4px 0;
    color: var(--playingpanel-group-color);

    .qg-name {
        display: flex;
        align-items: center;
        flex: 1 1 0;
        gap: var(--playingpanel-header-name-gap);
        min-width: 0;
    }

    .qg-icon {
        flex-shrink: 0;
        width: var(--playingpanel-header-icon-size);
        height: var(--playingpanel-header-icon-size);
    }

    // soundtrack: half a turn counterclockwise in 2s, ease-in-out, in a loop (the drawing is the same every 180°)
    .qg-spin {
        animation: qg-spin 2s ease-in-out infinite;
    }

    .qg-text {
        @include text('paragraph-12px');
        flex: 1 1 0;
        min-width: 0;
        overflow: hidden;
        white-space: nowrap;

        .qg-run {
            display: inline-flex;
            width: max-content;
        }

        .qg-label + .qg-label {
            margin-left: 32px;
        }

        &:not(.marquee) .qg-run {
            max-width: 100%;
        }

    }

    .qg-functions {
        display: flex;
        align-items: center;
        flex-shrink: 0;
        gap: var(--playingpanel-button-gap);
    }

    .qg-button {
        flex-shrink: 0;
        display: grid;
        place-items: center;
        width: var(--playingpanel-button-hit);
        height: var(--playingpanel-button-hit);
        margin: calc((var(--playingpanel-button-size) - var(--playingpanel-button-hit)) / 2);
        padding: 0;
        border: none;
        background: transparent;
        color: var(--playingpanel-icon-color);
        transition: color 0.2s ease-out;

        svg {
            width: var(--playingpanel-button-size);
            height: var(--playingpanel-button-size);
        }

        &:hover,
        &:focus-visible {
            color: var(--playingpanel-icon-hover);
        }

        // a repeat that is on (not in the Figma: the color of the hover)
        &.on {
            color: var(--playingpanel-icon-on);
        }
    }

    .qg-drag {
        cursor: grab;
        touch-action: none;
    }
}

@keyframes qg-spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(-180deg);
    }
}

@media (prefers-reduced-motion: reduce) {
    .queue-group-header .qg-spin {
        animation: none;
    }

    // still, with an ellipsis
    .queue-group-header .qg-text.marquee {
        text-overflow: ellipsis;

        .qg-run {
            animation: none;
            width: auto;
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .qg-label + .qg-label {
            display: none;
        }
    }
}
</style>
