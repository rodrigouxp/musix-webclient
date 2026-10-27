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

import PauseSvg from '@/assets/icons/figma/pause.svg'
import NextSvg from '@/assets/icons/figma/play-next.svg'
import PrevSvg from '@/assets/icons/figma/play-previous.svg'
import PlaySvg from '@/assets/icons/figma/play.svg'
import RepeatOneSvg from '@/assets/icons/repeat-one.svg'
import RepeatAllSvg from '@/assets/icons/figma/repeat.svg'
import ShuffleSvg from '@/assets/icons/figma/shuffle.svg'
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
        grid-template-columns: repeat(5, var(--playerbar-control-size));
        gap: var(--playerbar-control-gap);
        justify-content: center;

        // no border (the hover is only the fill)
        button {
            border: none;
        }

        // every button is a square (34px in the Figma), so the hover is a perfect circle (the
        // border-radius of .buttons in BottomBar.vue) and the same for all of them; the play is
        // not bigger than the others
        button,
        button.play {
            width: var(--playerbar-control-size);
            height: var(--playerbar-control-size);
        }

        // every icon has the same box (20px, the glyph of 20 inside the viewBox of 24), so the
        // icon and the circle keep the same proportion (20 to 34) in all of them
        button svg,
        button.play > svg {
            flex-shrink: 0;
            height: var(--playerbar-icon-size);
            width: var(--playerbar-icon-size);
        }

        // the spinner has the room of the glyph (16px of the 20)
        button .player-spinner {
            height: 16px;
        }

        button.play:active > svg.pausesvg {
            transform: scale(0.75);
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
