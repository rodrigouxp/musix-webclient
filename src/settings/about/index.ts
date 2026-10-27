import { SettingType } from '../enums'
import { SettingCategory } from '@/interfaces/settings'
import { useT } from '@/i18n'

import InfoRawSvg from '@/assets/icons/info.svg?raw'
import { fitIcon } from '../utils'

const { t } = useT()

const InfoSvg = fitIcon(InfoRawSvg, '-0.75 -0.75 31.5 31.5')

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
