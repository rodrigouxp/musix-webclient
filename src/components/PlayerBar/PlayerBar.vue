<template>
    <div class="player-bar" :class="{ 'is-playing': queue.playing }">
        <!-- 1. controls: play, previous, next, then the timeline (time, bar, time) and shuffle and repeat -->
        <div class="pb-controls">
            <div class="pb-transport">
                <button
                    class="pb-play"
                    :aria-label="queue.playing ? $t('BottomBar.Pause') : $t('BottomBar.Play')"
                    @click.prevent="queue.playPause"
                >
                    <Spinner v-if="buffering && queue.playing" />
                    <PauseSvg v-else-if="queue.playing" class="pausesvg" />
                    <PlaySvg v-else />
                </button>
                <button class="pb-round prev" :aria-label="$t('BottomBar.Previous')" @click.prevent="queue.playPrev">
                    <PrevSvg />
                </button>
                <button class="pb-round next" :aria-label="$t('BottomBar.Next')" @click.prevent="queue.playNext">
                    <NextSvg />
                </button>
            </div>
            <div class="pb-timeline">
                <span class="pb-time">{{ formatSeconds(queue.duration.current || 0) }}</span>
                <Progress />
                <span class="pb-time">{{ formatSeconds(queue.duration.full) }}</span>
                <div class="pb-modes">
                    <button class="pb-round shuffle" :title="$t('BottomBar.Shuffle')" @click.prevent="queue.shuffleQueue">
                        <ShuffleSvg />
                    </button>
                    <button
                        class="pb-round repeat"
                        :class="{ 'repeat-disabled': settings.repeat == 'none' }"
                        :title="repeatTitle"
                        @click.prevent="settings.toggleRepeatMode"
                    >
                        <RepeatOneSvg v-if="settings.repeat == 'one'" />
                        <RepeatAllSvg v-else />
                    </button>
                </div>
            </div>
        </div>

        <!-- 2. actions: volume, lyrics, favorite and add -->
        <div class="pb-actions">
            <Volume inline />
            <LyricsButton />
            <HeartSvg
                :title="$t('BottomBar.Favorite')"
                :state="queue.currenttrack?.is_favorite"
                :disabled="!hasTrack"
                @handleFav="$emit('handleFav')"
            />
            <button
                ref="addButton"
                class="add-button"
                :title="$t('BottomBar.Add')"
                :aria-label="$t('BottomBar.Add')"
                :disabled="!hasTrack"
                @click="showAddMenu"
            >
                <AddSvg />
            </button>
        </div>

        <!-- 3. the song: name and artists (right aligned) and the thumbnail, which opens and closes the queue -->
        <div class="pb-track">
            <div class="pb-info">
                <div class="pb-name">
                    <ExplicitIcon
                        v-if="queue.currenttrack?.explicit"
                        :key="queue.currenttrack.trackhash"
                        class="explicit-icon"
                    />
                    <MasterFlag :key="queue.currenttrack?.trackhash" :bitrate="queue.currenttrack?.bitrate || 0" />
                    <component
                        :is="albumhash ? 'RouterLink' : 'span'"
                        v-tooltip
                        class="pb-title"
                        :to="albumhash ? { name: Routes.album, params: { albumhash } } : undefined"
                    >
                        <TextLoader
                            :text="queue.currenttrack?.title || $t('BottomBar.PlaceholderTitle')"
                            :duration="1000"
                            :fade-duration="1000"
                            :direction="queue.direction"
                        />
                    </component>
                </div>
                <ArtistName
                    :artists="queue.currenttrack?.artists || []"
                    :albumartists="queue.currenttrack?.albumartists || $t('BottomBar.PlaceholderArtist')"
                    class="pb-artists"
                />
            </div>
            <button
                class="pb-artwork"
                :class="{ open: settings.queue_panel_open }"
                :aria-label="settings.queue_panel_open ? $t('BottomBar.HideQueue') : $t('BottomBar.ShowQueue')"
                :aria-expanded="settings.queue_panel_open"
                @click="settings.toggleQueuePanel"
            >
                <ImageLoader
                    :image="paths.images.thumb.small + queue.currenttrack?.image"
                    :blurhash="queue.currenttrack.blurhash"
                    :duration="1000"
                    img-class="rounded-sm"
                    :style="{ width: 'var(--playerbar-artwork-size)', aspectRatio: '1' }"
                />
                <span class="pb-badge"><ChevronSvg /></span>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { paths } from '@/config'
