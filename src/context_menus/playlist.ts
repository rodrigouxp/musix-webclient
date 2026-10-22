import { getAllPlaylistTracks, togglePlaylistPin } from '@/helpers/playlistActions'
import { useT } from '@/i18n'
import { DeleteIcon, EditIcon, MenuAddToQueueIcon, MenuPlayNextIcon, PinIcon } from '@/icons'
import { Option, Playlist } from '@/interfaces'
import useModal from '@/stores/modal'
import usePlaylistPage from '@/stores/pages/playlist'
import useTracklist from '@/stores/queue/tracklist'

import { insetSeparator } from './utils'

const { t } = useT()

function getAddToQueue(pid: number): Option {
    return {
        label: t('Menus.Common.AddToQueue'),
        action: async () => {
            useTracklist().addTracks(await getAllPlaylistTracks(pid))
        },
        icon: MenuAddToQueueIcon,
        menuIcon: true,
    }
}

function getPin(playlist: Pick<Playlist, 'id' | 'pinned'>): Option {
    return {
        label: playlist.pinned ? t('Menus.PlayList.Unpin') : t('Menus.PlayList.Pin'),
        action: () => togglePlaylistPin(playlist.id),
        icon: PinIcon,
        menuIcon: true,
    }
}

// "Delete" (red): it asks to confirm, and then goes back to the list of playlists
function getDelete(pid: number): Option {
    return {
        label: t('Menus.PlayList.Delete'),
        action: () => useModal().showDeletePlaylistModal(pid),
        icon: DeleteIcon,
        menuIcon: true,
        critical: true,
    }
}

/**
 * The menu of the three dots of the page of a playlist.
 */
export default async (): Promise<Option[]> => {
    const page = usePlaylistPage()
    const playlist = page.info
    const pid = playlist.id

    const play_next: Option = {
        label: t('Menus.Common.PlayNext'),
        action: async () => {
            useTracklist().insertAfterCurrent(await getAllPlaylistTracks(pid))
        },
        icon: MenuPlayNextIcon,
        menuIcon: true,
    }

    // the title of the page becomes a text field
    const rename: Option = {
        label: t('Menus.PlayList.Rename'),
        action: () => {
            page.renaming = true
        },
        icon: EditIcon,
        menuIcon: true,
    }

    return [play_next, getAddToQueue(pid), insetSeparator, getPin(playlist), rename, insetSeparator, getDelete(pid)]
}

/**
 * The menu of the card of a playlist (right click): pin, rename and add to queue, and, after a
 * divider, delete. ``rename`` puts the name of the card in a text field.
 */
export async function playlistCardItems(playlist: Playlist, rename: () => void): Promise<Option[]> {
    return [
        getPin(playlist),
        {
            label: t('Menus.PlayList.Rename'),
            action: rename,
            icon: EditIcon,
            menuIcon: true,
        },
        getAddToQueue(playlist.id),
        insetSeparator,
        getDelete(playlist.id),
    ]
}
