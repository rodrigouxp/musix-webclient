import useSettings from '@/stores/settings'
import { loggedInUserIsAdmin } from '../utils'

import { SettingCategory } from '@/interfaces/settings'
import * as strings from '../strings'
import albums from './albums'
import restore from './backup'
import circularArtistImg from './circular-artist-img'
import contextChildrenShowMode from './context-children-show-mode'
import extendWidth from './extend-width'
import folderlistmode from './folderlistmode'
import layout from './layout'
import nowPlaying from './now-playing-group'
import { SettingType } from '../enums'
import rootDirSettings from './root-dirs'
import artistSettings from './artists'
import sidebarSettings from './sidebar'
import tracks from './tracks'
// icons
import AlbumSvg from '@/assets/icons/figma/disc.svg?raw'
import AvatarSvg from '@/assets/icons/figma/user.svg?raw'
import FolderRawSvg from '@/assets/icons/folder.svg?raw'
import TrackSvg from '@/assets/icons/figma/mic.svg?raw'
import AppearanceRawSvg from '@/assets/icons/paintbrush.svg?raw'
import CloudUploadRawSvg from '@/assets/icons/cloud-upload.svg?raw'
import { fitIcon } from '../utils'
import { useT } from '@/i18n'

const { t } = useT()

// the old icons (not in the Figma) with the viewBox that gives them the proportion of the Figma ones
const FolderSvg = fitIcon(FolderRawSvg, '1.9 1.47 24.18 24.18')
const AppearanceSvg = fitIcon(AppearanceRawSvg, '-3.3 -2.71 33.91 33.91')
const CloudUploadSvg = fitIcon(CloudUploadRawSvg, '-2.99 -3.24 35.89 35.89')

const npStrings = strings.nowPlayingStrings
const rootRootStrings = strings.manageRootDirsStrings

export const general = {
    // title: 'General',
    groups: [
        {
            id: 'appearance',
            title: t("Common.Appearance"),
            desc: t("Settings.General.MainSettingsDescription"),
            icon: AppearanceSvg,
            settings: [
                ...layout,
                ...extendWidth,
                ...sidebarSettings,
                circularArtistImg,
                ...contextChildrenShowMode,
                ...folderlistmode,
                ...nowPlaying,
            ],
        },
        
    ],
} as SettingCategory

export const library = {
    title: t('Common.Library'),
    show_if: loggedInUserIsAdmin,
    groups: [
        {
            title: t("Common.Folders"),
            icon: FolderSvg,
            desc: rootRootStrings.desc,
            settings: [...rootDirSettings],
        },
        {
            // null means settings table is not created yet
            show_if: () => useSettings().feat !== null,
            title: t("Common.Track", 2),
            icon: TrackSvg,
            desc: t("Settings.General.TrackInfoSettingsDesc"),
            settings: [...tracks],
        },
        {
            // null means settings table is not created yet
            show_if: () => useSettings().feat !== null,
            title: t("Common.Album", 2),
            icon: AlbumSvg,
            desc: t("Settings.General.AlbumInfoSettingsDesc"),
            settings: [...albums],
        },
        {
            // null means settings table is not created yet
            show_if: () => useSettings().feat !== null,
            title: t("Common.Artist", 2),
            icon: AvatarSvg,
            desc: t("Settings.General.ArtistsDesc"),
            settings: [...artistSettings],
        },
        {
            title: t("Common.Backup"),
            icon: CloudUploadSvg,
            desc: t("Settings.General.BackupMainDesc"),
            settings: [...restore],
        },
    ],
} as SettingCategory

// ENHANCEMENT: Decouple components from Group.vue and pass them as part of the Setting interface (maybe?)
