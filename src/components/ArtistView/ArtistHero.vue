<template>
    <section class="artist-hero">
        <!-- no image yet (the upload comes in a later stage): the checkerboard of the Figma prototype -->
        <div class="hero-image" aria-hidden="true"></div>
        <div class="hero-shade" aria-hidden="true"></div>

        <div class="hero-content">
            <h1 class="hero-name" :title="artist.name">{{ artist.name }}</h1>
            <div class="hero-infos">
                <span v-if="artist.trackcount">
                    {{ artist.trackcount.toLocaleString() }} {{ $t('Common.Track', artist.trackcount) }}
                </span>
                <span v-if="artist.trackcount && artist.albumcount" class="bullet">•</span>
                <span v-if="artist.albumcount">
                    {{ artist.albumcount.toLocaleString() }} {{ $t('Common.Album', artist.albumcount) }}
                </span>
                <span v-if="artist.duration && (artist.trackcount || artist.albumcount)" class="bullet">•</span>
                <span v-if="artist.duration">{{ formatSeconds(artist.duration, true) }}</span>
            </div>
            <div class="hero-buttons">
                <button
                    class="hero-btn hero-play"
                    :class="{ 'is-pause': isPlaying }"
                    :title="isPlaying ? $t('BottomBar.Pause') : $t('BottomBar.Play')"
                    :aria-label="isPlaying ? $t('BottomBar.Pause') : $t('BottomBar.Play')"
                    @click="togglePlay"
                >
                    <PauseSvg v-if="isPlaying" />
                    <PlaySvg v-else />
                </button>
                <button
                    class="hero-btn hero-fav"
                    :class="{ favorited: artist.is_favorite }"
                    :title="$t('BottomBar.Favorite')"
                    :aria-label="$t('BottomBar.Favorite')"
                    :aria-pressed="!!artist.is_favorite"
                    @click="handleFav"
                >
                    <FavoriteSvg :class="{ 'icon-active': artist.is_favorite }" />
                </button>
                <button
                    class="hero-btn hero-options"
                    :class="{ 'context-open': contextOpen }"
                    :aria-label="$t('ArtistView.Options')"
                    @click="showContext"
                >
                    <OptionsSvg />
                </button>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import FavoriteSvg from '@/assets/icons/figma/favorite.svg'
import OptionsSvg from '@/assets/icons/figma/options.svg'
import PauseSvg from '@/assets/icons/figma/pause.svg'
import PlaySvg from '@/assets/icons/figma/play.svg'
import { FromOptions, favType } from '@/enums'
import { showArtistContextMenu } from '@/helpers/contextMenuHandler'
import favoriteHandler from '@/helpers/favoriteHandler'
import { utilPlayFromArtist } from '@/helpers/usePlayFrom'
import useArtistPageStore from '@/stores/pages/artist'
import useQueue from '@/stores/queue'
import useTracklist from '@/stores/queue/tracklist'
import formatSeconds from '@/utils/useFormatSeconds'

// ArtistHero of the Figma (node 12452:2138): the image with a gradient, and at the bottom left the name, the numbers
// and the buttons (play or pause, favorite, options). The play plays "Most played tracks" in order.
const store = useArtistPageStore()
const queue = useQueue()
const tracklist = useTracklist()

const artist = computed(() => store.info)
const contextOpen = ref(false)

// the queue is the one of this artist (it was started from the page, a card or this button)
const isThisArtist = computed(() => {
    const from = tracklist.from as { type?: FromOptions; artisthash?: string }
    return from?.type === FromOptions.artist && from.artisthash === store.info.artisthash
})
const isPlaying = computed(() => isThisArtist.value && queue.playing)

function togglePlay() {
    if (isThisArtist.value) return queue.playPause()
    utilPlayFromArtist(0)
}

function handleFav() {
    favoriteHandler(store.info.is_favorite, favType.artist, store.info.artisthash, store.makeFavorite, store.removeFavorite)
}

function showContext(e: MouseEvent) {
    showArtistContextMenu(e, contextOpen, store.info.artisthash, store.info.name)
}
</script>

<style lang="scss">
.artist-hero {
    // the height follows the width of the panel (3.3 : 1, the 1319 x 400 of the Figma) between 280 and 400px; it is set on
    // .artist-panel (--artist-hero-height) because the sticky tab bar needs the same number
    position: relative;
    box-sizing: border-box;
    display: flex;
    align-items: flex-end;
    justify-content: flex-start;
    height: var(--artist-hero-height);
    padding: var(--artist-hero-padding);
    overflow: hidden;
    color: var(--artist-hero-color);

    .hero-image {
        position: absolute;
        inset: 0;
        // 16px squares, neutral-900 and neutral-700; an image would be `object-fit: cover` with a focus point
        background-color: var(--artist-hero-check-a);
        background-image: conic-gradient(
            var(--artist-hero-check-b) 25%,
            var(--artist-hero-check-a) 0 50%,
            var(--artist-hero-check-b) 0 75%,
            var(--artist-hero-check-a) 0
        );
        background-size: calc(var(--artist-hero-check-size) * 2) calc(var(--artist-hero-check-size) * 2);
    }

    .hero-shade {
        position: absolute;
        inset: 0;
        background-image: linear-gradient(to bottom, transparent, var(--artist-hero-gradient-end));
    }

    .hero-content {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: var(--artist-hero-text-gap);
        min-width: 0;
        max-width: 100%;
    }

    .hero-name {
        @include text('screen-title-48px');
        max-width: 100%;
        margin: 0;
        color: var(--artist-hero-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .hero-infos {
        @include text('paragraph-14px');
        display: flex;
        flex-wrap: wrap;
        gap: var(--artist-hero-text-gap);
        padding-bottom: var(--artist-hero-text-gap);
        color: var(--artist-hero-color);
    }

    .hero-buttons {
        display: flex;
        align-items: center;
        gap: var(--artist-hero-buttons-gap);
    }

    .hero-btn {
        display: grid;
        place-items: center;
        flex: none;
        padding: 0;
        border: none;
        border-radius: 400px;
        background: transparent;
        color: var(--artist-hero-color);
        cursor: pointer;
        transition: background-color 0.2s ease-out;

        svg {
            flex: none;
            display: block;
            overflow: visible;
        }

        &:hover,
        &.context-open {
            background-color: var(--hover-bg);
        }
    }

    .hero-play {
        width: var(--artist-hero-play-size);
        height: var(--artist-hero-play-size);
        background-color: var(--artist-hero-play-bg);

        svg {
            width: var(--artist-hero-play-icon-size);
            height: var(--artist-hero-play-icon-size);
        }

        // the triangle is moved 4px to the right of the center; the pause has no padding
        &:not(.is-pause) {
            padding-left: var(--artist-hero-play-pad-left);
        }
    }

    .hero-fav {
        width: var(--artist-hero-fav-size);
        height: var(--artist-hero-fav-size);

        svg {
            width: var(--artist-track-icon-size);
            height: var(--artist-track-icon-size);
        }

        &.favorited svg {
            color: var(--artist-hero-fav-color);
        }
    }

    .hero-options {
        width: var(--artist-hero-options-width);
        height: var(--artist-hero-fav-size);

        svg {
            width: var(--artist-track-icon-size);
            height: var(--artist-track-icon-size);
        }
    }
}
</style>
