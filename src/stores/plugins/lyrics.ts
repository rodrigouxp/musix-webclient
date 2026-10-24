import { defineStore } from 'pinia'
import { nextTick } from 'vue'

import { useT } from '@/i18n'
import useLyrics from '@/stores/lyrics'
import useQueue from '@/stores/queue'
import useSettings from '@/stores/settings'

import { findLyrics, LyricsSearchReason } from '@/requests/plugins/lyrics'

const { t } = useT()

const REASON_MESSAGES: Record<LyricsSearchReason, string> = {
    not_found: 'Views.LyricView.Reason.NotFound',
    instrumental: 'Views.LyricView.Reason.Instrumental',
    network: 'Views.LyricView.Reason.Network',
    plugin_off: 'Views.LyricView.Reason.PluginOff',
    write_failed: 'Views.LyricView.Reason.WriteFailed',
}

export default defineStore('lyricsplugin', {
    state: () => ({
        loading: false,
        error: '',
    }),
    actions: {
        /**
         * Looks the lyrics of the current song up online. The server saves them as the .lrc of the song
         * (synced or plain), and they are loaded again like any .lrc that was already there.
         *
         * `auto` is the search the app starts by itself: it is quiet when it fails (only the console).
         * Gives why there was nothing, or null when the lyrics were found.
         */
        async searchLyrics(auto = false): Promise<LyricsSearchReason | null> {
            if (this.loading) return null
            this.loading = true

            const queue = useQueue()
            const lyrics = useLyrics()
            const track = queue.currenttrack
            let reason: LyricsSearchReason | null = null

            try {
                const data = await findLyrics(track, {
                    auto,
                    replaceUnsynced: !!useSettings().lyrics_plugin_settings?.overide_unsynced,
                })

                // the song changed while the server was looking: nothing to show for this one
                if (track.trackhash !== queue.currenttrackhash) return null

                reason = data ? data.reason : 'network'
                if (reason) return reason

                await lyrics.getLyrics(true, false)
                await nextTick()
                lyrics.scrollToContainerTop()
                lyrics.scrollToCurrentLine()
                return null
            } finally {
                this.loading = false

                if (reason) {
                    if (auto) {
                        console.debug('Lyrics search found nothing:', reason)
                    } else {
                        this.error = t(REASON_MESSAGES[reason])
                        setTimeout(() => {
                            this.error = ''
                        }, 5000)
                    }
                }
            }
        },
    },
})
