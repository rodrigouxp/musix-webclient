import { defineStore } from 'pinia'

import { favType } from '@/enums'
import updateMediaNotif from '@/helpers/mediaNotification'
import { QueueItem, Track } from '@/interfaces'
import { isFavorite } from '@/requests/favorite'
import useInterface from './interface'

import { audioSource, getUrl, usePlayer } from '@/stores/player'
import useLyrics from './lyrics'
import { NotifType, useToast } from './notification'
import useTracklist from './queue/tracklist'
import useSettings from './settings'
import { useT } from '@/i18n'

const { t } = useT();

export default defineStore('Queue', {
    state: () => ({
        duration: {
            current: 0,
            full: 0,
        },
        currentindex: 0,
        playing: false,
        /** Whether track has been triggered manually */
        manual: true,
        direction: <'up' | 'down'>('up'),
    }),
    actions: {
        setPlaying(val: boolean) {
            this.playing = val
        },
        setDurationFromFile(duration: number) {
            this.duration.full = duration
        },
        setManual(val: boolean) {
            this.manual = val
        },
        setCurrentDuration(duration: number) {
            this.duration.current = duration
        },
        setCurrentIndex(val: number) {
            this.currentindex = val
        },
        play(index: number = 0, manual = true) {
            const { tracklist } = useTracklist()
            if (tracklist.length === 0) return

            this.direction = index > this.currentindex ? 'up' : 'down'

            this.playing = true
            this.currentindex = index
            this.manual = manual

            const { playCurrent } = usePlayer()
            const { focusCurrentInSidebar } = useInterface()

            playCurrent()
            focusCurrentInSidebar()
        },
        playPause() {
            if (audioSource.playingSource.src === '') {
                this.play(this.currentindex)
                return
            }

            if (audioSource.playingSource.paused && !this.playing) {
                audioSource.playingSource.currentTime === 0 ? this.play(this.currentindex) : null
                audioSource.playPlayingSource()
                this.playing = true
                return
            }

            audioSource.pausePlayingSource()
            this.playing = false
        },
        /**
         * The last track ended and nothing repeats: the music stops. The cursor goes back to the first track, loaded and paused,
         * so Play starts the queue again only when the user asks for it.
         */
        stopAtEnd() {
            const settings = useSettings()
            const { focusCurrentInSidebar } = useInterface()

            this.playing = false
            this.currentindex = 0
            this.direction = 'down'
            this.duration.current = 0

            const first = this.currenttrack
            audioSource.playingSource.src = getUrl(first.filepath, first.trackhash, settings.use_legacy_streaming_endpoint)
            audioSource.pausePlayingSource()

            updateMediaNotif()
            focusCurrentInSidebar()
        },
        // the one place of the rule "Next does nothing on the last track when nothing repeats" (`hasNext`): the buttons, the keyboard
        // shortcut, the media keys and the lock screen all end here
        playNext() {
            if (!this.hasNext) return

            this.play(this.nextindex)
        },
        playPrev() {
            const lyrics = useLyrics()

            if (audioSource.playingSource.currentTime > 3) {
                this.seek(0)
                lyrics.setCurrentLine(-1)
                return
            }

            this.play(this.previndex)
            usePlayer().clearNextAudio()
        },
        moveForward() {
            this.currentindex = this.nextindex
        },
        seek(pos: number) {
            const lyrics = useLyrics()

            try {
                audioSource.playingSource.currentTime = pos
                this.duration.current = pos
            } catch (error) {
                if (error instanceof TypeError) {
                    console.error('Seek error: no audio')
                }
            }

            if (lyrics.onLyricsPage) {
                const line = lyrics.calculateCurrentLine()
                lyrics.setCurrentLine(line, true, 0)
            }

            const player = usePlayer()
            player.clearMovingNextTimeout()
        },

        playTrackNext(track: Track) {
            const Toast = useToast()
            const tracklist = useTracklist()

            const nextindex = this.currentindex + 1
            tracklist.insertAt([track], nextindex)

            Toast.showNotification(t("Stores.Queue.AddedTrack"), NotifType.Success)
        },
        clearQueue() {
            const store = useTracklist()
            store.clearList()
            this.currentindex = 0
        },
        /**
         * "Clear queue" of the menu: everything goes but the song that is playing, which stays as the
         * only one of the queue (the music goes on, and the queue and the player keep showing it).
         * Without a current song it is the same as `clearQueue`.
         */
        clearQueueKeepingCurrent() {
            const store = useTracklist()
            const current = store.tracklist[this.currentindex]

            if (!current) {
                this.clearQueue()
                return
            }

            store.tracklist = [current]
            this.currentindex = 0
            // the song that was loaded to play next is not in the queue anymore
            usePlayer().clearNextAudio()
        },
        shuffleQueue() {
            const { shuffleList } = useTracklist()
            const { focusCurrentInSidebar } = useInterface()

            shuffleList()
            this.currentindex = 0
            this.play(this.currentindex)
            focusCurrentInSidebar()
        },
    },
    getters: {
        /**
         * Where the queue goes when the song that is playing ends, if the track or its group repeats (priority: the
         * repeat of the track, then of the group, then the general one of the PlayerBar), `null` if neither does.
         */
        localRepeatTarget(): number | null {
            const tracklist = useTracklist()

            if (tracklist.tracklist[this.currentindex]?.repeat) return this.currentindex

            return tracklist.groupRepeatTarget(this.currentindex)
        },
        /**
         * Whether Next has somewhere to go. It does not on the last track when nothing repeats (the repeat of the PlayerBar is
         * off and the track and its group do not repeat): the queue ends there, it does not jump to the first track.
         */
        hasNext(): boolean {
            const { tracklist } = useTracklist()
            const { repeat } = useSettings()

            if (tracklist.length === 0) return false
            if (repeat !== 'none' || this.localRepeatTarget !== null) return true

            return this.currentindex < tracklist.length - 1
        },
        next(): Track {
            const { tracklist } = useTracklist()
            return tracklist[this.nextindex]
        },
        prev(): Track {
            const { tracklist } = useTracklist()
            return tracklist[this.previndex]
        },
        currenttrack(): QueueItem {
            const { tracklist } = useTracklist()
            const current = tracklist[this.currentindex]
            if (!current) {
                return {} as Track
            }

            isFavorite(current?.trackhash || 'mehmehmeh', favType.track).then(is_fav => {
                if (current) {
                    current.is_favorite = is_fav
                }
            })

            return current
        },
        currenttrackhash(): string {
            return this.currenttrack?.trackhash || ''
        },
        previndex(): number {
            const { tracklist } = useTracklist()
            const { repeat } = useSettings()

            if (repeat == 'one') {
                return this.currentindex
            }

            return this.currentindex === 0 ? tracklist.length - 1 : this.currentindex - 1
        },
        nextindex(): number {
            const { tracklist } = useTracklist()
            const { repeat } = useSettings()

            if (this.localRepeatTarget !== null) {
                return this.localRepeatTarget
            }

            if (repeat == 'one') {
                return this.currentindex
            }

            return this.currentindex === tracklist.length - 1 ? 0 : this.currentindex + 1
        },
    },
    persist: {
        afterRestore: context => {
            let store = context.store
            store.duration.current = 0
            store.playing = false
        },
    },
})
