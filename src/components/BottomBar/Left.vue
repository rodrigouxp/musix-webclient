<template>
    <div v-auto-animate class="left-group" :class="{ 'on-desktop': !isMobile }">
        <!-- above 900px the thumbnail goes to the album that is playing; until 900px it goes to Now Playing -->
        <RouterLink
            :title="isMobile ? $t('BottomBar.GoToNowPlaying') : $t('BottomBar.GoToAlbum')"
            :to="thumbnailLink"
            class="np-image rounded-sm no-scroll"
            :class="{ disabled: !isMobile && !queue.currenttrack?.albumhash }"
        >
            <!-- <img :src="paths.images.thumb.small + queue.currenttrack?.image" alt="" /> -->
            <ImageLoader
                :image="paths.images.thumb.small + queue.currenttrack?.image"
                :blurhash="queue.currenttrack.blurhash"
                :duration="1000"
                img-class="rounded-sm"
                :style="{ width: isMobile ? '48px' : 'var(--playerbar-artwork-size)', aspectRatio: '1' }"
            />
            <div v-if="isMobile" class="expandicon">
                <ExpandSvg />
            </div>
        </RouterLink>
        <div
            class="track-info"
            :style="{
                color: getShift(colors.lightVibrant, [0, -170]),
            }"
        >
            <div v-tooltip class="title">
                <TextLoader
                    :text="queue.currenttrack?.title || $t('BottomBar.PlaceholderTitle') "
                    :duration="1000"
                    :fade-duration="1000"
                    :direction="queue.direction"
                />
                <ExplicitIcon
                    v-if="queue.currenttrack?.explicit"
                    :key="queue.currenttrack.trackhash"
                    class="explicit-icon"
                />
                <MasterFlag :key="queue.currenttrack?.trackhash" :bitrate="queue.currenttrack?.bitrate || 0" />
            </div>
            <ArtistName
                :artists="queue.currenttrack?.artists || []"
                :albumartists="queue.currenttrack?.albumartists || $t('BottomBar.PlaceholderArtist')"
                class="artist"
            />
        </div>
        <!-- above 900px: favorite and add (the favorite is not in the right group anymore) -->
        <template v-if="!isMobile">
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
        </template>
        <Actions v-if="isLargerMobile" @handleFav="$emit('handleFav')" />
        <HotKeys v-if="isMobile" />
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { paths } from '@/config'
import { showPlayingAddMenu } from '@/helpers/contextMenuHandler'
import { Routes } from '@/router'
import { getShift } from '@/utils/colortools/shift'

import useQStore from '@/stores/queue'
import useColorStore from '@/stores/colors'
import useSettingsStore from '@/stores/settings'
import { isLargerMobile, isMobile } from '@/stores/content-width'

import Actions from './Right.vue'
import HeartSvg from '../shared/HeartSvg.vue'
import AddSvg from '@/assets/icons/figma/add.svg'
import ExpandSvg from '@/assets/icons/expand.svg'
import MasterFlag from '../shared/MasterFlag.vue'
import TextLoader from '../shared/TextLoader.vue'
import HotKeys from '../LeftSidebar/NP/HotKeys.vue'
import ExplicitIcon from '@/assets/icons/explicit.svg'
import ImageLoader from '@/components/shared/ImageLoader.vue'
import ArtistName from '@/components/shared/ArtistName.vue'

const queue = useQStore()
const colors = useColorStore()
const settings = useSettingsStore()

const hasTrack = computed(() => !!queue.currenttrack?.trackhash)
const addButton = ref<HTMLElement>()

// the thumbnail: the album that is playing (above 900px), Now Playing (until 900px)
const thumbnailLink = computed(() => {
    if (isMobile.value) return { name: Routes.nowPlaying, params: { tab: 'home' }, replace: true }

    const albumhash = queue.currenttrack?.albumhash
    return albumhash ? { name: Routes.album, params: { albumhash } } : { name: Routes.Home }
})

function showAddMenu() {
    if (!addButton.value || !queue.currenttrack) return
    showPlayingAddMenu(addButton.value, queue.currenttrack)
}

defineEmits<{
    (e: 'handleFav'): void
}>()
</script>

