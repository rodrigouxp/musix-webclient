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
import NextSvg from '@/assets/icons/player/play-next.svg'
import PrevSvg from '@/assets/icons/player/play-previous.svg'
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
        grid-template-columns: repeat(5, 3rem);
        gap: $smaller;
        justify-content: center;

        // every button has the same width, so the round hover is the same for all of them
        button.play {
            width: 3rem;
        }

        // All the glyphs (previous, next, shuffle, repeat, play and pause) are 18px tall, with no
        // scale on the row: each svg has its own size because the drawings do not fill their box
        // the same way (previous and next: 18px in 24; shuffle: 0.59 of 28; repeat: 0.78 of 28;
        // play: 0.55 of 28).
        button.prev svg,
        button.next svg {
            height: 1.5rem;
            width: 1.5rem;
        }

        button.shuffle svg {
            height: 1.9rem;
            width: 1.9rem;
        }

        button.repeat svg {
            height: 1.44rem;
            width: 1.44rem;
        }

        button.play > svg {
            height: 2.04rem;
            width: 2.04rem;
        }

        // pause.svg has no viewBox once optimized (it has a width and a height), so it can not
        // grow with its size: it keeps 28px and is scaled around the center (its bars are 14.8px
        // tall in 28px, so 1.215 gives 18px)
        button.play > svg.pausesvg {
            height: 28px;
            width: 28px;
            transform: scale(1.215);
        }

        button.play:active > svg.pausesvg {
            transform: scale(0.91);
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
