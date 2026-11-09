<template>
    <div ref="bar" class="artist-tabs" role="tablist" :aria-label="$t('ArtistView.Title')" @keydown="onKeydown">
        <button
            v-for="tab in tabs"
            :id="`artist-tab-${tab.id}`"
            :key="tab.id"
            class="artist-tab"
            :class="{ active: tab.id === modelValue }"
            role="tab"
            type="button"
            :aria-selected="tab.id === modelValue"
            :tabindex="tab.id === modelValue ? 0 : -1"
            @click="$emit('update:modelValue', tab.id)"
        >
            {{ tab.label }}
        </button>
    </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'

// TabBar of the Figma (node 12461:2631): one tab per kind of release, the open one in white with a line on the
// bar. Left and right arrows (and Home and End) move between the tabs; if they do not fit, the bar scrolls sideways.
const props = defineProps<{
    tabs: { id: string; label: string }[]
    modelValue: string
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', id: string): void
}>()

const bar = ref<HTMLElement | null>(null)

function focusTab(id: string) {
    emit('update:modelValue', id)
    nextTick(() => document.getElementById(`artist-tab-${id}`)?.focus())
}

function onKeydown(e: KeyboardEvent) {
    const index = props.tabs.findIndex(tab => tab.id === props.modelValue)
    if (index < 0) return

    const last = props.tabs.length - 1
    let next = -1

    if (e.key === 'ArrowRight') next = index === last ? 0 : index + 1
    else if (e.key === 'ArrowLeft') next = index === 0 ? last : index - 1
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = last

    if (next < 0) return

    e.preventDefault()
    focusTab(props.tabs[next].id)
}

// the open tab stays in view when the bar scrolls
watch(
    () => props.modelValue,
    id => {
        nextTick(() => document.getElementById(`artist-tab-${id}`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' }))
    }
)
</script>

<style lang="scss">
.artist-tabs {
    position: relative;
    box-sizing: border-box;
    display: flex;
    align-items: stretch;
    gap: var(--artist-tabs-gap);
    height: var(--artist-tabs-height);
    padding: var(--artist-tabs-padding);
    background-color: var(--color-background);
    // the line of the bar, as wide as the bar (an inset shadow does not scroll with the tabs)
    box-shadow: inset 0 calc(-1 * var(--artist-tabs-line-width)) 0 0 var(--artist-tabs-line-color);
    // the tabs that do not fit scroll sideways, without a visible scrollbar
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;

    &::-webkit-scrollbar {
        display: none;
    }

    .artist-tab {
        @include text('action-button-16px');
        // the global `button` has a font size with !important and a height of 2rem
        font-size: var(--text-action-button-16px-size) !important;
        height: auto;
        position: relative;
        flex: none;
        box-sizing: border-box;
        padding: var(--artist-tab-padding);
        border: none;
        // the line of the open tab (neutral-300) sits over the line of the bar; the others keep the space
        border-bottom: var(--artist-tabs-line-width) solid transparent;
        border-radius: 0;
        background: transparent;
        color: var(--artist-tab-color);
        white-space: nowrap;
        cursor: pointer;
        transition: color 0.15s ease-out;

        &:hover {
            color: var(--artist-tab-hover-color);
            background: transparent;
        }

        &.active {
            color: var(--artist-tab-active-color);
            border-bottom-color: var(--artist-tab-active-line-color);
        }

        &:focus-visible {
            outline: 2px solid var(--artist-tab-active-line-color);
            outline-offset: -2px;
        }
    }
}
</style>
