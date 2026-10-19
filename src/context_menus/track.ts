import { router } from '@/router'
import { Artist, Playlist, Track } from '@/interfaces'
import { router as Router, Routes } from '@/router'

import { Option } from '@/interfaces'
import { openInFiles } from '@/requests/folders'
import { addTracksToPlaylist, removeTracks } from '@/requests/playlists'

import {
    DeleteIcon,
    EditIcon,
    MenuAddToPlaylistIcon,
    MenuAddToQueueIcon,
    MenuGoToAlbumIcon,
    MenuGoToArtistIcon,
    MenuGoToFolderIcon,
    MenuPlayNextIcon,
    MenuSearchOnIcon,
} from '@/icons'
import { renameTrack } from '@/requests/tracks'
import useAuth from '@/stores/auth'
import { NotifType, useToast } from '@/stores/notification'
import { askText } from '@/stores/prompt'
import { patchTrackEverywhere } from '@/utils/patchTrack'
import usePlaylistStore from '@/stores/pages/playlist'
import useQueueStore from '@/stores/queue'
import useTracklist from '@/stores/queue/tracklist'
import { getAddToPlaylistOptions, get_find_on_social, insetSeparator } from './utils'
import { useT } from '@/i18n'

const { t } = useT();

/**
 * Returns a list of context menu items for a track.
 * @param  {any} track a track object.
 * @return {Array<Option>()} a list of context menu items.
 */

export default async (track: Track): Promise<Option[]> => {
    const route = router.currentRoute.value
    const on_playlist = route.name === Routes.playlist && !Number.isNaN(parseInt(route.params.pid as string))

    const track_artists = Object.values(
        [...track.artists, ...track.albumartists].reduce((acc, artist) => {
            acc[artist.artisthash] = artist
            return acc
        }, {} as Record<string, Artist>)
    )

    const goToArtist = async (artists: Artist[]) => {
        if (artists.length === 1) {
            return false
        }

        return artists.map(artist => {
            return <Option>{
                label: artist.name,
                action: () =>
                    Router.push({
                        name: Routes.artist,
                        params: {
                            hash: artist.artisthash,
                        },
                    }),
            }
        })
    }

    const AddToPlaylistAction = (playlist: Playlist) => {
        addTracksToPlaylist(playlist, [track]).then(success => {
            if (!(route.name == Routes.playlist && parseInt(route.params.pid as string) == playlist.id)) return

            if (!success) return
            const store = usePlaylistStore()
            store.addTrack(track)
            store.fetchAll(parseInt(route.params.pid as string), true)
        })
    }

    const add_to_playlist: Option = {
        label: t('Menus.Common.AddToPlaylist'),
        children: () =>
            getAddToPlaylistOptions(AddToPlaylistAction, {
                trackhash: track.trackhash,
                playlist_name: track.title,
            }),
        icon: MenuAddToPlaylistIcon,
        menuIcon: true,
    }

    const add_to_q: Option = {
        label: t('Menus.Common.AddToQueue'),
        action: () => {
            useTracklist().addTracks([track])
        },
        icon: MenuAddToQueueIcon,
        menuIcon: true,
    }

    const play_next: Option = {
        label: t('Menus.Common.PlayNext'),
        action: () => {
            useQueueStore().playTrackNext(track)
        },
        icon: MenuPlayNextIcon,
        menuIcon: true,
    }

    const go_to_folder: Option = {
        label: t('Menus.Track.GoToFolder'),
        action: () => {
            Router.push({
                name: Routes.folder,
                params: { path: track.folder },
            })
        },
        icon: MenuGoToFolderIcon,
        menuIcon: true,
    }

    const go_to_artist: Option = {
        label: t('Menus.Track.GoToArtist'),
        icon: MenuGoToArtistIcon,
        menuIcon: true,
        action: () => {
            track_artists.length == 1
                ? Router.push({
                      name: Routes.artist,
                      params: {
                          hash: track.artists[0].artisthash,
                      },
                  })
                : null
        },
        singleChild: track_artists.length === 1,
        children: () => goToArtist(track_artists),
    }

    const open_in_explorer: Option = {
        label: t('Menus.Track.OpenInFiles'),
        action: () => {
            openInFiles(track.filepath || track.folder || '')
        },
        icon: MenuGoToFolderIcon,
        menuIcon: true,
    }

    const go_to_album: Option = {
        label: t('Menus.Track.GoToAlbum'),
        action: () => {
            Router.push({
                name: Routes.album,
                params: { albumhash: track.albumhash },
            })
        },
        icon: MenuGoToAlbumIcon,
        menuIcon: true,
    }

    const rename: Option = {
        label: t('Menus.Track.Rename'),
        icon: EditIcon,
        menuIcon: true,
        action: () => {
            const oldFilepath = track.filepath

            // starts with the title as it is on the screen
            askText(t('Menus.Track.RenameTitle'), track.title.trim(), t('Menus.Track.RenameSave'), async title => {
                const toast = useToast()
                const result = await renameTrack(oldFilepath, title)

                if ('error' in result) {
                    toast.showNotification(result.error || t('Menus.Track.RenameError'), NotifType.Error)
                    return false
                }

                // the queue and the lists on screen use the new file path and title from now on
                patchTrackEverywhere(oldFilepath, result.track)
                toast.showNotification(t('Menus.Track.Renamed'), NotifType.Success)
                return true
            })
        },
    }

    // const del_track: Option = {
    //   label: t('Menus.Track.DeleteTrack'),
    //   action: () => console.log("Delete Track"),
    //   icon: DeleteIcon,
    //   critical: true,
    // };

    const getRemoveFromPlaylistOption = () =>
        <Option>{
            label: t('Menus.Common.RemoveFromPlaylist'),
            action: () => {
                removeTracks(parseInt(route.params.pid as string), [
                    { trackhash: track.trackhash, index: track.index },
                ]).then(() => {
                    const store = usePlaylistStore()
                    store.removeTrackByIndex(track.index)
                    store.fetchAll(parseInt(route.params.pid as string), true)
                })
            },
            icon: DeleteIcon,
            menuIcon: true,
            critical: true,
        }

    const search_on = {
        ...get_find_on_social('track', `${track.title} ${track.artists[0].name}`),
        icon: MenuSearchOnIcon,
        menuIcon: true,
    }

    // "Remove from ..." goes first, only on the pages where it makes sense (red, as before)
    const remove: Option[] = []

    if (route.name === Routes.playlist && on_playlist) {
        remove.push(getRemoveFromPlaylistOption())
    }

    if (route.name === Routes.nowPlaying) {
        remove.push(<Option>{
            label: t('Menus.Common.RemoveFromQueue'),
            action: () => {
                useTracklist().removeByIndex(track.index)
            },
            icon: DeleteIcon,
            menuIcon: true,
            critical: true,
        })
    }

    // the groups of the menu; the empty ones (the admin one for other users) are left
    // out and the separators only go between the groups that are there
    const groups: Option[][] = [
        remove,
        [play_next],
        [add_to_q, add_to_playlist],
        [go_to_album, go_to_folder, go_to_artist],
        [open_in_explorer],
        useAuth().is_admin ? [rename] : [],
        [search_on],
    ].filter(group => group.length)

    return groups.flatMap((group, index) => (index ? [insetSeparator, ...group] : group))
}

// TODO: Find a way to fetch playlists lazily. ie. When the "Add to playlist" option is triggered.
