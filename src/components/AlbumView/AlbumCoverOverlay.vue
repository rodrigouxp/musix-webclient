<template>
    <Teleport to="body">
        <Transition name="album-cover-overlay">
            <div
                v-if="open"
                class="album-cover-overlay"
                role="dialog"
                aria-modal="true"
                :aria-label="title"
                @click="emit('close')"
            >
                <!-- the bigger file loads over the one the page already shows, so there is always a cover on screen -->
                <div class="cover" :style="{ backgroundImage: `url('${placeholder}')` }" @click.stop>
                    <img :src="src" :alt="title" draggable="false" />
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'

// The cover of the album opened over the app (album-cover-expanded of the Figma, node 12508:5721): centered, on a
// black background at 35%, with a dissolve of 150 ms; a click outside it (or Esc) closes it.
const props = defineProps<{
    open: boolean
    // the original file, and the one the page already has (shown while the original loads)
    src: string
    placeholder: string
    title: string
}>()

const emit = defineEmits<{
    (e: 'close'): void
}>()

function onKey(e: KeyboardEvent) {
    if (e.key !== 'Escape') return

    e.stopPropagation()
    emit('close')
}

watch(
    () => props.open,
    open => {
        if (open) window.addEventListener('keydown', onKey, true)
        else window.removeEventListener('keydown', onKey, true)
    },
    { immediate: true }
)

onBeforeUnmount(() => window.removeEventListener('keydown', onKey, true))
</script>

<style lang="scss">
.album-cover-overlay {
    position: fixed;
    inset: 0;
    z-index: 30;
    display: grid;
    place-items: center;
    background-color: var(--album-cover-overlay-bg);

    // a square as big as the window lets it be, up to the 796 of the Figma
    .cover {
        width: min(
            var(--album-cover-overlay-size),
            100vh - var(--album-cover-overlay-margin-y),
            100vw - var(--album-cover-overlay-margin-x)
        );
        aspect-ratio: 1;
        border-radius: var(--album-panel-cover-radius);
        overflow: hidden;
        background-size: cover;
        background-position: center;

        img {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: cover;
            -webkit-user-drag: none;
        }
    }
}

.album-cover-overlay-enter-active,
.album-cover-overlay-leave-active {
    transition: opacity var(--album-cover-overlay-fade) ease-out;
}

.album-cover-overlay-enter-from,
.album-cover-overlay-leave-to {
    opacity: 0;
}
</style>
