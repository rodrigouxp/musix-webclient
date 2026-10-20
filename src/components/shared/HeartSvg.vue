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
            <HeartFillSvg v-if="state" class="is-favorited" />
            <HeartSvg v-else />
        </Motion>
    </button>
</template>

<script setup lang="ts">
import { Motion } from 'motion/vue'

import HeartFillSvg from '@/assets/icons/figma/favorited.svg'
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

        // The glyph of the heart is 16.5px (as it always was). The Figma icons have a margin and the
        // filled heart is bigger than the outline one, so each has its own size.
        svg {
            height: 1.55rem;
            width: 1.55rem;
            display: block;
        }

        svg.is-favorited {
            height: 1.375rem;
            width: 1.375rem;
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
