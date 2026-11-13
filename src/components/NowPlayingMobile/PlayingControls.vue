<template>
    <div class="playing-controls">
        <!-- 1. timeline: the bar, and under it the time that went by and the length of the song -->
        <div class="pc-timeline">
            <Progress :aria-label="$t('NowPlayingMobile.Timeline')" />
            <div class="pc-times">
                <span class="pc-time">{{ formatSeconds(queue.duration.current || 0) }}</span>
                <span class="pc-time">{{ formatSeconds(queue.duration.full) }}</span>
            </div>
        </div>

        <!-- 2. main controls -->
        <div class="pc-main">
            <button class="pc-round shuffle" :title="$t('BottomBar.Shuffle')" :aria-label="$t('BottomBar.Shuffle')" @click.prevent="queue.shuffleQueue">
                <ShuffleSvg />
            </button>
            <button class="pc-round" :title="$t('BottomBar.Previous')" :aria-label="$t('BottomBar.Previous')" @click.prevent="queue.playPrev">
                <PrevSvg />
            </button>
            <button
                class="pc-play"
                :class="{ 'is-play': !queue.playing }"
                :aria-label="queue.playing ? $t('BottomBar.Pause') : $t('BottomBar.Play')"
                @click.prevent="queue.playPause"
            >
                <Spinner v-if="buffering && queue.playing" />
                <PauseSvg v-else-if="queue.playing" class="pausesvg" />
                <PlaySvg v-else />
            </button>
            <button class="pc-round" :title="$t('BottomBar.Next')" :aria-label="$t('BottomBar.Next')" @click.prevent="queue.playNext">
                <NextSvg />
            </button>
            <button
                class="pc-round repeat"
                :class="{ 'repeat-disabled': settings.repeat == 'none' }"
                :title="repeatTitle"
                :aria-label="repeatTitle"
                @click.prevent="settings.toggleRepeatMode"
            >
                <RepeatOneSvg v-if="settings.repeat == 'one'" />
                <RepeatAllSvg v-else />
            </button>
        </div>

        <!-- 3. actions: the volume, the tabs and the options of the song -->
        <div class="pc-actions">
            <Volume />
            <div class="pc-options">
                <button
                    v-for="item in tabs"
                    :key="item.tab"
                    class="pc-round pc-tab"
                    :class="{ active: tab === item.tab }"
                    :title="item.label"
                    :aria-label="item.label"
                    :aria-pressed="tab === item.tab"
                    @click="$emit('tab', item.tab)"
                >
                    <component :is="item.icon" :class="item.tab" />
                </button>
                <button
                    ref="optionsButton"
                    class="pc-more"
                    :title="$t('NowPlayingMobile.Options')"
                    :aria-label="$t('NowPlayingMobile.Options')"
                    :disabled="!queue.currenttrack?.trackhash"
                    @click="showOptions"
                >
                    <OptionsSvg />
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { showTrackContextMenu } from '@/helpers/contextMenuHandler'
import { useT } from '@/i18n'
import { formatSeconds } from '@/utils'

import { buffering } from '@/stores/player'
import useQueue from '@/stores/queue'
import useSettings from '@/stores/settings'

import LyricsSvg from '@/assets/icons/figma/lyrics.svg'
import NextSvg from '@/assets/icons/figma/play-next.svg'
import NowPlayingSvg from '@/assets/icons/figma/now-playing.svg'
import OptionsSvg from '@/assets/icons/figma/options.svg'
import PauseSvg from '@/assets/icons/figma/pause.svg'
import PlaySvg from '@/assets/icons/figma/play.svg'
import PrevSvg from '@/assets/icons/figma/play-previous.svg'
import QueueSvg from '@/assets/icons/figma/queue.svg'
import RepeatOneSvg from '@/assets/icons/repeat-one.svg'
import RepeatAllSvg from '@/assets/icons/figma/repeat.svg'
import ShuffleSvg from '@/assets/icons/figma/shuffle.svg'
import Progress from '@/components/LeftSidebar/NP/Progress.vue'
import Volume from '@/components/BottomBar/Volume.vue'
import Spinner from '@/components/shared/Spinner.vue'

// PlayingControls of the Figma (node 12540:4287): the same on every tab of NowPlaying. The timeline, the five main
// controls and a row with the volume, the three tabs (the open one has a round background) and the options of the song.
// Tokens --playingcontrols-*.
type Tab = 'home' | 'lyrics' | 'queue'

defineProps<{
    tab: Tab
}>()

defineEmits<{
    (e: 'tab', tab: Tab): void
}>()

const { t } = useT()
const queue = useQueue()
const settings = useSettings()
const optionsButton = ref<HTMLElement>()

const tabs = computed(() => [
    { tab: 'home' as Tab, icon: NowPlayingSvg, label: t('NowPlayingMobile.Tabs.NowPlaying') },
    { tab: 'lyrics' as Tab, icon: LyricsSvg, label: t('NowPlayingMobile.Tabs.Lyrics') },
    { tab: 'queue' as Tab, icon: QueueSvg, label: t('NowPlayingMobile.Tabs.Queue') },
])

const repeatTitle = computed(() => {
    return settings.repeat == 'all'
        ? t('BottomBar.RepeatOptions.All')
        : settings.repeat == 'one'
        ? t('BottomBar.RepeatOptions.One')
        : t('BottomBar.RepeatOptions.None')
})

