<template>
    <RouterLink
        :to="{ name: Routes.artist, params: { hash: artist.artisthash } }"
        class="artist-thumb"
        :class="{ 'context-menu-open': contextMenuFlag }"
        @contextmenu.prevent="showContextMenu"
    >
        <div class="image">
            <img class="img" :src="imguri + artist.image" alt="" loading="lazy" />
        </div>
        <div class="name">{{ artist.name }}</div>
        <div v-if="showHelp && artist.help_text" class="help">{{ artist.help_text }}</div>
    </RouterLink>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import { paths } from '@/config'
import { showArtistContextMenu } from '@/helpers/contextMenuHandler'
import { Artist } from '@/interfaces'
import { Routes } from '@/router'

// ArtistThumb of the Figma (node 12408:1934): the round image, with the name 4px under it. It keeps what the
// old ArtistCard did: click opens the artist, right click opens the artist menu. There is no play button or shade on
// hover (Rodrigo, 2026-11-13): the thumb only opens the artist. `showHelp` is for the pages "View history": the number
// of plays goes under the name.
const props = defineProps<{
    artist: Artist
    showHelp?: boolean
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
