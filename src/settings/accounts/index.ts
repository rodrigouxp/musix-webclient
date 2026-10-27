import { fitIcon, loggedInUserIsAdmin } from '../utils'

import { SettingCategory } from '@/interfaces/settings'
import AvatarRawSvg from '@/assets/icons/avatar.svg?raw'
import { SettingType } from '../enums'

import { useT } from '@/i18n'

const { t } = useT()

const AvatarSvg = fitIcon(AvatarRawSvg, '1.19 1.27 25.42 25.42')

export default <SettingCategory>{
    show_if: loggedInUserIsAdmin,
    groups: [
        {
            title: t("Settings.Accounts.Title"),
            icon: AvatarSvg,
            settings: [
                {
                    type: SettingType.accounts,
                },
            ],
        },
    ],
}
