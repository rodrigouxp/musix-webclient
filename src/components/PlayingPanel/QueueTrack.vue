<template>
    <div
        class="queue-track"
        :class="{ current: isCurrent, 'menu-open': menuOpen, held }"
        @click.prevent.stop="$emit('play')"
        @pointerdown="onPointerDown"
        @contextmenu.prevent="onContextMenu"
        @dragstart.prevent
    >
        <div class="qt-name">
            <img class="qt-picture" :src="paths.images.thumb.small + track.image" alt="" draggable="false" loading="lazy" />
            <span v-tooltip class="qt-title">{{ track.title }}</span>
        </div>
        <div class="qt-functions">
            <button
                class="qt-button"
                :class="{ on: track.repeat }"
                :title="$t('PlayingPanel.RepeatTrack')"
                :aria-label="$t('PlayingPanel.RepeatTrack')"
                :aria-pressed="!!track.repeat"
                @click.stop="tracklist.toggleTrackRepeat(index)"
            >
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
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import { paths } from '@/config'
import { showTrackContextMenu } from '@/helpers/contextMenuHandler'
import { QueueItem } from '@/interfaces'
import useTracklist from '@/stores/queue/tracklist'

import DeleteSvg from '@/assets/icons/figma/delete.svg'
import RepeatSvg from '@/assets/icons/figma/repeat.svg'

// TrackQueue of the Figma (node 12408:961): 36 high, the cover of 28, the name and the three small buttons. The
// right click opens the menu of tracks of the other lists.
const props = defineProps<{
    track: QueueItem
    index: number
    isCurrent?: boolean
    // the copy that follows the pointer while the row is dragged
    held?: boolean
}>()

const emit = defineEmits<{
    (e: 'play'): void
    (e: 'dragstart', event: PointerEvent): void
}>()

const tracklist = useTracklist()
const menuOpen = ref(false)

function showMenu(e: MouseEvent) {
    showTrackContextMenu(e, props.track, menuOpen)
}

// the whole row is the handle of the drag (a mouse that moves, a finger that is held). A long press with a finger is the drag,
// so the `contextmenu` that Android fires for it is thrown away (the list opens the menu when the finger lets go without moving)
let lastPointer = ''

function onPointerDown(e: PointerEvent) {
    lastPointer = e.pointerType

    if (!props.held) emit('dragstart', e)
}

function onContextMenu(e: MouseEvent) {
    if (lastPointer === 'touch' || lastPointer === 'pen') return

    showMenu(e)
}
</script>

<style lang="scss">
.queue-track {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--playingpanel-track-gap);
    box-sizing: border-box;
    height: var(--playingpanel-track-height);
    padding: var(--playingpanel-track-padding);
    border-radius: var(--playingpanel-track-radius);
    cursor: pointer;
    transition: background-color 0.2s ease-out;
    // the text and the cover are not selected or dragged by themselves: the row is dragged as a whole
    -webkit-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;

    img {
        pointer-events: none;
        -webkit-user-drag: none;
    }

    // the hover is not in the Figma: the standard one of the app (--hover-bg), like the track that is playing
    &:hover,
    &.menu-open,
    &.current,
    &.held {
        background-color: var(--playingpanel-track-current-bg);
    }

    .qt-name {
        display: flex;
        align-items: center;
        gap: var(--playingpanel-name-gap);
        min-width: 0;
    }

    .qt-picture {
        flex-shrink: 0;
        width: var(--playingpanel-picture-size);
        height: var(--playingpanel-picture-size);
        border-radius: var(--playingpanel-picture-radius);
        object-fit: cover;
    }

    .qt-title {
        @include text('paragraph-14px');
        min-width: 0;
        color: var(--playingpanel-track-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .qt-functions {
        display: flex;
        align-items: center;
        flex-shrink: 0;
        gap: var(--playingpanel-button-gap);
    }

    // the icon is 12 (the glyph of 10); the click area is 24, with a negative margin that keeps the 12 of layout
    .qt-button {
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

        &:hover:not(:disabled),
        &:focus-visible {
            color: var(--playingpanel-icon-hover);
        }

        // a repeat that is on (not in the Figma: the color of the hover)
        &.on {
            color: var(--playingpanel-icon-on);
        }

        &:disabled {
            cursor: default;
        }
    }
}
</style>
