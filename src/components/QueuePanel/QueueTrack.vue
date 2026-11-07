<template>
    <div
        class="queue-track"
        :class="{ current: isCurrent, 'menu-open': menuOpen, held }"
        @click.prevent.stop="$emit('play')"
        @contextmenu.prevent="showMenu"
    >
        <div class="qt-name">
            <img class="qt-picture" :src="paths.images.thumb.small + track.image" alt="" loading="lazy" />
            <span v-tooltip class="qt-title">{{ track.title }}</span>
        </div>
        <div class="qt-functions">
            <!-- repeat of the track: comes in the next step (it shows, disabled) -->
            <button class="qt-button" disabled :title="$t('QueuePanel.RepeatTrack')" :aria-label="$t('QueuePanel.RepeatTrack')">
                <RepeatSvg />
            </button>
            <button
                class="qt-button"
                :title="$t('TrackItem.RemoveFromQueue')"
                :aria-label="$t('TrackItem.RemoveFromQueue')"
                @click.stop="tracklist.removeByIndex(index)"
            >
                <DeleteSvg />
            </button>
            <button
                class="qt-button qt-drag"
                :aria-label="$t('QueuePanel.Move')"
                @click.stop
                @pointerdown="$emit('dragstart', $event)"
            >
                <DragSvg />
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import { paths } from '@/config'
import { showTrackContextMenu } from '@/helpers/contextMenuHandler'
import { Track } from '@/interfaces'
import useTracklist from '@/stores/queue/tracklist'

import DeleteSvg from '@/assets/icons/figma/delete.svg'
import DragSvg from '@/assets/icons/figma/drag.svg'
import RepeatSvg from '@/assets/icons/figma/repeat.svg'

// TrackQueue of the Figma (node 12408:961): 36 high, the cover of 28, the name and the three small buttons. The
// right click opens the menu of tracks of the other lists.
const props = defineProps<{
    track: Track
    index: number
    isCurrent?: boolean
    // the copy that follows the pointer while the row is dragged
    held?: boolean
}>()

defineEmits<{
    (e: 'play'): void
    (e: 'dragstart', event: PointerEvent): void
}>()

const tracklist = useTracklist()
const menuOpen = ref(false)

function showMenu(e: MouseEvent) {
    showTrackContextMenu(e, props.track, menuOpen)
}
</script>

<style lang="scss">
.queue-track {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--queuepanel-track-gap);
    box-sizing: border-box;
    height: var(--queuepanel-track-height);
    padding: var(--queuepanel-track-padding);
    border-radius: var(--queuepanel-track-radius);
    cursor: pointer;
    transition: background-color 0.2s ease-out;

    // the hover is not in the Figma: the standard one of the app (--hover-bg), like the track that is playing
    &:hover,
    &.menu-open,
    &.current,
    &.held {
        background-color: var(--queuepanel-track-current-bg);
    }

    .qt-name {
        display: flex;
        align-items: center;
        gap: var(--queuepanel-name-gap);
        min-width: 0;
    }

    .qt-picture {
        flex-shrink: 0;
        width: var(--queuepanel-picture-size);
        height: var(--queuepanel-picture-size);
        border-radius: var(--queuepanel-picture-radius);
        object-fit: cover;
    }

    .qt-title {
        @include text('paragraph-14px');
        min-width: 0;
        color: var(--queuepanel-track-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .qt-functions {
        display: flex;
        align-items: center;
        flex-shrink: 0;
        gap: var(--queuepanel-button-gap);
    }

    // the icon is 12 (the glyph of 10); the click area is 24, with a negative margin that keeps the 12 of layout
    .qt-button {
        flex-shrink: 0;
        display: grid;
        place-items: center;
        width: var(--queuepanel-button-hit);
        height: var(--queuepanel-button-hit);
        margin: calc((var(--queuepanel-button-size) - var(--queuepanel-button-hit)) / 2);
        padding: 0;
        border: none;
        background: transparent;
        color: var(--queuepanel-icon-color);
        transition: color 0.2s ease-out;

        svg {
            width: var(--queuepanel-button-size);
            height: var(--queuepanel-button-size);
        }

        &:hover:not(:disabled) {
            color: var(--queuepanel-icon-hover);
        }

        &:disabled {
            cursor: default;
        }
    }

    .qt-drag {
        cursor: grab;
        touch-action: none;
    }
}
</style>
