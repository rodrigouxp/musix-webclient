<template>
    <div
        class="b-bar"
        :style="{
            paddingLeft: isMobile && settings.is_default_layout ? 'var(--layout-gutter)' : '',
            paddingRight: isMobile && settings.is_default_layout ? 'var(--layout-gutter)' : '',
        }"
    >
        <LeftGroup @handleFav="handleFav" />
        <div class="center">
            <!-- desktop and tablet: the buttons, and under them the time, the bar and the full time -->
            <template v-if="!isMobile">
                <div class="buttons rounded-sm border">
                    <HotKeys with-shuffle-repeat />
                </div>
                <div class="progress-row">
                    <div class="time time-current">
                        <div class="numbers">
                            {{ formatSeconds(queue.duration.current || 0) }}
                        </div>
                    </div>
                    <Progress />
                    <div class="time time-full">
                        <div class="numbers">
                            {{ formatSeconds(queue.duration.full) }}
                        </div>
                    </div>
                </div>
            </template>
            <Progress v-else />
        </div>
        <RightGroup v-if="!isMobile" desktop @handleFav="handleFav" />
        <Navigation v-else />
    </div>
</template>

<script setup lang="ts">
import { favType } from '@/enums'
import favoriteHandler from '@/helpers/favoriteHandler'
import { isMobile } from '@/stores/content-width'
import { formatSeconds } from '@/utils'

import useQStore from '@/stores/queue'
import useSettings from '@/stores/settings'

import HotKeys from '@/components/LeftSidebar/NP/HotKeys.vue'
import Progress from '@/components/LeftSidebar/NP/Progress.vue'
import Navigation from '@/components/LeftSidebar/NavButtons.vue'

import LeftGroup from './Left.vue'
import RightGroup from './Right.vue'

const queue = useQStore()
const settings = useSettings()

function handleFav() {
    favoriteHandler(
        queue.currenttrack?.is_favorite,
        favType.track,
        queue.currenttrack?.trackhash || '',
        () => null,
        () => null
    )
}
</script>

<style lang="scss">
.b-bar {
    display: grid;
    grid-template-columns: 1fr max-content 1fr;
    align-items: center;
    z-index: 1;

    @include allPhones {
        display: flex;
        flex-direction: column;
        align-items: unset;
        gap: $small;
        padding: $medium 1rem;

        /* Hiding the dot/thumb/handle for readonly input */
        /* Webkit browsers, Firefox, IE etc */
        &:hover > .center > #progress::-webkit-slider-thumb {
            display: none;
            opacity: 0;
            visibility: hidden;
        }

        &:hover > .center > #progress::-moz-range-thumb {
            display: none;
            opacity: 0;
            visibility: hidden;
        }

        &:hover > .center > #progress::-ms-thumb {
            display: none;
            opacity: 0;
            visibility: hidden;
        }
    }

    button {
        background: transparent;
        // round (pill) hover on every control of the bar
        border-radius: 400px;
        width: 3rem;
        transition: background-color 0.2s ease-out, border-color 0.2s ease-out;

        // the hover is only the fill, with no border (until 900px it keeps its border)
        &:hover {
            background-color: $gray !important;

            // above 900px: the circle of the PlayerBar (neutral/900)
            @media only screen and (min-width: 901px) {
                background-color: var(--playerbar-hover-bg) !important;
            }

            @include allPhones {
                border: solid 1px $gray3 !important;
            }
        }

        &:focus-visible {
            outline: 2px solid var(--color-primary-300);
            outline-offset: -2px;
        }

        &:disabled {
            opacity: 0.4;
            pointer-events: none;
        }

        @include allPhones {
            height: 3rem;
        }

        @include largePhones {
            width: 2.5rem;
            height: 2.5rem;

            &:nth-child(2) {
                width: 3.5rem;
            }
        }

        @include smallestPhones {
            &:first-child {
                display: none;
            }

            &:nth-child(2) {
                margin-left: $smaller;
            }

            &:last-child {
                display: none;
            }
        }
    }

    &:hover {
        // INFO: Show the progress bar when hovering over the bottom bar
        #progress::-moz-range-thumb {
            height: 1rem;
            width: 1rem;
        }

        #progress::-webkit-slider-thumb {
            height: 1rem;
            width: 1rem;
        }

        #progress::-ms-thumb {
            height: 1rem;
            width: 1rem;
        }

        // INFO: Also show the expand button
        .np-image .expandicon {
            opacity: 1;
        }
    }

    // above 900px: the PlayerBar of the Figma (Roboto for the text and the times)
    @media only screen and (min-width: 901px) {
        font-family: var(--playerbar-font);

        &:hover {
            // the thumb of the progress bar (it only shows when the bar is under the mouse)
            .progress-row #progress::-moz-range-thumb {
                height: var(--playerbar-thumb-size);
                width: var(--playerbar-thumb-size);
            }

            .progress-row #progress::-webkit-slider-thumb {
                height: var(--playerbar-thumb-size);
                width: var(--playerbar-thumb-size);
            }
        }
    }

    // the time, the progress bar and the full time (desktop and tablet)
    .progress-row {
        display: grid;
        grid-template-columns: max-content 1fr max-content;
        align-items: center;
        gap: var(--playerbar-timeline-gap);

        #progress {
            margin: 0;
            width: 100%;
            height: var(--playerbar-progress-height);
            border-radius: 400px;
            // the colors of the track, of the part played and of the part loaded (Progress.vue)
            --progress-track: var(--playerbar-progress-bg);
            --progress-fill: var(--playerbar-progress-fill);
            --progress-loaded: var(--playerbar-progress-loaded);

            &::-webkit-slider-thumb {
                width: var(--playerbar-thumb-size);
            }

            &::-moz-range-thumb {
                width: var(--playerbar-thumb-size);
            }
        }
    }

    .center {
        display: grid;
        align-items: center;
        gap: 0.625rem;

        width: 30rem;

        // above 900px: the buttons and the timeline are 56px together (34 and 22), 502px wide
        @media only screen and (min-width: 901px) {
            gap: 0;
            width: var(--playerbar-timeline-width);
        }

        @media only screen and (max-width: 1080px) {
            width: 20rem !important;
        }

        @include allPhones {
            width: 100% !important;
            margin: 4px -16px;
            user-select: none;
            pointer-events: none;

            > #progress {
                height: 1px !important;
                width: 100vw !important;
                margin: unset;
            }
        }

        // the pills with the times (only above 900px: they are in the .progress-row)
        .time {
            color: var(--color-neutral-white);
            font-weight: var(--playerbar-text-weight);
            font-size: var(--playerbar-time-size);
            line-height: var(--playerbar-text-line-height);

            .numbers {
                background-color: var(--playerbar-time-bg);
                border-radius: var(--playerbar-time-radius);
                padding: var(--playerbar-time-padding);
                box-shadow: var(--playerbar-shadow);
                font-variant-numeric: tabular-nums;
            }
        }
    }

    // hotkey
    .buttons {
        display: grid;
        place-items: center;
        border: none;
        height: var(--playerbar-control-size);

        button {
            background: transparent;
        }

        // the hotkeys set their own square corners
        .hotkeys button {
            border-radius: 400px;
        }

        @include allPhones {
            height: unset;
        }
    }
}
</style>
