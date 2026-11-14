<template>
    <div ref="box" class="marquee-text" :class="{ marquee: overflows, 'align-end': align === 'end' }" :title="text">
        <div ref="run" class="mt-run">
            <span ref="label" class="mt-label">{{ text }}</span>
            <span v-if="overflows" class="mt-label" aria-hidden="true">{{ text }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

// One line of text. When it does not fit it runs to the left in a loop, like a marquee (the headers of the albums of
// the PlayingPanel and the title of the PlayerBar on the phone). The font, the color and the width come from the parent.
const props = defineProps<{
    text: string
    // where the text rests when it fits (the loop always starts at the left)
    align?: 'start' | 'end'
}>()

// pixels per second, and the pause at the start of every lap (seconds)
const SPEED = 30
const PAUSE = 1
// the space between the end of the text and its copy
const GAP = 32

const box = ref<HTMLElement>()
const label = ref<HTMLElement>()
const run = ref<HTMLElement>()
const overflows = ref(false)
const textWidth = ref(0)

let animation: Animation | null = null

// the text rests for the first second of the lap and then runs to the left at a constant speed; the copy that
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

    // the first label is the whole text: it is measured as it is, not as the run is laid out
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
    () => props.text,
    async () => {
        overflows.value = false
        await nextTick()
        measure()
    }
)
</script>

<style lang="scss">
.marquee-text {
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;

    .mt-run {
        display: inline-flex;
        width: max-content;
    }

    .mt-label + .mt-label {
        margin-left: 32px;
    }

    &:not(.marquee) .mt-run {
        max-width: 100%;
    }

    &.align-end:not(.marquee) .mt-run {
        margin-left: auto;
    }
}

@media (prefers-reduced-motion: reduce) {
    // still, with an ellipsis
    .marquee-text.marquee {
        text-overflow: ellipsis;

        .mt-run {
            animation: none;
            width: auto;
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .mt-label + .mt-label {
            display: none;
        }
    }
}
</style>
