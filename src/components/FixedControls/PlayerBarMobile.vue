<template>
    <div class="player-bar-mobile" :class="{ 'is-playing': queue.playing }">
        <button
            class="pbm-play"
            :class="{ 'is-play': !queue.playing }"
            :aria-label="queue.playing ? $t('BottomBar.Pause') : $t('BottomBar.Play')"
            @click.prevent="queue.playPause"
        >
            <Spinner v-if="buffering && queue.playing" />
            <PauseSvg v-else-if="queue.playing" class="pausesvg" />
            <PlaySvg v-else />
        </button>
        <button
            ref="addButton"
            class="pbm-add"
            :title="$t('BottomBar.Add')"
            :aria-label="$t('BottomBar.Add')"
            :disabled="!hasTrack"
            @click="showAddMenu"
        >
            <AddSvg />
        </button>

        <div class="pbm-track">
            <div class="pbm-info">
                <span class="pbm-title">{{ queue.currenttrack?.title || $t('BottomBar.PlaceholderTitle') }}</span>
                <span class="pbm-artists">{{ artists }}</span>
            </div>
            <button
                class="pbm-artwork"
                :aria-label="$t('BottomBar.GoToNowPlaying')"
                :title="$t('BottomBar.GoToNowPlaying')"
                @click="openNowPlaying"
            >
                <ImageLoader
                    :image="paths.images.thumb.small + queue.currenttrack?.image"
                    :blurhash="queue.currenttrack.blurhash"
                    :duration="1000"
                    img-class="rounded-xsm"
                    :style="{ width: 'var(--playerbar-artwork-size)', aspectRatio: '1' }"
                />
                <span class="pbm-badge"><ChevronSvg /></span>
            </button>
        </div>

        <!-- the progress of the song: display only (the seek bar is in NowPlaying) -->
        <div class="pbm-timeline" aria-hidden="true">
            <div class="pbm-fill" :style="{ width: progress + '%' }"></div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { paths } from '@/config'
import { showPlayingAddMenu } from '@/helpers/contextMenuHandler'
import { Routes } from '@/router'

import { buffering } from '@/stores/player'
import useQueue from '@/stores/queue'

import AddSvg from '@/assets/icons/figma/add.svg'
import ChevronSvg from '@/assets/icons/figma/chevron.svg'
import PauseSvg from '@/assets/icons/figma/pause.svg'
import PlaySvg from '@/assets/icons/figma/play.svg'
import ImageLoader from '@/components/shared/ImageLoader.vue'
import Spinner from '@/components/shared/Spinner.vue'

// PlayerBar type=default-mobile of the Figma (node 12535:3645): play, add, and on the right the name and artists (right
// aligned) and the artwork, which opens NowPlaying. Tokens --playerbarmobile-*; the play button and the artwork are
// the sizes of the desktop bar (--playerbar-*).
const queue = useQueue()
const router = useRouter()

const addButton = ref<HTMLElement>()
const hasTrack = computed(() => !!queue.currenttrack?.trackhash)

// the artists as plain text: a link in a bar this small would be an accidental tap
const artists = computed(() => {
    const list = queue.currenttrack?.artists

    if (list?.length) return list.map(artist => artist.name).join(', ')

    const albumartists = queue.currenttrack?.albumartists

    return typeof albumartists === 'string' ? albumartists : ''
})

const progress = computed(() => {
    const { current, full } = queue.duration

    return full ? Math.min(100, Math.max(0, (current / full) * 100)) : 0
})

function showAddMenu() {
    if (!addButton.value || !queue.currenttrack) return
    showPlayingAddMenu(addButton.value, queue.currenttrack)
}

// a push, so the back button (and the swipe down) comes back to the page that was open
function openNowPlaying() {
    router.push({ name: Routes.nowPlaying, params: { tab: 'home' } })
}
</script>

