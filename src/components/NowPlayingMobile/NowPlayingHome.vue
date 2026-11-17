<template>
    <div class="npm-home">
        <!-- the cover is the only thing that changes its size: a square as wide as the screen, or as tall as the room
             left by the rest. It stays right under the source name and above the texts; the free room is under all of it -->
        <div class="npm-cover-box">
            <div class="npm-cover">
                <!-- the cover is as wide as the screen: the biggest thumbnail (up to 1200px, the one of the expanded cover of the album
                     page), not the 512px one, which looked soft on a phone and on a tablet (Rodrigo, 2026-11-16) -->
                <ImageLoader
                    :image="paths.images.thumb.original + queue.currenttrack?.image"
                    :blurhash="queue.currenttrack?.blurhash"
                    :duration="1000"
                />
            </div>
        </div>

        <div class="npm-info">
            <div class="npm-text">
                <span class="npm-title">{{ queue.currenttrack?.title || $t('BottomBar.PlaceholderTitle') }}</span>
                <span class="npm-artist">
                    <template v-if="artists.length">
                        <template v-for="(artist, index) in artists" :key="index">
                            <a :href="artistHref(artist.artisthash)" @click.prevent="openArtist(artist.artisthash)">{{ artist.name }}</a
                            ><span v-if="index < artists.length - 1">, </span>
                        </template>
                    </template>
                    <template v-else>{{ fallbackArtist }}</template>
                </span>
            </div>
            <div class="npm-actions">
                <button
                    class="npm-action"
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
                    class="npm-action"
                    :title="$t('BottomBar.Add')"
                    :aria-label="$t('BottomBar.Add')"
                    :disabled="!hasTrack"
                    @click="showAddMenu"
                >
                    <AddSvg />
                </button>
                <button
                    ref="optionsButton"
                    class="npm-action npm-options"
                    :title="$t('NowPlayingMobile.Options')"
                    :aria-label="$t('NowPlayingMobile.Options')"
                    :disabled="!hasTrack"
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
import { RouteLocationRaw, useRouter } from 'vue-router'

import { paths } from '@/config'
import { favType } from '@/enums'
import favoriteHandler from '@/helpers/favoriteHandler'
import { showPlayingAddMenu, showTrackContextMenu } from '@/helpers/contextMenuHandler'
import { Routes } from '@/router'
import useQueue from '@/stores/queue'

import AddSvg from '@/assets/icons/figma/add.svg'
import FavoriteSvg from '@/assets/icons/figma/favorite.svg'
import OptionsSvg from '@/assets/icons/figma/options.svg'
import ImageLoader from '@/components/shared/ImageLoader.vue'

// The home tab of NowPlaying (Figma node 12294:355): the cover, the name and the artist of the song, and its favorite
// and add buttons. Tokens --nowplaying-*.
const emit = defineEmits<{
    // the screen is replaced by the page of the artist
    (e: 'leave', location: RouteLocationRaw): void
}>()

const queue = useQueue()
const router = useRouter()
const addButton = ref<HTMLElement>()
const optionsButton = ref<HTMLElement>()

const hasTrack = computed(() => !!queue.currenttrack?.trackhash)
const artists = computed(() => queue.currenttrack?.artists ?? [])

const fallbackArtist = computed(() => {
    const albumartists = queue.currenttrack?.albumartists

    return typeof albumartists === 'string' ? albumartists : ''
})

const artistLocation = (hash: string): RouteLocationRaw => ({ name: Routes.artist, params: { hash } })
const artistHref = (hash: string) => router.resolve(artistLocation(hash)).href
const openArtist = (hash: string) => emit('leave', artistLocation(hash))

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

// the menu of the song, opened upward from the button (the buttons are low on the screen)
function showOptions() {
    const track = queue.currenttrack

    if (!optionsButton.value || !track) return

    const rect = optionsButton.value.getBoundingClientRect()
    const point = { x: rect.right, y: rect.top - 4 } as MouseEvent

    showTrackContextMenu(point, track, ref(false), 'top-end', ['top-start'])
}
</script>

<style lang="scss">
.npm-home {
    display: flex;
    flex-direction: column;
    // Penpot: the group "top" is packed at the top with a gap of 12 (the name of the source above is the first of it); it
    // does not grow, so the free room goes between it and the PlayingControls, not between the cover and the texts. It
    // only shrinks (the cover gets smaller) when the screen is too short
    flex: 0 1 auto;
    gap: var(--nowplaying-gap);
    min-height: 0;

    // a square box as wide as the screen; on a short screen it shrinks in height and the cover (a square that fits in it)
    // gets smaller, centered
    .npm-cover-box {
        container-type: size;
        display: grid;
        place-items: center;
        flex: 0 1 auto;
        width: 100%;
        aspect-ratio: 1;
        min-height: 0;
    }

    // a square of the width of the screen, never taller than the room (then it gets smaller)
    .npm-cover {
        flex-shrink: 0;
        width: min(100cqw, 100cqh);
        aspect-ratio: 1;
        border-radius: var(--nowplaying-cover-radius);
        box-shadow: var(--nowplaying-cover-shadow);
        overflow: hidden;

        .image-loader {
            height: 100% !important;
        }

        .il-image,
        .blurhash-placeholder {
            border-radius: var(--nowplaying-cover-radius);
        }
    }

    // the buttons are at the top, level with the first line of the text (the title is 32 high, the buttons 24 + 4 + 4)
    .npm-info {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        flex-shrink: 0;
        gap: var(--nowplaying-gap);
    }

    .npm-text {
        display: flex;
        flex-direction: column;
        gap: var(--nowplaying-info-gap);
        min-width: 0;
    }

    .npm-title {
        @include text('album-title-24px');
        color: var(--nowplaying-title-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .npm-artist {
        @include text('action-button-16px');
        color: var(--nowplaying-artist-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        a {
            color: inherit;
        }
    }

    .npm-actions {
        display: flex;
        align-items: center;
        flex-shrink: 0;
        gap: var(--nowplaying-actions-gap);
        padding: var(--nowplaying-actions-padding);
    }

    .npm-action {
        display: grid;
        place-items: center;
        width: var(--nowplaying-actions-icon-size);
        height: var(--nowplaying-actions-icon-size);
        padding: 0;
        border: none;
        background: transparent;
        color: var(--color-neutral-white);
        -webkit-tap-highlight-color: transparent;

        &:focus-visible {
            outline: 2px solid var(--color-primary-300);
            outline-offset: -2px;
        }

        svg {
            width: var(--nowplaying-actions-icon-size);
            height: var(--nowplaying-actions-icon-size);
        }

        // favorited: error/300, as in the other heart buttons
        &.favorited {
            color: var(--color-error-300);
        }

        &:disabled {
            opacity: 0.4;
            pointer-events: none;
        }
    }

    // the three dots are 12 wide in the layout (the icon box is 24): the negative margin keeps the 12
    .npm-options {
        margin: 0 calc((var(--nowplaying-options-width) - var(--nowplaying-actions-icon-size)) / 2);
    }
}
</style>
