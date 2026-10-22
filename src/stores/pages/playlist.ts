import { defineStore } from 'pinia'
import { ComputedRef } from 'vue'

import { useFuse } from '@/utils'

import { paths } from '@/config'
import { FuseTrackOptions } from '@/enums'
import { Artist, FuseResult, Playlist, Track } from '@/interfaces'
import { getPlaylist, removeBannerImage } from '@/requests/playlists'
import setColorsToStore from '@/utils/colortools/setColorsToStore'
import { Routes, router } from '@/router'
import { track_limit } from '../content-width'

export default defineStore('playlist-tracks', {
    state: () => ({
        info: <Playlist>{},
        query: '',
        // the title is a text field (the pencil, or "Rename" of the menu)
        renaming: false,
        allTracks: <Track[]>[],
        colors: {
            bg: '',
            btn: '',
        },
        uploadImgUrl: '',
    }),
    actions: {
        /**
         * Fetches a single playlist information, and its tracks from the server
         * @param id The id of the playlist to fetch
         */
        async fetchAll(id: number, no_tracks = false, fetchAll = false) {
            if (this.allTracks.length === 0) this.renaming = false
            // if fetchAll, use -1 to fetch all tracks
            const playlist = await getPlaylist(id, no_tracks, this.allTracks.length, fetchAll ? -1 : track_limit.value)
            if (this.allTracks.length !== 0) {
                this.allTracks.push(...(playlist?.tracks || []))
                return
            }

            this.info = playlist?.info || ({} as Playlist)
            this.createImageLink()

            this.resetColors()
            this.extractColors()

            if (no_tracks) return

            this.allTracks = playlist?.tracks || []
        },
        createImageLink() {
            this.info.image = paths.images.playlist + this.info.image
        },
        async removeBanner() {
            const { duration } = this.info
            const res = await removeBannerImage(this.info.id)

            if (!res) return

            this.info = { ...res, duration }
            // the colors of the photo are not valid anymore
            this.resetColors()
            this.extractColors()

            this.createImageLink()
        },

        /**
         * Updates the playlist header info. This is used when the playlist is
         * updated.
         * @param info Playlist info
         */
        updatePInfo(info: Playlist) {
            const { duration, count, images } = this.info

            this.info = info
            this.info = { ...this.info, duration, count, images }
            this.createImageLink()
            this.extractColors()
        },

        extractColors(img_url?: string) {
            if (this.info.has_image) {
                const url = img_url || paths.images.playlist + (this.info.thumb as string)

                setColorsToStore(this, url)
                return
            }

            if (!this.info.images.length) return

            const url = paths.images.thumb.small + this.info.images[1].image
            setColorsToStore(this, url)
        },
        resetColors() {
            this.colors = {
                bg: '',
                btn: '',
            }
        },
        setImage(image: string) {
            this.info.image = image

            this.extractColors(this.info.image)
            this.info.has_image = true
        },
        /**
         * Moves a track to another position of the list (the same move the server does).
         */
        moveTrack(from: number, to: number) {
            const [track] = this.allTracks.splice(from, 1)
            this.allTracks.splice(to, 0, track)
        },
        removeTrackByIndex(index: number) {
            this.allTracks.splice(index, 1)
        },
        addTrack(track: Track) {
            this.allTracks.push(track)
        },
        resetAll() {
            setTimeout(() => {
                if (router.currentRoute.value.name == Routes.playlist) return
                this.allTracks = []
            }, 1000)
        },
    },
    getters: {
        filteredTracks(): ComputedRef<FuseResult[]> {
            return useFuse(this.query, this.allTracks, FuseTrackOptions)
        },

        tracks(): Track[] {
            const tracks = this.filteredTracks.value.map((result: FuseResult) => {
                const t = {
                    ...result.item,
                    index: result.refIndex,
                }

                return t
            })

            return tracks
        },
    },
})
