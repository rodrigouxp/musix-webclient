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
            class="pbm-fav"
            :class="{ favorited: queue.currenttrack?.is_favorite }"
            :title="$t('BottomBar.Favorite')"
            :aria-label="$t('BottomBar.Favorite')"
            :aria-pressed="!!queue.currenttrack?.is_favorite"
            :disabled="!hasTrack"
            @click="toggleFavorite"
        >
            <FavoriteSvg :class="{ 'icon-active': queue.currenttrack?.is_favorite }" />
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
                <MarqueeText class="pbm-title" align="end" :text="queue.currenttrack?.title || $t('BottomBar.PlaceholderTitle')" />
                <ArtistName
                    :artists="queue.currenttrack?.artists || []"
                    :albumartists="queue.currenttrack?.albumartists || $t('BottomBar.PlaceholderArtist')"
                    class="pbm-artists"
                />
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
import { favType } from '@/enums'
import favoriteHandler from '@/helpers/favoriteHandler'
import { showPlayingAddMenu } from '@/helpers/contextMenuHandler'
import { Routes } from '@/router'

import { buffering } from '@/stores/player'
import useQueue from '@/stores/queue'

import AddSvg from '@/assets/icons/figma/add.svg'
import FavoriteSvg from '@/assets/icons/figma/favorite.svg'
import PauseSvg from '@/assets/icons/figma/pause.svg'
import PlaySvg from '@/assets/icons/figma/play.svg'
import ArtistName from '@/components/shared/ArtistName.vue'
import ImageLoader from '@/components/shared/ImageLoader.vue'
import MarqueeText from '@/components/shared/MarqueeText.vue'
import Spinner from '@/components/shared/Spinner.vue'

// PlayerBar type=default-mobile of the Figma (node 12535:3645): play, favorite and add (12 between them) and the frame of
// the song, which fills the rest: the title (a long one runs in a loop, like the albums of the PlayingPanel), the artists
// (links, neutral/300) and the artwork, which opens NowPlaying (no chevron over it on the phone). While a song plays the
// bar takes the dynamic-playbar color, as the desktop one. Tokens --playerbarmobile-*; the play button and the artwork
// are the sizes of the desktop bar (--playerbar-*).
const queue = useQueue()
const router = useRouter()

const addButton = ref<HTMLElement>()
const hasTrack = computed(() => !!queue.currenttrack?.trackhash)

const progress = computed(() => {
    const { current, full } = queue.duration

    return full ? Math.min(100, Math.max(0, (current / full) * 100)) : 0
})

function toggleFavorite() {
    favoriteHandler(
        queue.currenttrack?.is_favorite,
        favType.track,
        queue.currenttrack?.trackhash || '',
        () => null,
        () => null
    )
}

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
    --pbm-bg: var(--playerbar-paused-bg);

    position: relative;
    min-width: 0;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    // play, favorite and add are 12 apart; the frame of the song fills what is left
    gap: var(--playerbarmobile-actions-gap);
    padding: var(--playerbarmobile-padding);
    border-radius: var(--fixedcontrols-radius);
    background-color: var(--pbm-bg);
    font-family: var(--playerbar-font);
    transition: background-color var(--playerbar-transition);

    &.is-playing {
        --pbm-bg: var(--playerbar-playing-bg);
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
    .pbm-fav,
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

    // favorited: error/300, as in the other heart buttons
    .pbm-fav.favorited {
        color: var(--color-error-300);
    }

    // the frame of the song (fill x hug): the text, right aligned next to the artwork (as in the Penpot), and the artwork
    // on the right. The gap from the add is its own
    .pbm-track {
        display: flex;
        align-items: center;
        flex: 1 1 0;
        gap: var(--playerbarmobile-track-gap);
        min-width: 0;
        margin-left: calc(var(--playerbarmobile-track-gap) - var(--playerbarmobile-actions-gap));
    }

    .pbm-info {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        flex: 1 1 0;
        min-width: 0;
        text-align: right;
    }

    .pbm-title,
    .pbm-artists {
        @include text('action-button-14px');
        max-width: 100%;
        white-space: nowrap;
    }

    .pbm-title {
        width: 100%;
        color: var(--playerbar-title-color);
    }

    // the artists: links, neutral/300 (the name of the artist opens the page of the artist)
    .pbm-artists {
        display: block;
        color: var(--playerbarmobile-artist-color);

        > div {
            overflow: hidden;
            text-overflow: ellipsis;
        }
    }

    // the artwork is a button that opens NowPlaying
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
