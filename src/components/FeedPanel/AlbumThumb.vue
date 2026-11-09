<template>
    <RouterLink
        :to="{ name: Routes.album, params: { albumhash: album.albumhash } }"
        class="album-thumb"
        :class="{ 'context-menu-open': contextMenuFlag }"
        @contextmenu.prevent="showMenu"
    >
        <div class="thumb">
            <div class="plate"></div>
            <div class="cover">
                <img class="img" :src="imguri + album.image" alt="" loading="lazy" />
                <div
                    class="overlay"
                    :style="{ background: `linear-gradient(to top, ${album.color} 20%, transparent)` }"
                ></div>
                <PlayBtn :source="playSources.album" :album-hash="album.albumhash" :album-name="album.title" />
            </div>
        </div>
        <div class="text">
            <div v-tooltip class="title">{{ album.title }}</div>
            <div
                v-if="variant === 'home' && album.albumartists.length > 0"
                class="artist"
                @click.prevent.stop="() => {}"
            >
                <RouterLink :to="{ name: Routes.artist, params: { hash: album.albumartists[0].artisthash } }">
                    {{ album.albumartists[0].name }}
                </RouterLink>
            </div>
            <div v-if="year" class="year">{{ year }}</div>
            <div v-if="showHelp && album.help_text" class="help">{{ album.help_text }}</div>
        </div>
    </RouterLink>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { paths } from '@/config'
import { playSources } from '@/enums'
import { showAlbumContextMenu } from '@/helpers/contextMenuHandler'
import { Album } from '@/interfaces'
import { Routes } from '@/router'

import PlayBtn from '@/components/shared/PlayBtn.vue'

// AlbumThumb of the Figma (nodes 12408:2422 and 12462:4315): a plate behind the square cover, then the title, the
// artist and the year. Two variants: `home` (title, artist and year: the Home, "View history" and the Appearances
// tab) and `artist` (title and year: the other tabs of the artist page, where the artist would be redundant).
// It keeps what the old AlbumCard did: click opens the album, the name of the artist opens the artist, right
// click opens the album menu, the play button shows on hover. `showHelp` is for the pages "View history".
const props = withDefaults(
    defineProps<{
        album: Album
        showHelp?: boolean
        variant?: 'home' | 'artist'
    }>(),
    { variant: 'home' }
)

const imguri = paths.images.thumb.medium

// the date is a unix time in seconds (0 when the album has none: no year then)
const year = computed(() => (props.album.date > 0 ? new Date(props.album.date * 1000).getUTCFullYear() : 0))
const contextMenuFlag = ref(false)

function showMenu(e: MouseEvent) {
    showAlbumContextMenu(e, contextMenuFlag, props.album)
}
</script>

<style lang="scss">
.album-thumb {
    display: flex;
    flex-direction: column;
    gap: var(--feedpanel-card-text-gap);
    min-width: 0;

    // 164 x 172 at the size of the Figma: the cover is a square stuck to the bottom, the plate peeks over it
    .thumb {
        position: relative;
        width: 100%;
        aspect-ratio: var(--feedpanel-album-ratio);
    }

    .plate {
        position: absolute;
        top: var(--feedpanel-album-plate-top);
        left: var(--feedpanel-album-plate-inset);
        right: var(--feedpanel-album-plate-inset);
        aspect-ratio: 1;
        border-radius: var(--feedpanel-album-radius);
        background-color: var(--feedpanel-album-plate-bg);
    }

    .cover {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        aspect-ratio: 1;
        border-radius: var(--feedpanel-album-radius);
        overflow: hidden;

        .img {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: top left;
        }

        // the stroke of 1 inside the cover
        &::after {
            content: '';
            position: absolute;
            inset: 0;
            border: var(--feedpanel-image-border);
            border-radius: inherit;
            pointer-events: none;
        }

        .overlay {
            position: absolute;
            inset: 0;
            opacity: 0;
            transition: opacity 0.25s ease;
        }

        // the play button: a round 40 x 40 (never wider than the cover: the cards get small at 900px)
        .play-btn {
            position: absolute;
            left: 0;
            right: 0;
            bottom: 8%;
            width: min(var(--feedpanel-play-size), 100%);
            height: auto; // the global `button` has its own height, which broke the aspect ratio (an oval)
            border-radius: var(--feedpanel-play-radius);
            margin: 0 auto;
            opacity: 0;
            transform: translateY(1rem);
            transition: all 0.25s;

            svg {
                height: 44%;
            }
        }
    }

    &:hover .cover {
        .overlay {
            opacity: 1;
        }

        .play-btn {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .text {
        min-width: 0;
        padding: var(--feedpanel-album-text-padding);
    }

    .title,
    .artist,
    .year,
    .help {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .title {
        @include text('album-title-16px');
        color: var(--feedpanel-name-color);
    }

    .artist,
    .year,
    .help {
        @include text('paragraph-14px');
        color: var(--feedpanel-subtitle-color);
    }

    .artist a {
        color: inherit;
        cursor: pointer;

        &:hover {
            text-decoration: underline;
        }
    }
}
</style>
