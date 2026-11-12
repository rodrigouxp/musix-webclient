import { ref } from 'vue'
import { defineStore } from 'pinia'

import { getBaseUrl, paths } from '@/config'
import { FromOptions } from '@/enums'
import useTracklist, { From } from '@/stores/queue/tracklist'
import { audioSource } from './player'
import useQueue from './queue'

// Logs what is played (the "most played" lists and the stats come from it).
//
// A track counts as played when it was listened for 30 seconds or for half of its length, whichever is shorter (the
// server has the same rule: musix.lib.playcount). The play is sent as soon as it counts, while the track is still
// playing, and the rest of the time listened is sent when the track ends, as an extension of that play. Before, the
// play was only sent when the NEXT track started (the last track of a queue was not logged until then) and any
// listen of 5 seconds counted.
//
// The time listened is the progress of the audio itself (the difference between two positions), not the clock: a
// seek, a pause or a slow tab does not add or lose time.

const PLAY_SECONDS = 30
// the biggest step between two `timeupdate` events that is still normal playback (they come about 4 times a second,
// less often in a tab in the background); a bigger one is a seek
const MAX_STEP = 2

function playThreshold(trackDuration: number) {
    return trackDuration > 0 ? Math.min(PLAY_SECONDS, trackDuration / 2) : PLAY_SECONDS
}

function getSource(source: From) {
    switch (source?.type) {
        case FromOptions.album:
            return `al:${source.albumhash}`
        case FromOptions.artist:
            return `ar:${source.artisthash}`
        case FromOptions.folder:
            return `fo:${source.path}`
        case FromOptions.playlist:
            return `pl:${source.id}`
        case FromOptions.search:
            return `q:${source.query}`
        case FromOptions.favorite:
            return `favorite`
        default:
            return ''
    }
}

interface LogBody {
    trackhash: string
    duration: number
    source: string
    timestamp: number
    extend?: boolean
}

interface LogAnswer {
    counted?: boolean
    playcount?: number
    help_text?: string
}

// `keepalive`: the request still goes out when the page is being closed
function postLog(body: LogBody): Promise<LogAnswer | null> {
    return fetch(getBaseUrl() + paths.api.logger.logTrack, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
        keepalive: true,
    })
        .then(res => (res.ok ? res.json() : null))
        .catch(() => null)
}

export default defineStore(
    'playTracker',
    () => {
        const queue = useQueue()

        // SECTION: the play going on (kept across a reload of the page, so the rest of the track still counts)
        const trackhash = ref('')
        const trackDuration = ref(0)
        // seconds listened of this play, and how many of them the server already has
        const listened = ref(0)
        const sent = ref(0)
        const counted = ref(false)
        const timestamp = ref(0)
        // @ts-ignore
        const from = ref({ type: null, path: '', name: '' } as From)

        // the last play the server counted: the lists on screen update their numbers with it (not kept)
        const lastLogged = ref<{ trackhash: string; playcount: number; help_text: string } | null>(null)

        let lastPosition: number | null = null
        const listening = new WeakSet<HTMLAudioElement>()

        function startPlay() {
            const track = queue.currenttrack

            trackhash.value = track?.trackhash ?? ''
            trackDuration.value = track?.duration ?? 0
            from.value = useTracklist().from
            listened.value = 0
            sent.value = 0
            counted.value = false
            timestamp.value = Math.floor(Date.now() / 1000)
            lastPosition = null
        }

        // the seconds listened after the play was sent
        function flush() {
            if (!counted.value || !trackhash.value) return

            const extra = Math.floor(listened.value) - sent.value
            if (extra < 1) return

            sent.value += extra
            postLog({
                trackhash: trackhash.value,
                duration: extra,
                source: getSource(from.value),
                timestamp: timestamp.value,
                extend: true,
            })
        }

        function countPlay() {
            const hash = trackhash.value
            const seconds = Math.max(Math.ceil(listened.value), 1)

            counted.value = true
            sent.value = seconds

            postLog({
                trackhash: hash,
                duration: seconds,
                source: getSource(from.value),
                timestamp: timestamp.value,
            }).then(answer => {
                if (!answer?.counted || answer.playcount === undefined) return

                lastLogged.value = { trackhash: hash, playcount: answer.playcount, help_text: answer.help_text ?? '' }
            })
        }

        function onTimeUpdate(e: Event) {
            const audio = e.target as HTMLAudioElement

            // the other audio element is the track that is fading out or the next one being prepared
            if (audio !== audioSource.playingSource || !trackhash.value) return

            const position = audio.currentTime

            if (lastPosition !== null && !audio.paused) {
                const step = position - lastPosition
                if (step > 0 && step <= MAX_STEP) listened.value += step
            }

            lastPosition = position
            timestamp.value = Math.floor(Date.now() / 1000)

            if (!counted.value && listened.value >= playThreshold(trackDuration.value)) countPlay()
        }

        // SECTION: called by the player
        // another play starts (a new track, or the same one again): the one before is closed
        function changeKey() {
            flush()
            startPlay()
        }

        // the audio element that plays changed (there are two, they take turns)
        function reassignEventListener() {
            const audio = audioSource.playingSource

            if (!listening.has(audio)) {
                audio.addEventListener('timeupdate', onTimeUpdate)
                listening.add(audio)
            }

            lastPosition = null

            // after a reload the same track goes on with what it had; any other track starts from zero
            if (trackhash.value !== queue.currenttrackhash) startPlay()
        }

        window.addEventListener('pagehide', flush)

        return {
            trackhash,
            trackDuration,
            listened,
            sent,
            counted,
            timestamp,
            from,
            lastLogged,
            changeKey,
            reassignEventListener,
        }
    },
    {
        persist: {
            paths: ['trackhash', 'trackDuration', 'listened', 'sent', 'counted', 'timestamp', 'from'],
        },
    }
)
