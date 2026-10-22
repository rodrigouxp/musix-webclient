import { paths } from '@/config'
import { Artist, Playlist, Track } from '@/interfaces'
import { NotifType, Notification, useToast } from '@/stores/notification'
import useAxios from './useAxios'
import useFolder from '@/stores/pages/folder'
import { useT } from '@/i18n'

const { t } = useT();

const { new: newPlaylistUrl, base: basePlaylistUrl, artists: playlistArtistsUrl } = paths.api.playlist

/**
 * Creates a new playlist on the server.
 * @param playlist_name The name of the playlist to create.
 */
export async function createNewPlaylist(playlist_name: string) {
    const { data, status } = await useAxios({
        url: newPlaylistUrl,
        props: {
            name: playlist_name,
        },
    })

    if (status == 201) {
        new Notification(t('Requests.Playlists.CreatedSuccesfully'), NotifType.Success)
        return data.playlist as Playlist
    }

    let message = t('Common.NotificationError')

    if (status == 409) {
        message = t('Requests.Playlists.AlreadyExists')
    }

    new Notification(message, NotifType.Error)

    return null
}

/**
 * Fetches all playlists from the server.
 * @returns {Promise<Playlist[]>} A promise that resolves to an array of playlists.
 */
export async function getAllPlaylists(no_images = false): Promise<Playlist[]> {
    const { data, error } = await useAxios({
        url: basePlaylistUrl + (no_images ? '?no_images=true' : ''),
        method: 'GET',
    })

    if (error) console.error(error)

    if (data) {
        return data.data
    }

    return []
}

export async function getPlaylist(pid: number | string, no_tracks = false, start: number = 0, limit: number = 50) {
    const uri = `${basePlaylistUrl}/${pid}?no_tracks=${no_tracks}&start=${start}&limit=${limit}`

    interface PlaylistData {
        info: Playlist
        tracks: Track[]
    }

    const { data, status } = await useAxios({
        url: uri,
        method: 'GET',
    })

    if (status == 404) {
        new Notification(t('Requests.Playlists.NotFound'), NotifType.Error)
    }

    if (data) {
        return data as PlaylistData
    }

    return null
}

// ======== ADD ITEM TO PLAYLIST ========
export async function addItemToPlaylist(playlist: Playlist, props: {}) {
    const uri = `${basePlaylistUrl}/${playlist.id}/add`

    const { status } = await useAxios({
        url: uri,
        props: props,
    })

    if (status == 409) {
        new Notification(t('Requests.Playlists.TrackAlreadyPresent'), NotifType.Error)
        return false
    }

    new Notification(t('Requests.Playlists.AddedToPlaylist', {name: playlist.name}))
    return true
}

export function addTracksToPlaylist(playlist: Playlist, tracks: Track[]) {
    return addItemToPlaylist(playlist, {
        itemtype: 'tracks',
        itemhash: tracks.map(t => t.trackhash).join(','),
    })
}

export function addAlbumToPlaylist(playlist: Playlist, albumhash: string) {
    return addItemToPlaylist(playlist, {
        itemtype: 'album',
        itemhash: albumhash,
    })
}

export function addFolderToPlaylist(playlist: Playlist, path: string) {
    const folder = useFolder()
    return addItemToPlaylist(playlist, {
        itemtype: 'folder',
        itemhash: path,
        sortoptions: {
            tracksortby: folder.trackSortBy,
            tracksortreverse: folder.trackSortReverse,
        },
    })
}

export function addArtistToPlaylist(playlist: Playlist, artisthash: string) {
    return addItemToPlaylist(playlist, {
        itemtype: 'artist',
        itemhash: artisthash,
    })
}

// ===== SAVE ITEM AS =====

export async function saveItemAsPlaylist(itemtype: string, props: {}) {
    const { status, data } = await useAxios({
        url: paths.api.playlist.base + '/save-item',
        props: { itemtype, ...props },
    })

    const store = useToast()

    if (status === 201) {
        store.showNotification(t('Requests.Playlists.CreatedSuccesfully'), NotifType.Success)
        return data.playlist as Playlist
    }

    if (status === 409) {
        store.showNotification(t('Requests.Playlists.AlreadyExists'), NotifType.Error)
        return false
    }

    store.showNotification(t('Common.NotificationError'), NotifType.Error)
    return false
}

