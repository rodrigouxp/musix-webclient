import { defineStore } from 'pinia'

import { useT } from '@/i18n'
import { askConfirm } from '@/stores/confirm'
import { NotifType, useToast } from '@/stores/notification'

import {
    cancelMissingLyrics,
    getMissingLyricsCount,
    getMissingLyricsStatus,
    MissingLyricsCount,
    MissingLyricsStatus,
    startMissingLyrics,
} from '@/requests/plugins/lyrics'

const { t } = useT()

// the job asks the providers twice a second at most (see the server): the estimate of the question
const SECONDS_PER_SONG = 0.5
const POLL_MS = 1000

let timer: number | undefined

/**
 * "Find missing lyrics" (Settings > Plugins > Lyrics): the count of the songs without lyrics and the
 * job that looks them up in the server. The page asks for the status every second while it is open
 * and the job is running; closing the page does not stop the job.
 */
export default defineStore('missinglyrics', {
    state: () => ({
        count: <MissingLyricsCount | null>null,
        status: <MissingLyricsStatus | null>null,
        // this page saw the job (started it, or found it running): its result is worth showing
        watched: false,
        busy: false,
    }),
    getters: {
        running: state => !!state.status?.running,
        percent: state => {
            const s = state.status
            return s && s.total ? Math.round((s.done / s.total) * 100) : 0
        },
        showResult(): boolean {
            return this.watched && !!this.status?.finished && !this.running
        },
        allDone: state => !!state.count && state.count.missing === 0,
    },
    actions: {
        /** The count of songs without lyrics and, if the job is running (started before), its progress. */
        async refresh() {
            const [count, status] = await Promise.all([getMissingLyricsCount(), getMissingLyricsStatus()])

            if (count) this.count = count

            if (status) {
                this.status = status

                if (status.running) {
                    this.watched = true
                    this.startPolling()
                }
            }
        },
        async start() {
            if (this.busy || this.running || !this.count?.missing) return

            const missing = this.count.missing
            const minutes = Math.max(1, Math.ceil((missing * SECONDS_PER_SONG) / 60))
            const yes = await askConfirm(
                t('Settings.Plugins.Lyrics.FindMissing.Confirm', { count: missing, minutes }),
                t('Settings.Plugins.Lyrics.FindMissing.Start')
            )

            if (!yes) return

            this.busy = true
            const { status, data } = await startMissingLyrics()
            this.busy = false

            if (status === 200 && data) {
                this.status = data
                this.watched = true
                this.startPolling()
                return
            }

            if (status === 409) {
                // it was running already (another window): follow it
                await this.refresh()
                return
            }

            const key = data?.reason === 'plugin_off' ? 'PluginOff' : 'StartError'
            useToast().showNotification(t(`Settings.Plugins.Lyrics.FindMissing.${key}`), NotifType.Error)
        },
        async cancel() {
            if (!this.running || this.busy) return

            this.busy = true
            const status = await cancelMissingLyrics()
            this.busy = false

            if (status) this.status = status
        },
        startPolling() {
            if (timer !== undefined) return

            timer = window.setInterval(() => this.poll(), POLL_MS)
        },
        stopPolling() {
            window.clearInterval(timer)
            timer = undefined
        },
        async poll() {
            const status = await getMissingLyricsStatus()

            if (!status) return

            this.status = status

            if (status.running) return

            this.stopPolling()
            this.count = (await getMissingLyricsCount()) ?? this.count

            if (status.aborted_reason) {
                useToast().showNotification(
                    t(
                        status.aborted_reason === 'network'
                            ? 'Settings.Plugins.Lyrics.FindMissing.AbortedNetwork'
                            : 'Settings.Plugins.Lyrics.FindMissing.StartError'
                    ),
                    NotifType.Error
                )
            }
        },
    },
})
