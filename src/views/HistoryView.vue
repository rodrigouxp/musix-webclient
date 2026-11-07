<template>
    <div class="feedpanel history-page">
        <h1 class="feed-title">{{ title }}</h1>

        <div v-if="items.length" class="history-grid">
            <template v-if="isArtists">
                <ArtistThumb v-for="artist in (items as Artist[])" :key="artist.artisthash" :artist="artist" show-help />
            </template>
            <template v-else>
                <AlbumThumb v-for="album in (items as Album[])" :key="album.albumhash" :album="album" show-help />
            </template>
        </div>
        <p v-else-if="loaded" class="history-empty">{{ $t('FeedPanel.NothingPlayed') }}</p>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import { useT } from '@/i18n'
import { Album, Artist } from '@/interfaces'
import { getChartItem } from '@/requests/stats'
import { Routes } from '@/router'
import { HISTORY_LIMIT } from '@/stores/feedpanel'
import updatePageTitle from '@/utils/updatePageTitle'

import AlbumThumb from '@/components/FeedPanel/AlbumThumb.vue'
import ArtistThumb from '@/components/FeedPanel/ArtistThumb.vue'

// The pages "View history" of the Home: everything that was played, most played first (all time, by play count),
// with the new cards and the number of plays under each one. They are not in the Figma: same panel and same
// cards as the Home, in a grid of columns as wide as the cards of the other grids of the app.
const { t } = useT()
const route = useRoute()

const isArtists = computed(() => route.name === Routes.historyArtists)
const title = computed(() => t(isArtists.value ? 'FeedPanel.MostPlayedArtists' : 'FeedPanel.MostPlayedAlbums'))

const items = ref<Artist[] | Album[]>([])
const loaded = ref(false)

onMounted(async () => {
    updatePageTitle(title.value)

    const group = isArtists.value ? 'artists' : 'albums'
    const res = await getChartItem(group, 'alltime', HISTORY_LIMIT, 'playcount')

    if (Array.isArray(res?.data?.[group])) items.value = res.data[group]
    loaded.value = true
})
</script>

<style lang="scss">
.history-page {
    .history-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(var(--feedpanel-history-card-min), 1fr));
        gap: var(--feedpanel-card-gap);
        align-items: start;
    }

    .history-empty {
        @include text('paragraph-18px');
        margin: 0;
        color: var(--feedpanel-subtitle-color);
    }
}
</style>