import { showPlayingAddMenu } from '@/helpers/contextMenuHandler'
import { Routes } from '@/router'
import { useT } from '@/i18n'
import { formatSeconds } from '@/utils'

import { buffering } from '@/stores/player'
import useQStore from '@/stores/queue'
import useSettingsStore from '@/stores/settings'

import AddSvg from '@/assets/icons/figma/add.svg'
import ChevronSvg from '@/assets/icons/figma/chevron.svg'
import ExplicitIcon from '@/assets/icons/explicit.svg'
import NextSvg from '@/assets/icons/figma/play-next.svg'
import PauseSvg from '@/assets/icons/figma/pause.svg'
import PlaySvg from '@/assets/icons/figma/play.svg'
import PrevSvg from '@/assets/icons/figma/play-previous.svg'
import RepeatOneSvg from '@/assets/icons/repeat-one.svg'
import RepeatAllSvg from '@/assets/icons/figma/repeat.svg'
import ShuffleSvg from '@/assets/icons/figma/shuffle.svg'
import ArtistName from '@/components/shared/ArtistName.vue'
import HeartSvg from '@/components/shared/HeartSvg.vue'
import ImageLoader from '@/components/shared/ImageLoader.vue'
import LyricsButton from '@/components/shared/LyricsButton.vue'
import MasterFlag from '@/components/shared/MasterFlag.vue'
import Spinner from '@/components/shared/Spinner.vue'
import TextLoader from '@/components/shared/TextLoader.vue'
import Progress from '@/components/LeftSidebar/NP/Progress.vue'
import Volume from '@/components/BottomBar/Volume.vue'

// PlayerBar of the Figma (default-2 paused, playing-2 playing; nodes 12408:1175 and 12408:1263): only the desktop,
// in the default layout (BottomBar decides). Tokens --playerbar-*.
defineEmits<{
    (e: 'handleFav'): void
}>()

const { t } = useT()
const queue = useQStore()
const settings = useSettingsStore()

const hasTrack = computed(() => !!queue.currenttrack?.trackhash)
const albumhash = computed(() => queue.currenttrack?.albumhash)
const addButton = ref<HTMLElement>()

const repeatTitle = computed(() => {
    return settings.repeat == 'all'
        ? t('BottomBar.RepeatOptions.All')
        : settings.repeat == 'one'
        ? t('BottomBar.RepeatOptions.One')
        : t('BottomBar.RepeatOptions.None')
})

function showAddMenu() {
    if (!addButton.value || !queue.currenttrack) return
    showPlayingAddMenu(addButton.value, queue.currenttrack)
}
</script>

<style lang="scss">
// the colors of the paused and the playing bar change with a soft transition; a registered property lets the
// gradient of the progress bar (its track color) animate too
@property --pb-track {
    syntax: '<color>';
    inherits: true;
    initial-value: #222222;
}

@property --pb-loaded {
    syntax: '<color>';
    inherits: true;
    initial-value: #333333;
}

