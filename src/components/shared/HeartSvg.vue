<template>
    <button
        v-wave
        class="heart-button circular"
        :class="{ favorited: state }"
        :style="{
            color: color ? getTextColor(color) : '',
        }"
        @click="!no_emit && $emit('handleFav')"
    >
        <Motion
            :initial="{
                opacity: 0,
            }"
            :animate="{
                opacity: 1,
                transition: {
                    delay: 0.25,
                    duration: 0.5,
                },
            }"
        >
            <HeartSvg :class="{ 'icon-active': state }" />
        </Motion>
    </button>
</template>

<script setup lang="ts">
import { Motion } from 'motion/vue'

import HeartSvg from '@/assets/icons/figma/favorite.svg'

import { getTextColor } from '@/utils/colortools/shift'

defineProps<{
    state: Boolean | undefined
    no_emit?: Boolean
    color?: string
}>()

defineEmits<{
    // eslint-disable-next-line no-unused-vars
    (event: 'handleFav'): void
}>()
</script>

<style lang="scss">
$bg: rgb(255, 255, 255);

.heart-button {
    line-height: normal;
    align-items: center;
    gap: $smaller;
    border: none;
    color: $bg;
    aspect-ratio: 1.5;
    background: rgba(255, 255, 255, 0.13);

    div {
        height: max-content;
        transform: scale(1);

        // The heart of the Figma has two states in the same box (outline and filled, `favorite.svg`),
        // so both have the same size.
        svg {
            height: 1.55rem;
            width: 1.55rem;
            display: block;
        }
    }

    // favorited: error/300
    &.favorited svg {
        color: var(--color-error-300);
    }

    &:hover {
        background: transparent;
        border: none;
    }
}
</style>
