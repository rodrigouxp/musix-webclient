<template>
    <div class="queue-group-header">
        <div class="qg-name">
            <!-- the album icon turns while the header is shown (the playlist one stands still) -->
            <SoundtrackSvg v-if="group.type === 'album'" class="qg-icon qg-spin" />
            <PlaylistSvg v-else class="qg-icon" />
            <MarqueeText class="qg-text" :text="group.name" />
        </div>
        <!-- the buttons act only on the tracks of this group -->
        <div class="qg-functions">
            <button class="qg-button" :title="$t('BottomBar.Shuffle')" :aria-label="$t('BottomBar.Shuffle')" @click="tracklist.shuffleGroup(group.id)">
                <ShuffleSvg />
            </button>
            <button
                class="qg-button"
                :class="{ on: repeating }"
                :title="$t('PlayingPanel.RepeatGroup')"
                :aria-label="$t('PlayingPanel.RepeatGroup')"
                :aria-pressed="repeating"
                @click="tracklist.toggleGroupRepeat(group.id)"
            >
                <RepeatSvg />
            </button>
            <button class="qg-button" :title="$t('PlayingPanel.RemoveGroup')" :aria-label="$t('PlayingPanel.RemoveGroup')" @click="tracklist.removeGroup(group.id)">
                <DeleteSvg />
            </button>
            <button class="qg-button qg-drag" :aria-label="$t('PlayingPanel.Move')" @pointerdown="$emit('dragstart', $event)"></button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { QueueGroup } from '@/interfaces'
import useTracklist from '@/stores/queue/tracklist'

import DeleteSvg from '@/assets/icons/figma/delete.svg'
import PlaylistSvg from '@/assets/icons/figma/playlist.svg'
import RepeatSvg from '@/assets/icons/figma/repeat.svg'
import ShuffleSvg from '@/assets/icons/figma/shuffle.svg'
import SoundtrackSvg from '@/assets/icons/figma/soundtrack.svg'
import MarqueeText from '@/components/shared/MarqueeText.vue'

// AlbumQueue header of the Figma (node 12408:964): the icon, the name (one line) and the buttons of the group.
// A name that does not fit runs to the left in a loop, like a marquee (MarqueeText).
defineProps<{
    group: QueueGroup
    // the group repeats
    repeating?: boolean
}>()

defineEmits<{
    (e: 'dragstart', event: PointerEvent): void
}>()

const tracklist = useTracklist()
</script>

<style lang="scss">
.queue-group-header {
    display: flex;
    align-items: center;
    gap: var(--playingpanel-header-gap);
    box-sizing: border-box;
    height: calc(var(--playingpanel-header-height) + var(--playingpanel-header-pad-top));
    padding: var(--playingpanel-header-pad-top) 4px 0;
    color: var(--playingpanel-group-color);

    .qg-name {
        display: flex;
        align-items: center;
        flex: 1 1 0;
        gap: var(--playingpanel-header-name-gap);
        min-width: 0;
    }

    .qg-icon {
        flex-shrink: 0;
        width: var(--playingpanel-header-icon-size);
        height: var(--playingpanel-header-icon-size);
    }

    // soundtrack: half a turn counterclockwise in 2s, ease-in-out, in a loop (the drawing is the same every 180°)
    .qg-spin {
        animation: qg-spin 2s ease-in-out infinite;
    }

    .qg-text {
        @include text('paragraph-12px');
        flex: 1 1 0;
        min-width: 0;
    }

    .qg-functions {
        display: flex;
        align-items: center;
        flex-shrink: 0;
        gap: var(--playingpanel-button-gap);
    }

    .qg-button {
        flex-shrink: 0;
        display: grid;
        place-items: center;
        width: var(--playingpanel-button-hit);
        height: var(--playingpanel-button-hit);
        margin: calc((var(--playingpanel-button-size) - var(--playingpanel-button-hit)) / 2);
        padding: 0;
        border: none;
        background: transparent;
        color: var(--playingpanel-icon-color);
        transition: color 0.2s ease-out;

        svg {
            width: var(--playingpanel-button-size);
            height: var(--playingpanel-button-size);
        }

        &:hover,
        &:focus-visible {
            color: var(--playingpanel-icon-hover);
        }

        // a repeat that is on (not in the Figma: the color of the hover)
        &.on {
            color: var(--playingpanel-icon-on);
        }
    }

    // the handle has no icon (Rodrigo, 2026-11-14): the button is an invisible hit area, the drag still works
    .qg-drag {
        cursor: grab;
        touch-action: none;
    }
}

@keyframes qg-spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(-180deg);
    }
}

@media (prefers-reduced-motion: reduce) {
    .queue-group-header .qg-spin {
        animation: none;
    }
}
</style>
