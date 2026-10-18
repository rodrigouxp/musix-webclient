import { defineStore } from 'pinia'

import { getArtistAlbums, getArtistData, getSimilarArtists } from '@/requests/artists'

import { paths } from '@/config'
import { Album, Artist, Genre, StatItem, Track } from '@/interfaces'
import { Routes, router } from '@/router'
import { maxAbumCards } from '@/stores/content-width'
import useSettingsStore from '@/stores/settings'
import setColorsToStore from '@/utils/colortools/setColorsToStore'

export default defineStore('artistPage', {
    state: () => ({
        info: <Artist>{},
        tracks: <Track[]>[],
        albums: <Album[]>[],
        eps: <Album[]>[],
        compilations: <Album[]>[],
        singles: <Album[]>[],
        soundtracks: <Album[]>[],
        live_albums: <Album[]>[],
        appearances: <Album[]>[],
        similar_artists: <Artist[]>[],
        colors: {
            bg: '',
            btn: '',
        },
        fetched_similar_hash: '',
        // set after the photo is replaced, so the browser loads the new one
        photoVersion: 0,
        stats: <StatItem[]>[],
    }),
    getters: {
        photoQuery: state => (state.photoVersion ? `?v=${state.photoVersion}` : ''),
    },
    actions: {
        async getData(hash: string) {
            const settings = useSettingsStore()
            const { artist, tracks, stats, albums } = await getArtistData(
                hash,
                settings.artist_top_tracks_count,
                maxAbumCards.value
            )

            if (this.info.artisthash !== artist.artisthash) {
                this.photoVersion = 0
            }

            this.info = artist
            this.tracks = tracks

            this.setAlbums(albums)
            this.setStats(stats)
            this.extractColors()
        },
        setAlbums(srcalbums: { [key: string]: Album[] }) {
            const { albums, singles_and_eps, soundtracks, live_albums, appearances, compilations } = srcalbums

            this.albums = albums
            this.singles = singles_and_eps
            this.soundtracks = soundtracks ?? []
            this.live_albums = live_albums ?? []
            this.appearances = appearances
            this.compilations = compilations
        },
        setStats(stats: StatItem[]) {
            this.stats = []
            this.stats = stats
        },
        async fetchSimilarArtists() {
            if (this.fetched_similar_hash === this.info.artisthash) return
            this.fetched_similar_hash = this.info.artisthash
            this.similar_artists = await getSimilarArtists(this.info.artisthash, maxAbumCards.value)
        },
        extractColors() {
            const url = paths.images.artist.large + this.info.image + this.photoQuery
            setColorsToStore(this, url, true)
        },
        bumpPhoto() {
            this.photoVersion = Date.now()
            this.extractColors()
        },
        setBgColor() {
            const colors = this.info.color
            this.colors.bg = colors ? colors : ''
        },
        resetAlbums() {
            this.colors.bg = ''
            this.albums = []
            this.eps = []
            this.singles = []
            this.soundtracks = []
            this.live_albums = []
        },
        resetSimilarArtists() {
            this.similar_artists = []
        },
        resetAll() {
            setTimeout(() => {
                if (router.currentRoute.value.name == Routes.artist) return
                this.resetAlbums()
                this.resetSimilarArtists()
                this.fetched_similar_hash = ''
                this.stats = []
            }, 5000)
        },
        makeFavorite() {
            this.info.is_favorite = true
        },
        removeFavorite() {
            this.info.is_favorite = false
        },
    },
})
