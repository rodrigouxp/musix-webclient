<template>
    <div class="hotkeys no-scroll" :class="{ 'with-shuffle-repeat': withShuffleRepeat }">
        <button v-if="withShuffleRepeat" class="shuffle" :title="$t('BottomBar.Shuffle')" @click.prevent="queue.shuffleQueue">
            <ShuffleSvg />
        </button>
        <button class="prev" @click.prevent="queue.playPrev">
            <PrevSvg />
        </button>
        <button class="play" @click.prevent="queue.playPause">
            <Spinner v-if="buffering && queue.playing" />
            <PauseSvg v-else-if="queue.playing" class="pausesvg" />
            <PlaySvg class="playsvg" v-else />
        </button>
        <button class="next" @click.prevent="queue.playNext">
            <NextSvg />
        </button>
        <button
            v-if="withShuffleRepeat"
            class="repeat"
            :class="{ 'repeat-disabled': settings.repeat == 'none' }"
            :title="settings.repeat == 'all' ? $t('BottomBar.RepeatOptions.All') : settings.repeat == 'one' ? $t('BottomBar.RepeatOptions.One') : $t('BottomBar.RepeatOptions.None')"
            @click.prevent="settings.toggleRepeatMode"
        >
            <RepeatOneSvg v-if="settings.repeat == 'one'" />
            <RepeatAllSvg v-else />
        </button>
    </div>
</template>

<script setup lang="ts">
import { buffering } from '@/stores/player'
import useQStore from '@/stores/queue'
import useSettings from '@/stores/settings'

import PauseSvg from '@/assets/icons/pause.svg'
import NextSvg from '@/assets/icons/figma/play-next.svg'
import PrevSvg from '@/assets/icons/figma/play-previous.svg'
import PlaySvg from '@/assets/icons/play.svg'
import RepeatOneSvg from '@/assets/icons/repeat-one.svg'
import RepeatAllSvg from '@/assets/icons/repeat.svg'
import ShuffleSvg from '@/assets/icons/shuffle.svg'
import Spinner from '@/components/shared/Spinner.vue'

const queue = useQStore()
const settings = useSettings()

defineProps<{
    // desktop and tablet: shuffle and repeat go next to the previous and next buttons
    withShuffleRepeat?: boolean
}>()
</script>

<style lang="scss">
.hotkeys {
    display: grid;
    grid-template-columns: 1fr 4rem 1fr;
    gap: 1rem;
    height: 100%;
    align-items: center;

    button {
        height: 100%;
        padding: 0;
        background: none;
        border: 1px solid transparent;
        border-radius: 0;

        &:hover {
            background: $darkestblue;
        }
    }

    button.play {
        width: 4rem;
    }

    // shuffle, previous, play, next, repeat (desktop and tablet)
    &.with-shuffle-repeat {
        grid-template-columns: repeat(5, 28px);
        gap: 12px;
        justify-content: center;

        // no border (the hover is only the fill)
        button {
            border: none;
        }

        // every button is a 28px square, so the hover is a perfect circle (the border-radius of
        // .buttons in BottomBar.vue) and the same for all of them
        button,
        button.play {
            width: 28px;
            height: 28px;
        }

        // Every glyph (previous, next, shuffle, repeat, play and pause) fits in 14 x 14px: its
        // larger side is 14px (previous and next are square). Each svg has its own size because the
        // drawings do not fill their box the same way (previous and next: 20 of 24; shuffle: 0.75
        // of the box wide; repeat: 0.92 wide; play: 0.55 tall).
        button.prev svg,
        button.next svg {
            height: 1.05rem;
            width: 1.05rem;
        }

        button.shuffle svg {
            height: 1.172rem;
            width: 1.172rem;
        }

        button.repeat svg {
            height: 0.9525rem;
            width: 0.9525rem;
        }

        // the svg can be wider than the 28px button: it does not shrink, or the glyph would
        button.play > svg {
            flex-shrink: 0;
            height: 1.5894rem;
            width: 1.5894rem;
        }

        // pause.svg has no viewBox once optimized (it has a width and a height), so it can not
        // grow with its size: it keeps 28px and is scaled around the center (its bars are 14.82px
        // tall in 28px, so 0.9447 gives 14px)
        button.play > svg.pausesvg {
            height: 28px;
            width: 28px;
            transform: scale(0.9447);
        }

        button.play:active > svg.pausesvg {
            transform: scale(0.71);
        }

        button.shuffle:active svg,
        button.repeat:active svg {
            transform: scale(0.6);
        }

        button.repeat.repeat-disabled svg {
            opacity: 0.25;
        }
    }

    @include allPhones {
        grid-template-columns: 1fr max-content 1fr;
        position: relative;
        margin-right: -$small;
        gap: 0;

        button.prev {
            margin-left: $small;
        }
    }

    @include largePhones {
        display: flex;
        flex-shrink: 0;

        button.prev {
            margin-left: $smaller;
        }
    }

    .playsvg {
        height: 1.75rem;
    }
}
</style>