<style lang="scss">
.player-bar-mobile {
    --pbm-play-bg: var(--playerbar-paused-play-bg);
    --pbm-play-icon: var(--playerbar-paused-play-icon);
    --pbm-play-hover: var(--playerbar-paused-play-hover);

    position: relative;
    min-width: 0;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    // the least space between the buttons and the song (own decision: the Figma has the three groups at space-between)
    gap: var(--playerbarmobile-track-gap);
    padding: var(--playerbarmobile-padding);
    border-radius: var(--fixedcontrols-radius);
    background-color: var(--fixedcontrols-bg);
    font-family: var(--playerbar-font);

    &.is-playing {
        --pbm-play-bg: var(--playerbar-playing-play-bg);
        --pbm-play-icon: var(--playerbar-playing-play-icon);
        --pbm-play-hover: var(--playerbar-playing-play-hover);
    }

    button {
        flex-shrink: 0;
        padding: 0;
        border: none;
        background: transparent;
        color: var(--color-neutral-white);
        font-size: inherit !important;
        -webkit-tap-highlight-color: transparent;

        &:disabled {
            opacity: 0.4;
            pointer-events: none;
        }

        &:focus-visible {
            outline: 2px solid var(--color-primary-300);
            outline-offset: -2px;
        }
    }

    // the same circle of 40 as the desktop bar
    .pbm-play {
        display: grid;
        place-items: center;
        width: var(--playerbar-play-size);
        height: var(--playerbar-play-size);
        border-radius: 400px;
        background-color: var(--pbm-play-bg);
        color: var(--pbm-play-icon);
        transition: background-color var(--playerbar-transition), color var(--playerbar-transition);

        &.is-play {
            padding-left: var(--playerbar-play-pad-left);
        }

        &:hover {
            background-color: var(--pbm-play-hover);
        }

        svg {
            flex-shrink: 0;
            width: var(--playerbar-play-icon-size);
            height: var(--playerbar-play-icon-size);
        }

        &:active > svg.pausesvg {
            transform: scale(0.75);
        }

        .player-spinner {
            height: 16.67px; // 20 at 48, scaled to 40
        }
    }

    // the icon is 20; the tap area is the one of the other controls, and the negative margin keeps the layout of 20
    .pbm-add {
        display: grid;
        place-items: center;
        width: var(--playerbar-control-size);
        height: var(--playerbar-control-size);
        margin: calc((var(--playerbarmobile-add-size) - var(--playerbar-control-size)) / 2);
        border-radius: 400px;

        svg {
            width: var(--playerbarmobile-add-size);
            height: var(--playerbarmobile-add-size);
        }

        &:active svg {
            transform: scale(0.6);
        }
    }

    .pbm-track {
        display: flex;
        align-items: center;
        flex: 0 1 auto;
        gap: var(--playerbarmobile-track-gap);
        min-width: 0;
    }

    .pbm-info {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        min-width: 0;
        text-align: right;
    }

    .pbm-title,
    .pbm-artists {
        @include text('action-button-14px');
        max-width: 100%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .pbm-title {
        color: var(--playerbar-title-color);
    }

    .pbm-artists {
        color: var(--playerbar-artist-color);
    }

    // the artwork is a button that opens NowPlaying; the chevron (up, 24) is over it all the time
    .pbm-artwork {
        position: relative;
        width: var(--playerbar-artwork-size);
        height: var(--playerbar-artwork-size);
        border-radius: var(--playerbar-artwork-radius);
        box-shadow: var(--playerbar-shadow);

        .il-image,
        .blurhash-placeholder {
            border-radius: var(--playerbar-artwork-radius);
        }

        // the badge of the desktop bar: a circle of 24 with the white chevron (up), over the artwork all the time
        .pbm-badge {
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
            // over the image of the ImageLoader (its z-index is 1)
            z-index: 2;
            pointer-events: none;

            svg {
                width: var(--playerbar-badge-icon-size);
                height: var(--playerbar-badge-icon-size);
                // the chevron points right: -90deg is up
                transform: rotate(-90deg);
            }
        }
    }

    .pbm-timeline {
        position: absolute;
        left: var(--playerbarmobile-timeline-inset);
        right: var(--playerbarmobile-timeline-inset);
        bottom: 0;
        height: var(--playerbarmobile-timeline-height);
        pointer-events: none;

        .pbm-fill {
            height: 100%;
            border-radius: var(--playerbarmobile-timeline-radius);
            background-color: var(--playerbarmobile-timeline-color);
        }
    }
}
</style>
