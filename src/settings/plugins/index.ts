import lyrics from './lyrics'
import { loggedInUserIsAdmin } from '../utils'
import { SettingCategory } from '@/interfaces/settings'

import LyricsSvg from '@/assets/icons/lyrics.svg?raw'
import { useT } from '@/i18n'

const { t } = useT()

export default <SettingCategory>{
    title: t("Common.Plugins"),
    show_if: loggedInUserIsAdmin,
    groups: [
        {
            title: t("Common.Lyrics"),
            icon: LyricsSvg,
            desc: t("Settings.Plugins.LyricsDescription"),
            settings: lyrics,
            experimental: true,
        },
    ],
}
