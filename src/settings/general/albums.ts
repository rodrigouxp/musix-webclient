import { Setting } from '@/interfaces/settings'
import { SettingType } from '../enums'

import useSettingsStore from '@/stores/settings'
import { refreshAllCovers } from '@/requests/settings/covers'
import { useT } from '@/i18n'

const { t } = useT()

const settings = useSettingsStore

const clean_album_titles: Setting = {
    title: t("Settings.General.Albums.CleanTitles.Title"),
    desc: t("Settings.General.Albums.CleanTitles.Description"),
    type: SettingType.binary,
    state: () => settings().clean_titles,
    action: () => settings().toggleCleanAlbumTitle(),
}

const merge_album_versions: Setting = {
    title: t("Settings.General.Albums.MergeAlbum.Title"),
    desc: t("Settings.General.Albums.MergeAlbum.Description"),
    type: SettingType.binary,
    state: () => {
        const settings = useSettingsStore()
        return settings.clean_titles && settings.merge_albums
    },
    action: () => settings().toggleMergeAlbums(),
    inactive: () => !settings().clean_titles,
}

const update_all_covers: Setting = {
    title: t('Settings.General.Albums.UpdateAllCovers.Title'),
    desc: t('Settings.General.Albums.UpdateAllCovers.Description'),
    type: SettingType.button,
    state: null,
    button_text: () => t('Settings.General.Albums.UpdateAllCovers.Button'),
    action: () => refreshAllCovers(),
}

export default [clean_album_titles, merge_album_versions, update_all_covers]
