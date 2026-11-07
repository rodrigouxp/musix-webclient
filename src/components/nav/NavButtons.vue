<template>
    <div id="back-forward" class="">
        <button class="back" @click="$router.back()">
            <component :is="icon" />
        </button>
        <button class="forward" @click="$router.forward()">
            <component :is="icon" />
        </button>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import useSettings from '@/stores/settings'

import ChevronSvg from '@/assets/icons/figma/chevron.svg'
import ArrowSvg from '../../assets/icons/right-arrow.svg'

const settings = useSettings()

// the TopBar of the Figma (default layout) uses the `chevron` Icon; the alternative layout keeps its arrow
const icon = computed(() => (settings.is_alt_layout ? ArrowSvg : ChevronSvg))
</script>

<style lang="scss">
#back-forward {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $medium;
    padding-right: 1rem;
    border-right: 1px solid $gray5;
    height: max-content;

    & > * {
        width: 2.15rem;
        height: 2.15rem;
        aspect-ratio: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 0;
        border-radius: 5rem;
        background-color: transparent;
        border: 1px solid $gray5;

        &:hover {
            background-color: $gray4;
            border-color: $gray4;
        }

        svg {
            transform: scale(0.96);
            transition: transform 0.2s ease;
        }

        &:active > svg {
            transform: scale(0.76);
        }
    }

    .back {
        transform: rotate(180deg);
    }
}

// The TopBar of the Figma (node 12395:365, page-buttons): two circles of 36, 16 apart, with a border of 1 in
// neutral/700, no separator and the `chevron` drawn at 26.18 (the glyph of 11.6 x 17.5). Tokens --topbar-*.
@media only screen and (min-width: 901px) {
    #app-grid:not(.is_alt_layout) #back-forward {
        display: flex;
        gap: var(--topbar-button-gap);
        padding-right: 0;
        border-right: none;

        & > * {
            flex-shrink: 0;
            width: var(--topbar-button-size);
            height: var(--topbar-button-size);
            border: var(--topbar-button-border);
            color: var(--color-neutral-white);

            // the hover is not in the Figma: the standard one of the app
            &:hover {
                background-color: var(--hover-bg);
                border-color: var(--color-neutral-700);
            }

            svg {
                flex-shrink: 0;
                width: var(--topbar-button-icon-size);
                height: var(--topbar-button-icon-size);
                transform: none;
            }

            &:active > svg {
                transform: scale(0.76);
            }
        }
    }
}
</style>
