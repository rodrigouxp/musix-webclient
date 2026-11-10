import { Routes, router } from '@/router'

import useArtistEdit from '@/stores/artistedit'
import useAuth from '@/stores/auth'
import { NotifType, useToast } from '@/stores/notification'
import useCollection from '@/stores/pages/collections'
import useTracklist from '@/stores/queue/tracklist'
import useSettings from '@/stores/settings'

import { getArtistTracks } from '@/requests/artists'
import { addOrRemoveItemFromCollection } from '@/requests/collections'
import { openInFiles } from '@/requests/folders'
import { addArtistToPlaylist } from '@/requests/playlists'
import { commonFolder } from '@/utils/commonFolder'

import {
    DeleteIcon,
    EditIcon,
    MenuAddToCollectionIcon,
    MenuAddToPlaylistIcon,
    MenuAddToQueueIcon,
    MenuOpenInFilesIcon,
    MenuPlayNextIcon,
    MenuUpdateCoverIcon,
    SearchIcon,
} from '@/icons'
import { Artist, Collection, Option, Playlist, Track } from '@/interfaces'
import { getAddToCollectionOptions, getAddToPlaylistOptions, get_find_on_social, insetSeparator } from './utils'
import { useT } from '@/i18n'

const { t } = useT()

// opens the window of the files of this computer and gives the chosen image (JPEG, PNG or WEBP); it is called in the
// click of the menu, so the browser lets it open. The input is kept until it answers.
let picker: HTMLInputElement | null = null

function pickImage(done: (file: File) => void) {
    picker = document.createElement('input')
    picker.type = 'file'
    picker.accept = 'image/jpeg,image/png,image/webp'
    picker.onchange = () => {
        const file = picker?.files?.[0]
        picker = null
        if (file) done(file)
    }
    picker.click()
}

/**
 * The folder of the artist: the one that holds all of their tracks. If that is a root of the library (the tracks
 * come from different places) there is no folder worth opening: it is the folder of the first album, and the
 * toast says so.
 */
async function artistFolder(artisthash: string): Promise<string> {
    const tracks: Track[] = await getArtistTracks(artisthash)
    const folder = commonFolder(tracks)
    const roots = useSettings().root_dirs.map(dir => dir.replace(/[\/]+$/, ''))

    if (folder && roots.includes(folder.replace(/[\/]+$/, ''))) {
        const first = tracks.find(track => track.folder)?.folder ?? ''
        if (first) useToast().showNotification(t('Menus.Artist.OpenInFilesRoot'), NotifType.Info)
        return first
    }

    return folder
}

export default async (artisthash: string, artistname: string) => {
    const play_next = <Option>{
        label: t('Menus.Common.PlayNext'),
        action: () => {
            getArtistTracks(artisthash).then(tracks => {
                const store = useTracklist()
                store.insertAfterCurrent(tracks)
            })
        },
        icon: MenuPlayNextIcon,
        menuIcon: true,
    }

    const add_to_queue = <Option>{
        label: t('Menus.Common.AddToQueue'),
        action: () => {
            getArtistTracks(artisthash).then(tracks => {
                const store = useTracklist()
                store.addTracks(tracks)
            })
        },
        icon: MenuAddToQueueIcon,
        menuIcon: true,
    }

    // Action for each playlist option
    const AddToPlaylistAction = (playlist: Playlist) => {
        addArtistToPlaylist(playlist, artisthash)
    }

    const add_to_playlist: Option = {
        label: t('Menus.Common.AddToPlaylist'),
        children: () =>
            getAddToPlaylistOptions(AddToPlaylistAction, {
                artisthash,
                playlist_name: t('Menus.Artist.ThisIsPlaylist', { artist: artistname }),
            }),
        icon: MenuAddToPlaylistIcon,
        menuIcon: true,
    }

    const addToCollectionAction = (collection: Collection) => {
        addOrRemoveItemFromCollection(
            collection.id,
            {
                artisthash,
            } as Artist,
            'artist',
            'add'
        )
    }

    const add_to_page: Option = {
        label: t('Menus.Common.AddToCollection'),
        children: () =>
            getAddToCollectionOptions(addToCollectionAction, {
                collection: null,
                hash: artisthash,
                type: 'artist',
                extra: {},
            }),
        icon: MenuAddToCollectionIcon,
        menuIcon: true,
    }

    const remove_from_collection: Option = {
        label: t('Menus.Common.RemoveFromCollection'),
        action: async () => {
            const success = await addOrRemoveItemFromCollection(
                parseInt(router.currentRoute.value.params.collection as string),
                {
                    artisthash,
                } as Artist,
                'artist',
                'remove'
            )

            if (success) {
                useCollection().removeLocalItem({ artisthash } as Artist, 'artist')
            }
        },
        icon: DeleteIcon,
        menuIcon: true,
    }

    const edit = useArtistEdit()
    const admin = useAuth().is_admin

    const update_thumbnail: Option = {
        label: t('Menus.Artist.UpdateThumbnail'),
        icon: MenuUpdateCoverIcon,
        menuIcon: true,
        action: () => edit.openThumbnail(artisthash, artistname),
    }

    // the hero is placed on the page of the artist (from another page it goes there first); there is no hero on the
    // phone (up to 600px), so the option is not there
    const update_hero: Option = {
        label: t('Menus.Artist.UpdateHero'),
        icon: MenuUpdateCoverIcon,
        menuIcon: true,
        action: () => pickImage(file => edit.startHero(artisthash, file)),
    }

    const open_in_files: Option = {
        label: t('Menus.Common.OpenInFiles'),
        icon: MenuOpenInFilesIcon,
        menuIcon: true,
        action: () => openInFiles(() => artistFolder(artisthash)),
    }

    const rename: Option = {
        label: t('Menus.Artist.Rename'),
        icon: EditIcon,
        menuIcon: true,
        action: () => edit.openRename(artisthash, artistname),
    }

    const find_on_social: Option = {
        ...get_find_on_social('artist', artistname),
        icon: SearchIcon,
        menuIcon: true,
    }

    // the groups of the menu; the empty ones (the admin ones for other users) are left out and the separators only
    // go between the groups that are there
    const groups: Option[][] = [
        [
            play_next,
            add_to_queue,
            add_to_playlist,
            router.currentRoute.value.name === Routes.Page ? remove_from_collection : add_to_page,
        ],
        admin ? [update_thumbnail, ...(useSettings().is_panel_layout ? [update_hero] : [])] : [],
        [open_in_files],
        admin ? [rename] : [],
        [find_on_social],
    ].filter(group => group.length)

    return groups.flatMap((group, index) => (index ? [insetSeparator, ...group] : group))
}