export function saveTrackAsPlaylist(playlist_name: string, itemhash: string) {
    return saveItemAsPlaylist('tracks', {
        itemhash,
        playlist_name,
    })
}

export function saveAlbumAsPlaylist(playlist_name: string, itemhash: string) {
    return saveItemAsPlaylist('album', {
        itemhash,
        playlist_name,
    })
}

export function saveFolderAsPlaylist(playlist_name: string, itemhash: string) {
    const folder = useFolder()
    return saveItemAsPlaylist('folder', {
        itemhash,
        playlist_name,
        sortoptions: {
            tracksortby: folder.trackSortBy,
            tracksortreverse: folder.trackSortReverse,
        },
    })
}

export function saveArtistAsPlaylist(playlist_name: string, itemhash: string) {
    return saveItemAsPlaylist('artist', {
        itemhash,
        playlist_name,
    })
}

// ========== END =========

/**
 * Changes the name and/or the cover of a playlist. Only what is sent changes.
 * The error has the text to show to the user.
 */
export async function updatePlaylistInfo(
    pid: number,
    fields: { name?: string; image?: File }
): Promise<{ playlist: Playlist } | { error: string }> {
    const form = new FormData()

    if (fields.name !== undefined) form.append('name', fields.name)
    if (fields.image) form.append('image', fields.image)

    const { data, status } = await useAxios({
        url: `${basePlaylistUrl}/${pid}/update`,
        method: 'PUT',
        props: form,
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })

    if (status === 200 && data) {
        return { playlist: data.data as Playlist }
    }

    if (status === 409) return { error: t('Requests.Playlists.AlreadyExists') }
    if (status === 400) return { error: t('Requests.Playlists.ErrUnsupportedImage') }

    return { error: t('Common.NotificationError') }
}

/**
 * Gets the artists in a playlist.
 * @param pid The playlist id to fetch tracks for.
 * @returns {Promise<Artist[]>} A promise that resolves to an array of artists.
 */
export async function getPlaylistArtists(pid: number): Promise<Artist[]> {
    const { data, error } = await useAxios({
        url: playlistArtistsUrl,
        props: {
            pid: pid,
        },
    })

    if (error) {
        new Notification(t('Common.NotificationFunnyError'), NotifType.Error)
    }

    if (data) {
        return data.data as Artist[]
    }

    return []
}

export async function deletePlaylist(pid: number) {
    const { status } = await useAxios({
        url: paths.api.playlist.base + `/${pid}/delete`,
        method: 'DELETE',
    })

    if (status == 200) {
        new Notification(t('Requests.Playlists.Deleted'), NotifType.Success)
    }
}

export async function removeTracks(pid: number, tracks: { trackhash: string; index: number }[]) {
    const { status } = await useAxios({
        url: paths.api.playlist.base + `/${pid}/remove-tracks`,
        props: {
            tracks,
        },
    })

    if (status === 200) {
        new Notification(t('Requests.Playlists.TrackRemoved'))
        return
    }

    new Notification(t('Requests.Playlists.TrackRemovedError'), NotifType.Error)
}

export async function removeBannerImage(playlistid: number) {
    const { data, status } = await useAxios({
        url: paths.api.playlist.base + `/${playlistid}/remove-img`,
        method: 'DELETE',
    })

    if (status === 200) {
        new Notification(t('Requests.Playlists.BannerImageRemoved'))
        return data.playlist as Playlist
    }

    new Notification(t('Requests.Playlists.BannerImageRemovedError'), NotifType.Error)
}

export async function pinUnpinPlaylist(pid: number) {
    const { status } = await useAxios({
        url: paths.api.playlist.base + `/${pid}/pin_unpin`,
    })

    if (status === 200) {
        return true
    }

    return false
}

/**
 * Favorites or unfavorites a playlist. Gives the new state, or `null` if it failed.
 */
export async function favoritePlaylist(pid: number): Promise<boolean | null> {
    const { data, status } = await useAxios({
        url: paths.api.playlist.base + `/${pid}/favorite`,
    })

    if (status === 200) {
        return data.is_favorite as boolean
    }

    return null
}
