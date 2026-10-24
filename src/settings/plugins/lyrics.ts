import { Setting } from '@/interfaces/settings'
import { SettingType } from '../enums'

import useSettings from '@/stores/settings'
import useMissingLyrics from '@/stores/plugins/missingLyrics'
import { useT } from '@/i18n'

const { t } = useT()

const toggle_lyrics_plugin = <Setting>{
    title: t("Settings.Plugins.Lyrics.ToggleLyrics.Title"),
    type: SettingType.binary,
    state: () => useSettings().use_lyrics_plugin,
    action: () => useSettings().toggleLyricsPlugin(),
}

const auto_download_lyrics = <Setting>{
    title: t("Settings.Plugins.Lyrics.AutoDownload.Title"),
    desc:  t("Settings.Plugins.Lyrics.AutoDownload.Description"),
    type: SettingType.binary,
    state: () => useSettings().lyrics_plugin_settings.auto_download,
    action: () => useSettings().toggleLyricsAutoDownload(),
    show_if: () => useSettings().use_lyrics_plugin,
}

const auto_download_on_unsynced = <Setting>{
    title: t("Settings.Plugins.Lyrics.OverrideLocal.Title"),
    desc: t("Settings.Plugins.Lyrics.OverrideLocal.Description"),
    type: SettingType.binary,
    state: () => useSettings().lyrics_plugin_settings.overide_unsynced,
    action: () => useSettings().toggleLyricsOverideUnsynced(),
    show_if: () => {
        const settings = useSettings()
        return settings.use_lyrics_plugin && settings.lyrics_plugin_settings.auto_download
    },
}

// "Find missing lyrics": looks the lyrics of the songs that have none up online, in the server. The
// row is the title, the description (with the count), and the button; the progress is under it
// (components/SettingsView/Components/MissingLyrics.vue)
const find_missing_lyrics = <Setting>{
    get title() {
        return t('Settings.Plugins.Lyrics.FindMissing.Title')
    },
    get desc() {
        const { count, running } = useMissingLyrics()

        if (running || !count) return t('Settings.Plugins.Lyrics.FindMissing.DescriptionShort')
        if (!count.missing) return t('Settings.Plugins.Lyrics.FindMissing.AllDone')

        return t('Settings.Plugins.Lyrics.FindMissing.Description', { missing: count.missing, total: count.total })
    },
    type: SettingType.lyrics_missing,
    state: null,
    button_text: () => {
        const store = useMissingLyrics()

        if (store.running) {
            return t(store.busy ? 'Settings.Plugins.Lyrics.FindMissing.Cancelling' : 'Settings.Plugins.Lyrics.FindMissing.Cancel')
        }

        // nothing to look up (or the count did not come yet): no button
        return store.count?.missing ? t('Settings.Plugins.Lyrics.FindMissing.Start') : ''
    },
    action: () => {
        const store = useMissingLyrics()
        return store.running ? store.cancel() : store.start()
    },
    // the click on the text is not the button (a job that takes minutes starts by the button only)
    defaultAction: () => {},
    show_if: () => !!useSettings().use_lyrics_plugin,
}

export default [toggle_lyrics_plugin, auto_download_lyrics, auto_download_on_unsynced, find_missing_lyrics]
