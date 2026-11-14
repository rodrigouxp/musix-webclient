<template>
    <div
        class="track-thumb"
        :class="{ 'context-menu-open': contextMenuFlag }"
        role="button"
        tabindex="0"
        :title="track.title"
        @click="playThis"
        @keydown.enter.prevent="playThis"
        @contextmenu.prevent="showMenu"
    >
        <div class="cover">
            <img class="img" :src="imguri + track.image" alt="" loading="lazy" />
        </div>
        <div class="text">
            <div v-tooltip class="title">{{ track.title }}</div>
            <div v-if="track.artists?.length" class="artist" @click.stop>
                <RouterLink :to="{ name: Routes.artist, params: { hash: track.artists[0].artisthash } }">
                    {{ track.artists[0].name }}
                </RouterLink>
            </div>
            <div v-if="track.album" class="album" @click.stop>
                <RouterLink :to="{ name: Routes.album, params: { albumhash: track.albumhash } }">
                    {{ track.album }}
                </RouterLink>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import { paths } from '@/config'
import { showTrackContextMenu } from '@/helpers/contextMenuHandler'
import { playFromPlaylist } from '@/helpers/usePlayFrom'
import { Track } from '@/interfaces'
import { Routes } from '@/router'

// TrackThumb of the Penpot (Rodrigo, 2026-11-14): the square cover (164, radius 8, a 1px border inside) and under it
// the title of the track, its artist and its album; no plate behind the cover. A click plays the track from the
// list of the recently played; the artist and the album are links; right click opens the menu of the track.
const props = defineProps<{
    track: Track
}>()

const imguri = paths.images.thumb.medium
const contextMenuFlag = ref(false)

function playThis() {
    playFromPlaylist('recentlyplayed', props.track)
}

function showMenu(e: MouseEvent) {
    showTrackContextMenu(e, props.track, contextMenuFlag)
}
</script>

<style lang="scss">
.track-thumb {
    display: flex;
    flex-direction: column;
    gap: var(--feedpanel-track-gap);
    min-width: 0;
    cursor: pointer;

    // the 1px border is inside the cover, over the image
    .cover {
        position: relative;
        width: 100%;
        aspect-ratio: 1;
        border-radius: var(--feedpanel-album-radius);
        overflow: hidden;

        &::after {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: inherit;
            box-shadow: inset 0 0 0 1px var(--feedpanel-track-border);
            pointer-events: none;
        }

        .img {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: top left;
        }
    }

    .text {
        min-width: 0;
        padding: var(--feedpanel-album-text-padding);
    }

    .title,
    .artist,
    .album {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .title {
        @include text('album-title-16px');
        color: var(--feedpanel-name-color);
    }

    .artist,
    .album {
        @include text('paragraph-14px');
        color: var(--feedpanel-subtitle-color);
    }

    .artist a,
    .album a {
        color: inherit;
        cursor: pointer;

        &:hover {
            text-decoration: underline;
        }
    }

    &:focus-visible {
        outline: 2px solid var(--color-neutral-300);
        outline-offset: 2px;
    }
}
</style>
