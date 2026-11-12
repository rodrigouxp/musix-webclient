<template>
    <RouterLink
        :to="{ name: Routes.artist, params: { hash: artist.artisthash } }"
        class="artist-thumb"
        :class="{ 'context-menu-open': contextMenuFlag }"
        @contextmenu.prevent="showContextMenu"
    >
        <div class="image">
            <img class="img" :src="imguri + artist.image" alt="" loading="lazy" />
            <template v-if="!noPlay">
                <div class="overlay" :style="{ background: `linear-gradient(to top, ${artist.color} 20%, transparent)` }"></div>
                <PlayBtn :artisthash="artist.artisthash" :artistname="artist.name" :source="playSources.artist" />
            </template>
        </div>
        <div class="name">{{ artist.name }}</div>
        <div v-if="showHelp && artist.help_text" class="help">{{ artist.help_text }}</div>
    </RouterLink>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import { paths } from '@/config'
import { playSources } from '@/enums'
import { showArtistContextMenu } from '@/helpers/contextMenuHandler'
import { Artist } from '@/interfaces'
import { Routes } from '@/router'

import PlayBtn from '@/components/shared/PlayBtn.vue'

// ArtistThumb of the Figma (node 12408:1934): the round image, with the name 4px under it. It keeps what the
// old ArtistCard did: click opens the artist, right click opens the artist menu, the play button shows on hover.
// `showHelp` is for the pages "View history": the number of plays goes under the name.
// `noPlay` takes out the play button (and the shade it comes with): the card only opens the artist (album page).
const props = defineProps<{
    artist: Artist
    showHelp?: boolean
    noPlay?: boolean
}>()

const imguri = paths.images.artist.medium
const contextMenuFlag = ref(false)

function showContextMenu(e: MouseEvent) {
    showArtistContextMenu(e, contextMenuFlag, props.artist.artisthash, props.artist.name)
}
</script>

<style lang="scss">
.artist-thumb {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--feedpanel-card-text-gap);
    min-width: 0;

    .image {
        position: relative;
        width: 100%;
        aspect-ratio: 1;
        border-radius: 400px;
        overflow: hidden;

        .img {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: cover;
        }


        .overlay {
            position: absolute;
            inset: 0;
            opacity: 0;
            transition: opacity 0.25s ease;
        }

        // the play button: a round 40 x 40 (never wider than the image: the cards get small at 900px)
        .play-btn {
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            width: min(var(--feedpanel-play-size), 100%);
            height: auto; // the global `button` has its own height, which broke the aspect ratio (an oval)
            border-radius: var(--feedpanel-play-radius);
            margin: 0 auto;
            opacity: 0;
            transform: translateY(0);
            transition: all 0.25s;

            svg {
                height: 44%;
            }
        }
    }

    &:hover .image {
        .overlay {
            opacity: 1;
        }

        .play-btn {
            opacity: 1;
            transform: translateY(-12%);
        }
    }

    .name,
    .help {
        width: 100%;
        padding: 0;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .name {
        @include text('paragraph-18px');
        color: var(--feedpanel-name-color);
    }

    .help {
        @include text('paragraph-14px');
        color: var(--feedpanel-subtitle-color);
    }
}
</style>