.player-bar {
    --pb-track: var(--playerbar-paused-track);
    --pb-loaded: var(--playerbar-paused-loaded);
    --pb-bg: var(--playerbar-paused-bg);
    --pb-play-bg: var(--playerbar-paused-play-bg);
    --pb-play-icon: var(--playerbar-paused-play-icon);
    --pb-artist: var(--playerbar-paused-artist);

    grid-area: bottombar;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: var(--playerbar-group-gap);
    height: 100%;
    min-width: 0;
    padding: var(--playerbar-panel-padding);
    border-radius: var(--layout-panel-radius);
    background-color: var(--pb-bg);
    font-family: var(--playerbar-font);
    z-index: 1;
    transition: background-color var(--playerbar-transition), --pb-track var(--playerbar-transition),
        --pb-loaded var(--playerbar-transition);

    &.is-playing {
        --pb-track: var(--playerbar-playing-track);
        --pb-loaded: var(--playerbar-playing-loaded);
        --pb-bg: var(--playerbar-playing-bg);
        --pb-play-bg: var(--playerbar-playing-play-bg);
        --pb-play-icon: var(--playerbar-playing-play-icon);
        --pb-artist: var(--playerbar-playing-artist);
    }

    @media only screen and (max-width: 1280px) {
        gap: var(--playerbar-group-gap-narrow);
    }

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

        &:focus-visible {
            outline: 2px solid var(--color-primary-300);
            outline-offset: -2px;
        }
    }

    // ---- 1. controls ----
    .pb-controls {
        display: flex;
        align-items: center;
        flex: 1 1 0;
        gap: var(--playerbar-transport-gap);
        min-width: min-content;
    }

    .pb-transport {
        display: flex;
        align-items: center;
        flex-shrink: 0;
        gap: var(--playerbar-transport-gap);
    }

    // play and pause: a circle of 48 with its own fill (no hover in the Figma, only the :active)
    .pb-play {
        width: var(--playerbar-play-size);
        height: var(--playerbar-play-size);
        border-radius: 400px;
        background-color: var(--pb-play-bg);
        color: var(--pb-play-icon);
        transition: background-color var(--playerbar-transition), color var(--playerbar-transition);

        svg {
            flex-shrink: 0;
            width: var(--playerbar-play-icon-size);
            height: var(--playerbar-play-icon-size);
        }

        &:active > svg.pausesvg {
            transform: scale(0.75);
        }

        .player-spinner {
            height: 20px;
        }
    }

    // previous, next, shuffle and repeat: circles of 34 with the icon of 20 (the hover is the standard one)
    .pb-round {
        width: var(--playerbar-control-size);
        height: var(--playerbar-control-size);
        border-radius: 400px;
        transition: background-color 0.2s ease-out;

        &:hover {
            background-color: var(--playerbar-hover-bg);
        }

        svg {
            flex-shrink: 0;
            width: var(--playerbar-icon-size);
            height: var(--playerbar-icon-size);
        }

        &.shuffle:active svg,
        &.repeat:active svg {
            transform: scale(0.6);
        }

        &.repeat-disabled svg {
            opacity: 0.25;
        }
    }

    .pb-timeline {
        display: flex;
        align-items: center;
        flex: 1 1 0;
        gap: var(--playerbar-row-gap);
        min-width: 0;

        #progress {
            --progress-track: var(--pb-track);
            --progress-fill: var(--playerbar-progress-fill);
            --progress-loaded: var(--pb-loaded);
            flex: 1 1 0;
            min-width: var(--playerbar-timeline-min);
            // not its default width of an input (it would be the least width of the controls)
            width: 0;
            height: var(--playerbar-progress-height);
            margin: 0;
            border-radius: 400px;

            &::-webkit-slider-thumb {
                width: var(--playerbar-thumb-size);
            }

            &::-moz-range-thumb {
                width: var(--playerbar-thumb-size);
            }
        }
    }

    &:hover .pb-timeline #progress {
        &::-webkit-slider-thumb {
            height: var(--playerbar-thumb-size);
            width: var(--playerbar-thumb-size);
        }

        &::-moz-range-thumb {
            height: var(--playerbar-thumb-size);
            width: var(--playerbar-thumb-size);
        }
    }

    .pb-modes {
        display: flex;
        align-items: center;
        flex-shrink: 0;
        gap: var(--playerbar-row-gap);
    }

    .pb-time {
        @include text('paragraph-12px');
        flex-shrink: 0;
        padding: var(--playerbar-time-padding);
        border-radius: var(--playerbar-time-radius);
        background-color: var(--pb-track);
        color: var(--color-neutral-white);
        font-variant-numeric: tabular-nums;
    }

    // ---- 2. actions ----
    .pb-actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        flex-shrink: 0;
        gap: var(--playerbar-group-gap);

        @media only screen and (max-width: 1280px) {
            gap: var(--playerbar-group-gap-narrow);
        }

        // volume: the speaker (28), 8, the bar (94) and the room for the ball at 100%
        .speaker-inline {
            padding-right: var(--playerbar-volume-pad-right);
        }

        // the circle of the hover is as big as the one of the other buttons (34); the negative margin keeps the
        // layout box of the Figma (28 for the speaker and lyrics, 20 for the favorite and add)
        button.speaker-icon,
        button.lyrics {
            width: var(--playerbar-control-size);
            height: var(--playerbar-control-size);
            margin: calc((var(--playerbar-side-control-size) - var(--playerbar-control-size)) / 2);
            border-radius: 400px;
            transition: background-color 0.2s ease-out;

            &:hover {
                background-color: var(--playerbar-hover-bg);
            }

            svg {
                width: var(--playerbar-icon-size);
                height: var(--playerbar-icon-size);
            }

            &:active > svg {
                transform: scale(0.6);
            }
        }

        .heart-button,
        .add-button {
            display: grid;
            place-items: center;
            width: var(--playerbar-control-size);
            height: var(--playerbar-control-size);
            margin: calc((var(--playerbar-icon-size) - var(--playerbar-control-size)) / 2);
            aspect-ratio: auto;
            border-radius: 400px;
            transition: background-color 0.2s ease-out;

            &:hover {
                background-color: var(--playerbar-hover-bg);
            }

            svg {
                width: var(--playerbar-icon-size);
                height: var(--playerbar-icon-size);
            }
        }

        .heart-button div svg {
            width: var(--playerbar-icon-size);
            height: var(--playerbar-icon-size);
        }

        .add-button svg:active {
            transform: scale(0.6);
        }
    }

    // ---- 3. the song ----
    .pb-track {
        display: flex;
        align-items: center;
        flex: 0 1 auto;
        gap: var(--playerbar-track-gap);
        min-width: var(--playerbar-artwork-size);
    }

    .pb-info {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        flex: 0 1 auto;
        min-width: 0;
        overflow: hidden;
        text-align: right;
    }

    .pb-name {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 12px;
        max-width: 100%;
        min-width: 0;
    }

    .pb-title,
    .pb-artists {
        @include text('action-button-14px');
    }

    .pb-title {
        min-width: 0;
        color: var(--playerbar-title-color);

        .text-loader {
            min-width: 0;
            max-width: 100%;
            overflow: hidden;
        }

        &:is(a):hover {
            text-decoration: underline;
        }
    }

    .pb-artists {
        max-width: 100%;
        color: var(--pb-artist);
        transition: color var(--playerbar-transition);

        a {
            font-size: inherit;
            color: inherit;
        }
    }

    // the flags show up after the title has faded in, as in the old bar
    .explicit-icon,
    .master-flag {
        flex-shrink: 0;
        opacity: 0;
        animation: pbFadeIn 0.5s ease-in-out forwards;
        animation-delay: 1.5s;
    }

    @keyframes pbFadeIn {
        from {
            opacity: 0;
        }

        to {
            opacity: 1;
        }
    }

    // the thumbnail is a button: it opens and closes the QueuePanel (node 12408:1358: the chevron on a circle of 24)
    .pb-artwork {
        position: relative;
        width: var(--playerbar-artwork-size);
        height: var(--playerbar-artwork-size);
        border-radius: var(--playerbar-artwork-radius);
        box-shadow: var(--playerbar-shadow);

        .il-image,
        .blurhash-placeholder {
            border-radius: var(--playerbar-artwork-radius);
        }

        .pb-badge {
            position: absolute;
            top: 50%;
            left: 50%;
            display: grid;
            place-items: center;
            width: var(--playerbar-badge-size);
            height: var(--playerbar-badge-size);
            margin: calc(var(--playerbar-badge-size) / -2) 0 0 calc(var(--playerbar-badge-size) / -2);
            border-radius: 400px;
            background-color: var(--playerbar-badge-bg);
            color: var(--color-neutral-white);
            z-index: 2;
            opacity: 0;
            pointer-events: none;
            transition: opacity var(--playerbar-badge-fade) ease-out;

            svg {
                width: var(--playerbar-badge-icon-size);
                height: var(--playerbar-badge-icon-size);
                // the chevron points right: up when the queue is closed, down when it is open
                transform: rotate(-90deg);
                transition: transform var(--playerbar-badge-fade) ease-out;
            }
        }

        &.open .pb-badge svg {
            transform: rotate(90deg);
        }

        &:hover .pb-badge,
        &:focus-visible .pb-badge {
            opacity: 1;
        }
    }
}
</style>
