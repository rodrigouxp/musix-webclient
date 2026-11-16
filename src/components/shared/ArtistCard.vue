<template>
    <RouterLink
        :to="{
            name: Routes.artist,
            params: {
                hash: artist.artisthash,
            },
        }"
        class="artist-card"
        @contextmenu.prevent="showContextMenu"
        :class="{ 'context-menu-open': contextMenuFlag }"
    >
        <div class="image circular">
            <img class="artist-image circular" :src="imguri + artist.image" />
        </div>
        <div v-if="artist.help_text" class="rhelp t-center">
            <span class="help" :class="{ keep: !artist.time }">{{ artist.help_text }}</span>
            <span class="time">{{ artist.time }}</span>
        </div>
        <div class="artist-name t-center">
            {{ artist.name }}
        </div>
        <div v-if="showTrackcount && artist.trackcount" class="racount t-center">
            {{ $t('ArtistCard.TrackCount', {count: artist.trackcount}, artist.trackcount) }}
        </div>
    </RouterLink>
</template>

<script setup lang="ts">
import { paths } from '@/config'
import { Artist } from '@/interfaces'
import { Routes } from '@/router'

import { ref } from 'vue'
import { showArtistContextMenu } from '@/helpers/contextMenuHandler'

const imguri = paths.images.artist.medium
const contextMenuFlag = ref(false)

const props = defineProps<{
    artist: Artist
    // Artist cards from the server always carry a trackcount; show it only where a view asks for it.
    showTrackcount?: boolean
}>()

const showContextMenu = (e: MouseEvent) => {
    showArtistContextMenu(e, contextMenuFlag, props.artist.artisthash, props.artist.name)
}
</script>

<style lang="scss">
.artist-card {
    overflow: hidden;
    position: relative;

    border-radius: $medium;
    justify-content: center;
    padding: 1.2rem 1rem !important;
    font-size: 0.95rem;
    font-weight: 700;
    height: max-content;
    @include card-lift;

    &.context-menu-open {
        background-color: $gray5;
    }

    .image {
        position: relative;
    }

    .artist-image {
        width: 100%;
        transition: all 0.5s ease-in-out;
        object-fit: cover;
        margin-bottom: $smaller;
    }

    .artist-name {
        word-break: break-word;
    }

    .racount {
        font-size: 12px;
        color: #ffffffbf;
    }
}
</style>