// the menu of the song, opened upward from the button (the controls are at the bottom of the screen)
function showOptions() {
    const track = queue.currenttrack

    if (!optionsButton.value || !track) return

    const rect = optionsButton.value.getBoundingClientRect()
    const point = { x: rect.right, y: rect.top - 4 } as MouseEvent

    showTrackContextMenu(point, track, ref(false), 'top-end', ['top-start'])
}
</script>

<style lang="scss">
.playing-controls {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    gap: var(--playingcontrols-gap);
    padding-top: var(--playingcontrols-padding-top);
    width: 100%;

    button {
        flex-shrink: 0;
        padding: 0;
        border: none;
        background: transparent;
        color: var(--color-neutral-white);
        font-size: inherit !important;

        &:disabled {
            opacity: 0.4;
            pointer-events: none;
        }
    }

    // ---- 1. timeline ----
    .pc-timeline {
        display: flex;
        flex-direction: column;
        gap: var(--playingcontrols-timeline-gap);

        // the bar: 4 high, the filled part and the thumb as in the PlayerBar. Without hover on a phone the thumb is always there
        #progress {
            --progress-track: var(--playerbar-paused-track);
            --progress-fill: var(--playerbar-progress-fill);
            --progress-loaded: var(--playerbar-paused-loaded);
            display: block;
            width: 100%;
            height: var(--playingcontrols-bar-height);
            margin: 0;
            border-radius: 400px;
            touch-action: pan-x;

            &::-webkit-slider-thumb {
                width: var(--playingcontrols-thumb-size);
                height: var(--playingcontrols-thumb-size);
            }

            &::-moz-range-thumb {
                width: var(--playingcontrols-thumb-size);
                height: var(--playingcontrols-thumb-size);
            }
        }
    }

    .pc-times {
        display: flex;
        justify-content: space-between;
    }

    .pc-time {
        @include text('paragraph-12px');
        padding: var(--playerbar-time-padding);
        border-radius: var(--playerbar-time-radius);
        background-color: var(--playingcontrols-time-bg);
        color: var(--color-neutral-white);
        font-variant-numeric: tabular-nums;
    }

    // ---- 2. main controls ----
    .pc-main {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    // the circles of 34 with the icon of 20 (the tabs too)
    .pc-round {
        display: grid;
        place-items: center;
        width: var(--playingcontrols-button-size);
        height: var(--playingcontrols-button-size);
        border-radius: 400px;
        transition: background-color 0.2s ease-out;
        -webkit-tap-highlight-color: transparent;

        svg {
            flex-shrink: 0;
            width: var(--playingcontrols-icon-size);
            height: var(--playingcontrols-icon-size);
        }

        &.shuffle:active svg,
        &.repeat:active svg {
            transform: scale(0.6);
        }

        &.repeat-disabled svg {
            opacity: 0.25;
        }
    }

    .pc-play {
        display: grid;
        place-items: center;
        width: var(--playingcontrols-play-size);
        height: var(--playingcontrols-play-size);
        border-radius: 400px;
        background-color: var(--playingcontrols-play-bg);
        color: var(--playerbar-paused-play-icon);
        -webkit-tap-highlight-color: transparent;

        // only the play has a padding on the left (the triangle looks more centered); the pause has none
        &.is-play {
            padding-left: var(--playingcontrols-play-pad-left);
        }

        svg {
            flex-shrink: 0;
            width: var(--playingcontrols-play-icon-size);
            height: var(--playingcontrols-play-icon-size);
        }

        &:active > svg.pausesvg {
            transform: scale(0.75);
        }
    }

    // ---- 3. actions ----
    .pc-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: var(--playingcontrols-actions-height);

        // the speaker (32) and the bar (94 x 4) with the thumb that is always there
        .speaker-inline {
            gap: var(--playingcontrols-volume-gap);
            height: auto;

            button.speaker-icon {
                display: grid;
                place-items: center;
                width: var(--playingcontrols-volume-icon-box);
                height: var(--playingcontrols-volume-icon-box);
                -webkit-tap-highlight-color: transparent;

                svg {
                    width: var(--playingcontrols-icon-size);
                    height: var(--playingcontrols-icon-size);
                }
            }

            input#volume {
                width: var(--playingcontrols-volume-width);
                height: var(--playingcontrols-bar-height);
                touch-action: pan-x;

                &::-webkit-slider-thumb,
                &::-moz-range-thumb {
                    width: var(--playingcontrols-thumb-size);
                    height: var(--playingcontrols-thumb-size);
                }
            }
        }
    }

    .pc-options {
        display: flex;
        align-items: center;
        gap: var(--playingcontrols-options-gap);
    }

    .pc-tab {
        // the icons of the Figma for now playing and queue come in the box of 34
        svg.home,
        svg.queue {
            width: var(--playingcontrols-button-size);
            height: var(--playingcontrols-button-size);
        }

        &.active {
            background-color: var(--playingcontrols-tab-active-bg);
        }
    }

    // the three dots are 12 wide; the tap area is a circle of 34 and the negative margin keeps the 12 of layout
    .pc-more {
        display: grid;
        place-items: center;
        width: var(--playingcontrols-button-size);
        height: var(--playingcontrols-button-size);
        margin: 0 calc((var(--playingcontrols-options-width) - var(--playingcontrols-button-size)) / 2);
        border-radius: 400px;
        -webkit-tap-highlight-color: transparent;

        svg {
            width: var(--playingcontrols-icon-size);
            height: var(--playingcontrols-icon-size);
        }
    }
}
</style>
