<template>
    <section class="feed-row">
        <div class="feed-row-header">
            <h2 class="feed-row-title">{{ title }}</h2>
            <RouterLink v-if="route" :to="route" class="feed-row-link">{{ $t('FeedPanel.ViewHistory') }}</RouterLink>
        </div>
        <div class="feed-row-cards">
            <template v-if="type === 'artist'">
                <ArtistThumb v-for="artist in (items as Artist[])" :key="artist.artisthash" :artist="artist" />
            </template>
            <template v-else>
                <AlbumThumb v-for="album in (items as Album[])" :key="album.albumhash" :album="album" />
            </template>
        </div>
    </section>
</template>

<script setup lang="ts">
import { RouteLocationRaw } from 'vue-router'

import { Album, Artist } from '@/interfaces'

import AlbumThumb from './AlbumThumb.vue'
import ArtistThumb from './ArtistThumb.vue'

// One block of the FeedPanel (Figma "most-played-artists", node 12397:368): the header (title and, when the
// block has a history page, "View history") and the 8 cards, 20px under it.
defineProps<{
    title: string
    type: 'artist' | 'album'
    items: Artist[] | Album[]
    // the page of the history; "Recently added" has none and shows no link
    route?: RouteLocationRaw
}>()
</script>

<style lang="scss">
.feed-row {
    display: flex;
    flex-direction: column;
    gap: var(--feedpanel-header-gap);
    min-width: 0;

    .feed-row-header {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 10px;
    }

    .feed-row-title {
        @include text('section-title-28px');
        margin: 0;
        min-width: 0;
        color: var(--feedpanel-title-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .feed-row-link {
        @include text('paragraph-18px');
        flex-shrink: 0;
        color: var(--feedpanel-link-color);
        white-space: nowrap;

        &:hover {
            text-decoration: underline;
        }
    }

    .feed-row-cards {
        display: grid;
        // Up to 8 cards per row, each one 1/8 of the width when there is room. When the 8 would be smaller than
        // --feedpanel-card-min-width the cards wrap to fewer columns (never fewer than 2) instead of shrinking; the
        // 8 items are always there, so it ends in up to 4 rows. The track minimum is the larger of the two limits (the
        // 1/8 share and the minimum width), capped at half the width so 2 per row always fit.
        grid-template-columns: repeat(
            auto-fill,
            minmax(
                min(
                    max(
                        var(--feedpanel-card-min-width),
                        calc((100% - (var(--feedpanel-card-columns) - 1) * var(--feedpanel-card-gap)) / var(--feedpanel-card-columns))
                    ),
                    calc((100% - (var(--feedpanel-card-columns-min) - 1) * var(--feedpanel-card-gap)) / var(--feedpanel-card-columns-min))
                ),
                1fr
            )
        );
        gap: var(--feedpanel-card-gap);
        align-items: start;
    }
}
</style>
