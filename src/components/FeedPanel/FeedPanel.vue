<template>
    <div class="feedpanel">
        <h1 class="feed-title">{{ title }}</h1>

        <FeedRow
            v-if="feed.topArtists.length"
            :title="$t('FeedPanel.MostPlayedArtists')"
            type="artist"
            :items="feed.topArtists"
            :route="{ name: Routes.historyArtists }"
        />
        <FeedRow
            v-if="feed.topAlbums.length"
            :title="$t('FeedPanel.MostPlayedAlbums')"
            type="album"
            :items="feed.topAlbums"
            :route="{ name: Routes.historyAlbums }"
        />
        <FeedRow
            v-if="feed.recentlyAdded.length"
            :title="$t('FeedPanel.RecentlyAdded')"
            type="album"
            :items="feed.recentlyAdded"
        />
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

import { Routes } from '@/router'
import useFeed from '@/stores/feedpanel'

import FeedRow from './FeedRow.vue'

// FeedPanel of the Figma (node 12408:1935): the greeting and three blocks (most played artists, most played
// albums, recently added). Only on the desktop, in the default layout (HomeView decides).
defineProps<{ title: string }>()

const feed = useFeed()

onMounted(() => feed.fetchAll())
</script>

<style lang="scss">
.feedpanel {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: var(--feedpanel-block-gap);
    height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
    // the thin scrollbar sits inside the right padding of the Figma, not next to it
    scrollbar-gutter: stable;
    padding: var(--feedpanel-padding-top) calc(var(--feedpanel-padding-right) - var(--feedpanel-scrollbar-width))
        var(--feedpanel-padding-bottom) var(--feedpanel-padding-left);

    .feed-title {
        @include text('screen-title-48px');
        flex-shrink: 0;
        margin: 0;
        color: var(--feedpanel-title-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .feed-row {
        flex-shrink: 0;
    }
}
</style>
