import { defineStore } from 'pinia'
import { ref } from 'vue'

import { Album, Artist, Track } from '@/interfaces'
import { getHomePageData } from '@/requests/home'
import { getPlaylist } from '@/requests/playlists'
import { getChartItem } from '@/requests/stats'

// The FeedPanel of the Home (desktop, above 600px): four rows of 8 cards, always (recently played tracks on top).
export const FEED_CARDS = 8

// The page "View history" lists everything that was played; the server has no cap on `limit`, and 500 is
// far more than anyone scrolls (no pagination).
export const HISTORY_LIMIT = 500

// "Recently added" comes from the homepage entry (already turned into albums, artists, folders and tracks). It
// mixes the types and the row only has album cards, so ask for more than 8 and keep the albums.
const RECENTLY_ADDED_POOL = 40

type RecentItem = { type: string; item?: Album }

export default defineStore('feedpanel', () => {
    const recentlyPlayed = ref<Track[]>([])
    const topArtists = ref<Artist[]>([])
    const topAlbums = ref<Album[]>([])
    const recentlyAdded = ref<Album[]>([])

    async function fetchAll() {
        const [artists, albums, home, recent] = await Promise.all([
            getChartItem('artists', 'alltime', FEED_CARDS, 'playcount'),
            getChartItem('albums', 'alltime', FEED_CARDS, 'playcount'),
            getHomePageData(RECENTLY_ADDED_POOL),
            // the special playlist "recentlyplayed": the last plays, the latest first (the server ignores the limit)
            getPlaylist('recentlyplayed'),
        ])

        if (Array.isArray(recent?.tracks)) recentlyPlayed.value = recent.tracks.slice(0, FEED_CARDS)

        // a request that failed leaves its row as it was (and the page does not break)
        if (Array.isArray(artists?.data?.artists)) topArtists.value = artists.data.artists.slice(0, FEED_CARDS)
        if (Array.isArray(albums?.data?.albums)) topAlbums.value = albums.data.albums.slice(0, FEED_CARDS)

        if (Array.isArray(home)) {
            const entry = home.find((e: any) => e && e.recently_added)?.recently_added
            const items: RecentItem[] = entry?.items ?? []

            recentlyAdded.value = items
                .filter(i => i.type === 'album' && i.item)
                .map(i => i.item as Album)
                .slice(0, FEED_CARDS)
        }
    }

    return { recentlyPlayed, topArtists, topAlbums, recentlyAdded, fetchAll }
})
