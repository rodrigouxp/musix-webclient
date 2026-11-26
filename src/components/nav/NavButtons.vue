<template>
    <div id="back-forward" class="">
        <button class="back" @click="$router.back()">
            <ChevronSvg />
        </button>
        <button class="forward" @click="$router.forward()">
            <ChevronSvg />
        </button>
    </div>
</template>

<script setup lang="ts">
// the back and forward buttons use the `chevron` Icon
import ChevronSvg from '@/assets/icons/figma/chevron.svg'
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

// The back and forward buttons, now in the PageBar (they came from the TopBar of the Figma, page-buttons): two circles of 36, 16 apart,
// with a border of 1 in neutral/700, no separator and the `chevron` drawn at 26.18 (the glyph of 11.6 x 17.5). Tokens --pagebar-*.
@media only screen and (min-width: 601px) {
    #app-grid #back-forward {
        display: flex;
        gap: var(--pagebar-button-gap);
        padding-right: 0;
        border-right: none;

        & > * {
            flex-shrink: 0;
            width: var(--pagebar-button-size);
            height: var(--pagebar-button-size);
            border: var(--pagebar-button-border);
            color: var(--color-neutral-white);

            // the hover is not in the Figma: the standard one of the app
            &:hover {
                background-color: var(--hover-bg);
                border-color: var(--color-neutral-700);
            }

            svg {
                flex-shrink: 0;
                width: var(--pagebar-button-icon-size);
                height: var(--pagebar-button-icon-size);
                transform: none;
            }

            &:active > svg {
                transform: scale(0.76);
            }
        }
    }
}
</style>
