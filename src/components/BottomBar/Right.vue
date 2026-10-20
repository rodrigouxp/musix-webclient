<template>
    <!-- desktop and tablet: lyrics, favorite, volume (shuffle and repeat are next to play) -->
    <div v-if="desktop" class="right-group desktop">
        <LyricsButton />
        <HeartSvg
            v-if="!hideHeart"
            :title="$t('BottomBar.Favorite')"
            :state="queue.currenttrack?.is_favorite"
            @handleFav="() => $emit('handleFav')"
        />
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
import RepeatAllSvg from '@/assets/icons/repeat.svg'
import ShuffleSvg from '@/assets/icons/shuffle.svg'
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
        border: solid 1px transparent;

        &:hover {
            border: solid 1px $gray3 !important;
            background-color: $gray !important;
        }
    }

    // INFO: lyrics-mic.svg has no viewBox once optimized, so it cannot shrink: keep the full 1.5rem inside the button
    .lyrics,
    .shuffle {
        padding: $small $smallest !important;
    }

    .lyrics,
    .repeat,
    .shuffle {
        svg {
            height: 1.5rem;
            width: 1.5rem;
        }

        &:active > svg {
            transform: scale(0.6);
        }
    }

    // the microphone looked a bit bigger than the icons next to it: 6.5% smaller (22.4px of the
    // 24px). It can not be done with width/height (no viewBox), so it is scaled around the center.
    .lyrics svg {
        transform: scale(0.935);
    }

    &.desktop {
        display: flex;
        justify-content: flex-end;
        align-items: center;
    }

    .speaker svg,
    .speaker-icon svg {
        height: 1.35rem;
        width: 1.35rem;
    }

    button.repeat.repeat-disabled {
        svg {
            opacity: 0.25;
        }
    }

    .heart-button {
        border: solid 1px $gray4 !important;
    }
}
</style>
