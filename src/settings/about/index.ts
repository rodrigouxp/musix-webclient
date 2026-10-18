import { SettingType } from '../enums'
import { SettingCategory } from '@/interfaces/settings'
import { useT } from '@/i18n'

import InfoSvg from '@/assets/icons/info.svg?raw'

const { t } = useT()

export default <SettingCategory>{
    groups: [
        {
            id: 'about',
            title: t("Settings.About.Title"),
            icon: InfoSvg,
            settings: [
                {
                    type: SettingType.about,
                },
            ],
        },
    ],
}
