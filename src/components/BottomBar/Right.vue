<template>
    <!-- above 900px: lyrics, volume (shuffle and repeat are next to play, the favorite is by the song) -->
    <div v-if="desktop" class="right-group desktop">
        <LyricsButton />
        <Volume inline />
    </div>
    <div v-else class="right-group">
        <LyricsButton />
        <Volume />
        <button
            class="repeat"
            :class="{ 'repeat-disabled': settings.repeat == 'none' }"
            :title="settings.repeat == 'all' ? $t('BottomBar.RepeatOptions.All') : settings.repeat == 'one' ? $t('BottomBar.RepeatOptions.One') : $t('BottomBar.RepeatOptions.None')"
            @click="settings.toggleRepeatMode"
        >
            <RepeatOneSvg v-if="settings.repeat == 'one'" />
            <RepeatAllSvg v-else />
        </button>
        <button class="shuffle" :title="$t('BottomBar.Shuffle')" @click="queue.shuffleQueue">
            <ShuffleSvg />
        </button>
        <HeartSvg
            v-if="!hideHeart"
            :title="$t('BottomBar.Favorite')"
            :state="queue.currenttrack?.is_favorite"
            @handleFav="() => $emit('handleFav')"
        />
    </div>
</template>

<script setup lang="ts">
import useQueue from '@/stores/queue'
import useSettings from '@/stores/settings'


import RepeatOneSvg from '@/assets/icons/repeat-one.svg'
import RepeatAllSvg from '@/assets/icons/figma/repeat.svg'
import ShuffleSvg from '@/assets/icons/figma/shuffle.svg'
import HeartSvg from '../shared/HeartSvg.vue'
import LyricsButton from '../shared/LyricsButton.vue'
import Volume from './Volume.vue'

const queue = useQueue()
const settings = useSettings()

defineProps<{
    hideHeart?: boolean
    // the bottom bar of the desktop and tablet (above 900px)
    desktop?: boolean
}>()

defineEmits<{
    (event: 'handleFav'): void
}>()
</script>

<style lang="scss">
.right-group {
    display: grid;
    justify-content: flex-end;
    grid-template-columns: repeat(5, max-content);
    align-items: center;
    height: 4rem;

    @include allPhones {
        width: max-content;
        height: unset;
    }

    button {
        height: 3rem !important;
        width: 3rem !important;
        background-color: transparent;
        border-radius: 400px;

        // the hover is only the fill; until 900px it keeps its border
        @include allPhones {
            border: solid 1px transparent;
        }

        &:hover {
            background-color: $gray !important;

            @include allPhones {
                border: solid 1px $gray3 !important;
            }
        }
    }

    .lyrics,
    .shuffle {
        padding: $small $smallest !important;
    }

    .repeat,
    .shuffle {
        svg {
            height: 1.5rem;
            width: 1.5rem;
        }
    }

    // lyrics and volume: the same size (the glyphs of the Figma are 20px in 24px)
    .lyrics svg {
        height: 1.3rem;
        width: 1.3rem;
    }

    .lyrics,
    .repeat,
    .shuffle {
        &:active > svg {
            transform: scale(0.6);
        }
    }

    // above 900px (the PlayerBar of the Figma): lyrics and the volume, 40px apart; each icon is 20px
    // in a circle of 28px
    &.desktop {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: var(--playerbar-right-gap);
        height: var(--playerbar-side-control-size);

        button.lyrics,
        button.speaker-icon {
            width: var(--playerbar-side-control-size) !important;
            height: var(--playerbar-side-control-size) !important;
            padding: 0 !important;

            &:hover {
                background-color: var(--playerbar-hover-bg) !important;
            }
        }

        .lyrics svg,
        .speaker-icon svg {
            height: var(--playerbar-icon-size);
            width: var(--playerbar-icon-size);
        }
    }

    .speaker svg,
    .speaker-icon svg {
        height: 1.3rem;
        width: 1.3rem;
    }

    button.repeat.repeat-disabled {
        svg {
            opacity: 0.25;
        }
    }

    // the favorite is only the icon, no border (the hover is the one of the other buttons)
    .heart-button {
        border: none !important;
    }
}
</style>
