import { defineStore } from 'pinia'

import useInterface from '@/stores/interface'
import { NotifType, useToast } from '@/stores/notification'
import { usePlayer } from '@/stores/player'
import useQueue from '@/stores/queue'
import useSettings from '@/stores/settings'

import { FromOptions } from '@/enums'
import {
    fromAlbum,
    fromArtist,
    fromFav,
    fromFolder,
    fromPlaylist,
    fromSearch,
    QueueGroup,
    QueueItem,
    Track,
} from '@/interfaces'
import track from '@/context_menus/track'
import { useT } from '@/i18n'

const { t } = useT();

export type From = fromFolder | fromAlbum | fromPlaylist | fromSearch | fromArtist | fromFav

// A group is one entry of a whole album or playlist: the tracks get a copy with the group (the album page keeps its own).
export function newGroup(type: QueueGroup['type'], name: string, key: { albumhash?: string; pid?: number }): QueueGroup {
    return { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, type, name, ...key }
}

function withGroup(tracks: Track[], group?: QueueGroup): QueueItem[] {
    return group ? tracks.map(t => ({ ...t, group })) : tracks
}

function shuffle(tracks: QueueItem[]) {
    const shuffled = tracks.slice()
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
}

export default defineStore('tracklist', {
    state: () => ({
        from: {} as From,
        tracklist: <QueueItem[]>[],
        // ids of the groups that repeat (when the last track of the group ends, it goes back to the first)
        repeatGroups: <string[]>[],
    }),
    actions: {
        loadFromLocalStorage() {
            const queue = localStorage.getItem('queue')

            if (queue) {
                const parsed = JSON.parse(queue)
                this.from = parsed.from
                this.tracklist = parsed.tracks
            }
        },
        setNewList(tracklist: Track[], group?: QueueGroup) {
            this.repeatGroups = []

            if (this.tracklist !== tracklist) {
                this.tracklist = []
                this.tracklist.push(...withGroup(tracklist, group))
            }

            const { focusCurrentInSidebar } = useInterface()
            focusCurrentInSidebar(1000)
            usePlayer().clearNextAudio()
        },
        setFromFolder(path: string, tracks: Track[]) {
            // remove trailing slash
            path = path.replace(/\/$/, '')
            const name = path.split('/').pop()
            this.from = <fromFolder>{
                type: FromOptions.folder,
                path: tracks[0].folder,
                name: name?.trim() === '' ? path : name,
            }
            this.setNewList(tracks)
        },
        setFromAlbum(name: string, albumhash: string, tracks: Track[]) {
            this.from = <fromAlbum>{
                type: FromOptions.album,
                name: name,
                albumhash: albumhash,
            }

            this.setNewList(tracks, newGroup('album', name, { albumhash }))
        },
        setFromPlaylist(name: string, pid: number, tracks: Track[]) {
            this.from = <fromPlaylist>{
                type: FromOptions.playlist,
                name: name,
                id: pid,
            }

            this.setNewList(tracks, newGroup('playlist', name, { pid }))
        },
        setFromSearch(query: string, tracks: Track[]) {
            this.from = <fromSearch>{
                type: FromOptions.search,
                query: query,
            }

            this.setNewList(tracks)
        },
        setFromArtist(artisthash: string, name: string, tracks: Track[]) {
            this.from = <fromArtist>{
                type: FromOptions.artist,
                artisthash: artisthash,
                artistname: name,
            }

            this.setNewList(tracks)
        },
        setFromFav(tracks: Track[]) {
            this.from = <fromFav>{
                type: FromOptions.favorite,
            }

            this.setNewList(tracks)
        },
        addTrack(track: Track) {
            return this.addTracks([track])
        },
        addTracks(tracks: Track[], group?: QueueGroup) {
            this.insertAt(withGroup(tracks, group), this.tracklist.length)

            const Toast = useToast()
            Toast.showNotification(t("Stores.Tracklist.AddTrackToQueue", {n: tracks.length}, tracks.length), NotifType.Success)
        },
        insertAt(tracks: Track[], index: number) {
            this.tracklist.splice(index, 0, ...tracks)

            const player = usePlayer()
            const queue = useQueue()

            if (index == queue.nextindex) {
                player.clearNextAudio()
            }
        },
        clearList() {
            this.repeatGroups = []
            this.tracklist = []
            this.from = {} as From
        },
        shuffleList() {
            this.tracklist = shuffle(this.tracklist)
        },
        removeByIndex(index: number) {
            const { currentindex, nextindex, playing, playNext, moveForward, setCurrentIndex } = useQueue()
            const player = usePlayer()

            if (this.tracklist.length == 1) {
                return this.clearList()
            }

            if (index == currentindex) {
                if (playing) {
                    playNext()
                } else {
                    moveForward()
                }

                setCurrentIndex(index)
            }

            if (index < currentindex) {
                setCurrentIndex(currentindex - 1)
            }

            this.tracklist.splice(index, 1)

            if (index == nextindex) {
                player.clearNextAudio()
            }
        },
        toggleFav(index: number) {
            const track = this.tracklist[index]

            if (track) {
                track.is_favorite = !track.is_favorite
            }
        },
        /**
         * Moves a track of the queue to another position without stopping the music: the marker
         * of the track that is playing follows its track, and the next audio is loaded again.
         */
        moveTrack(from: number, to: number) {
            const queue = useQueue()

            const [item] = this.tracklist.splice(from, 1)
            this.tracklist.splice(to, 0, item)

            // inside a group the track belongs to it; dropped between two tracks of a group it joins it; anywhere
            // else it is a loose track
            const before = this.tracklist[to - 1]?.group
            const after = this.tracklist[to + 1]?.group

            if (before && after && before.id === after.id) {
                item.group = before
            } else if (item.group && item.group.id !== before?.id && item.group.id !== after?.id) {
                delete item.group
            }

            let current = queue.currentindex

            if (current === from) {
                current = to
            } else if (from < current && to >= current) {
                current--
            } else if (from > current && to <= current) {
                current++
            }

            queue.setCurrentIndex(current)
            usePlayer().clearNextAudio()
        },
        // ---- groups (the buttons of the header in the QueuePanel) ----
        /** The positions of the tracks of a group. */
        groupIndexes(id: string): number[] {
            return this.tracklist.reduce<number[]>((all, t, i) => (t.group?.id === id ? [...all, i] : all), [])
        },
        /** The last track of the group is the one that is playing: where it goes back to, if the group repeats. */
        groupRepeatTarget(index: number): number | null {
            const group = this.tracklist[index]?.group

            if (!group || !this.repeatGroups.includes(group.id) || this.tracklist[index + 1]?.group?.id === group.id) {
                return null
            }

            let start = index

            while (this.tracklist[start - 1]?.group?.id === group.id) start--

            return start
        },
        toggleGroupRepeat(id: string) {
            this.repeatGroups = this.repeatGroups.includes(id)
                ? this.repeatGroups.filter(g => g !== id)
                : [...this.repeatGroups, id]
            usePlayer().clearNextAudio()
        },
        toggleTrackRepeat(index: number) {
            const track = this.tracklist[index]

            if (track) track.repeat = !track.repeat
            usePlayer().clearNextAudio()
        },
        /** Shuffles the tracks of the group among their own places; the song that is playing goes on. */
        shuffleGroup(id: string) {
            const queue = useQueue()
            const places = this.groupIndexes(id)

            if (places.length < 2) return

            const current = this.tracklist[queue.currentindex]
            const shuffled = shuffle(places.map(i => this.tracklist[i]))

            places.forEach((place, k) => (this.tracklist[place] = shuffled[k]))

            queue.setCurrentIndex(this.tracklist.indexOf(current))
            usePlayer().clearNextAudio()
        },
        /** Takes every track of the group out; if the song that is playing is one of them, the next one plays. */
        removeGroup(id: string) {
            // from the last to the first, so the positions that are left do not move
            this.groupIndexes(id)
                .reverse()
                .forEach(i => this.removeByIndex(i))

            this.repeatGroups = this.repeatGroups.filter(g => g !== id)
        },
        /** The whole group goes to the slot `slot` (before the track that is there, 0 to the length of the queue). */
        moveGroup(id: string, slot: number) {
            const queue = useQueue()
            const places = this.groupIndexes(id)

            if (!places.length) return

            const from = places[0]
            const count = places.length

            // dropped on itself
            if (slot >= from && slot <= from + count) return

            const current = this.tracklist[queue.currentindex]
            const moved = this.tracklist.splice(from, count)

            this.tracklist.splice(slot > from ? slot - count : slot, 0, ...moved)

            queue.setCurrentIndex(this.tracklist.indexOf(current))
            usePlayer().clearNextAudio()
        },
        insertAfterCurrent(tracks: Track[], group?: QueueGroup) {
            const { currentindex } = useQueue()

            this.tracklist.splice(currentindex + 1, 0, ...withGroup(tracks, group))

            const Toast = useToast()
            Toast.showNotification(t("Stores.Tracklist.AddTrackToQueue", {n: tracks.length}, tracks.length), NotifType.Success)
        },
    },
    getters: {
        length(): number {
            return this.tracklist.length
        },
    },
    persist: true,
})
