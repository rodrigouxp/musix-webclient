<template>
    <aside class="playing-panel" :class="{ open }" :aria-hidden="!open" :inert="!open">
        <div class="pp-inner">
            <div class="pp-title">
                <h2 class="pp-heading">{{ $t('PlayingPanel.Title') }}</h2>
                <button
                    v-if="hasItems"
                    class="pp-clear"
                    :title="$t('PlayingPanel.Clear')"
                    :aria-label="$t('PlayingPanel.Clear')"
                    @click="queue.clearQueueKeepingCurrent()"
                >
                    <DeleteSvg />
                </button>
            </div>

            <QueueList :shown="open" />

            <!-- the album that is playing, with a vinyl behind it that turns while the music plays -->
            <div v-if="hasItems && queue.currenttrack" class="pp-thumb">
                <img class="pp-disc" :class="{ spinning: queue.playing }" :src="discUrl" alt="" />
                <component
                    :is="queue.currenttrack.albumhash ? 'RouterLink' : 'div'"
                    class="pp-cover-link"
                    :to="queue.currenttrack.albumhash ? { name: Routes.album, params: { albumhash: queue.currenttrack.albumhash } } : undefined"
                    :title="$t('BottomBar.GoToAlbum')"
                >
                    <img class="pp-cover" :src="paths.images.thumb.large + queue.currenttrack.image" alt="" />
                    <Bitrate />
                </component>
            </div>
        </div>
    </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { paths } from '@/config'
import { Routes } from '@/router'
import useSettings from '@/stores/settings'
import useQueue from '@/stores/queue'
import useTracklist from '@/stores/queue/tracklist'

import DeleteSvg from '@/assets/icons/figma/delete.svg'
import discUrl from '@/assets/images/queue-disc.png'
import Bitrate from '@/components/LeftSidebar/NP/Bitrate.vue'
import QueueList from './QueueList.vue'

// PlayingPanel of the Figma (node 12408:1964): the queue as a list, with the tracks of an album or of a playlist that
// went in whole under a header (the list is QueueList, also used by the Queue tab of NowPlaying on the phone). Only the
// desktop, above 600px (App.vue). It opens and closes with the thumbnail of the PlayerBar (settings.queue_panel_open).
const settings = useSettings()
const queue = useQueue()
const tracklist = useTracklist()

const open = computed(() => settings.queue_panel_open)
const hasItems = computed(() => tracklist.tracklist.length > 0)
</script>

<style lang="scss">
// The panel is a column of the grid of the app (see app-grid.scss): its width goes from 0 to 280 (+ the gap of 8)
// when it opens, and what is inside keeps its size and is clipped.
.playing-panel {
    grid-area: r-sidebar;
    min-width: 0;
    min-height: 0;
    margin-left: var(--layout-panel-gap);
    overflow: hidden;
    visibility: hidden;
    transition: visibility 0s var(--playingpanel-duration);

    &.open {
        visibility: visible;
        transition-delay: 0s;
    }

    .pp-inner {
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: var(--playingpanel-gap);
        width: var(--playingpanel-width);
        height: 100%;
        padding: var(--playingpanel-padding);
        border: var(--layout-panel-border);
        border-radius: var(--layout-panel-radius);
    }

    // "Now playing" centered; the delete button (clear the queue) sits at the right end of the same line
    .pp-title {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .pp-heading {
        @include text('paragraph-18px');
        margin: 0;
        color: var(--playingpanel-title-color);
    }

    // the icon "delete" is 14 x 14 (its vector is 9.33 x 12); the click area is bigger (24, own decision) and goes out of
    // the line by what it has over the icon, so the icon keeps the right edge
    .pp-clear {
        position: absolute;
        top: 50%;
        right: calc(var(--playingpanel-clear-pad-right) - (var(--playingpanel-button-hit) - var(--playingpanel-clear-size)) / 2);
        display: grid;
        place-items: center;
        width: var(--playingpanel-button-hit);
        height: var(--playingpanel-button-hit);
        padding: 0;
        border: none;
        border-radius: 400px;
        background: transparent;
        color: var(--playingpanel-clear-color);
        cursor: pointer;
        transform: translateY(-50%);

        svg {
            display: block;
            width: var(--playingpanel-clear-size);
            height: var(--playingpanel-clear-size);
        }

        &:hover {
            background-color: var(--hover-bg);
        }
    }

    // the vinyl is a square of the width, 55 above the cover; the cover is a square under it. 8 from each border of
    // the panel (the padding of the panel has 4 on the right: the thumbnail takes the other 4 itself). On a short
    // window it gets smaller (never more than 45% of the height)
    .pp-thumb {
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        flex-shrink: 0;
        align-self: flex-start;
        // the cover is a square of the width; the vinyl peeks out above it by 55/264 of that width (the Figma numbers
        // at 280), so the whole set scales with the panel. On a short window it is never taller than 45% of it
        width: min(calc(100% - var(--playingpanel-thumb-gap-right)), calc(45vh * var(--playingpanel-thumb-ratio)));
        aspect-ratio: calc(1 / (1 + var(--playingpanel-disc-lift-ratio)));
        border-radius: var(--playingpanel-cover-radius);
    }

    .pp-disc {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        aspect-ratio: 1;
        object-fit: contain;
        // clockwise, one turn in 8s, only while the music plays (paused it stays where it is)
        animation: pp-disc-spin var(--playingpanel-disc-duration) linear infinite;
        animation-play-state: paused;

        &.spinning {
            animation-play-state: running;
        }
    }

    .pp-cover-link {
        position: relative;
        display: block;
        cursor: pointer;
    }

    // the file type and the bitrate (FLAC • 3200) over the lower left corner of the cover; the component is the one of
    // the old card of the left panel (LeftSidebar/NP/Bitrate.vue), here with the tag tokens of the app
    .pp-cover-link .bitrate {
        @include text('paragraph-12px');
        bottom: var(--playingpanel-format-inset);
        left: var(--playingpanel-format-inset);
        max-width: calc(100% - 2 * var(--playingpanel-format-inset));
        padding: var(--playingpanel-format-padding);
        border-radius: var(--playingpanel-format-radius);
        background-color: var(--playingpanel-format-bg);
        color: var(--playingpanel-format-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .pp-cover {
        display: block;
        width: 100%;
        aspect-ratio: 1;
        box-sizing: border-box;
        object-fit: cover;
        border: var(--playingpanel-cover-border);
        border-radius: var(--playingpanel-cover-radius);
    }
}

@keyframes pp-disc-spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

@media (prefers-reduced-motion: reduce) {
    .playing-panel .pp-disc {
        animation: none;
    }
}
</style>