<style lang="scss">
.left-group {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: $medium;
    align-items: center;
    font-size: small;
    font-weight: 700;
    line-height: 1.2;
    margin-right: $medium;

    .text-loader {
        height: 1rem;
    }

    .np-image {
        position: relative;
        height: 3rem;

        img {
            height: 100%;
        }

        .expandicon {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(51, 51, 51, 0.6);

            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.2s ease-out, height 0.2s ease-out, transform 0.2s ease-out,
                background-color 0.2s ease-out;

            svg {
                transform: rotate(-90deg) scale(0.92);
            }
        }

        &:hover {
            .expandicon {
                transform: translateY(-$medium);
                height: 130%;
            }
        }

        &:active {
            .expandicon {
                background-color: rgba(51, 51, 51, 0.74);
            }
        }

        @include largePhones {
            flex-shrink: 0;
            margin-right: $medium;
        }

        @include smallerPhones {
            margin-right: $small;
        }
    }

    .heart-button {
        height: 3rem;
        width: 3rem;
        border: solid 1px $gray4;
        padding: 0;
    }

    // above 900px (the PlayerBar of the Figma): thumbnail, text, favorite and add; what does not
    // fit is the text (it is cut with an ellipsis), never the buttons
    &.on-desktop {
        display: flex;
        align-items: center;
        // between the song (thumbnail and text), the favorite and the add
        gap: var(--playerbar-left-gap);
        min-width: 0;
        font-family: var(--playerbar-font);
        font-size: var(--playerbar-text-size);
        font-weight: var(--playerbar-text-weight);
        line-height: var(--playerbar-text-line-height);

        .np-image {
            flex-shrink: 0;
            // the thumbnail and the text are closer than the rest (14px)
            margin: 0 calc(var(--playerbar-track-gap) - var(--playerbar-left-gap)) 0 0;
            height: var(--playerbar-artwork-size);
            border-radius: var(--playerbar-artwork-radius);
            box-shadow: var(--playerbar-shadow);

            .il-image,
            .blurhash-placeholder {
                border-radius: var(--playerbar-artwork-radius);
            }

            &.disabled {
                pointer-events: none;
            }
        }

        .track-info {
            flex: 0 1 auto;
            min-width: 0;
            overflow: hidden;
        }

        .track-info .title {
            min-width: 0;
            margin-bottom: 0;
            color: var(--playerbar-title-color);
        }

        .track-info .text-loader {
            min-width: 0;
            max-width: 100%;
            overflow: hidden;
            height: var(--playerbar-text-line-height);
        }

        .track-info .artistname {
            opacity: 1;
            color: var(--playerbar-artist-color);

            a {
                font-size: inherit;
                color: inherit;
            }
        }

        // the favorite and the add button: no circle in the Figma, only the icon (20px); the hover is
        // a circle of 28px around it (-4px of margin keeps the 20px of layout and the 40px of distance)
        .heart-button,
        .add-button {
            flex-shrink: 0;
            width: var(--playerbar-side-control-size);
            height: var(--playerbar-side-control-size);
            margin: calc((var(--playerbar-icon-size) - var(--playerbar-side-control-size)) / 2);
            padding: 0;
            border: none;
            aspect-ratio: auto;
            display: grid;
            place-items: center;
        }

        .heart-button div svg,
        .add-button svg {
            height: var(--playerbar-icon-size);
            width: var(--playerbar-icon-size);
        }

        .add-button svg:active {
            transform: scale(0.6);
        }
    }

    .track-info {
        .title {
            color: $white;
            display: flex;
            align-items: center;
            margin-bottom: 2px;
        }

        .artistname {
            opacity: 0.75;

            a {
                font-size: 0.8rem;
            }
        }

        @include allPhones {
            width: calc(100% + 8px);
        }

        @include largePhones {
            width: unset;
            flex-grow: 1;
        }
    }

    @include allPhones {
        grid-template-columns: max-content 1fr max-content max-content;
        margin-right: unset;

        .heart-button {
            height: max-content;
            border: 1px solid transparent;
        }
    }

    @include largePhones {
        display: flex;
        gap: 0;
        max-width: calc(100% - 8px);
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }

        to {
            opacity: 1;
        }
    }

    .explicit-icon,
    .master-flag {
        opacity: 0;
        animation: fadeIn 0.5s ease-in-out forwards;
        animation-delay: 1.5s;
    }
}
</style>
