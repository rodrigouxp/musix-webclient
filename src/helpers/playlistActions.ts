import { useT } from '@/i18n'
import { favoritePlaylist, getPlaylist, pinUnpinPlaylist } from '@/requests/playlists'
import { NotifType, useToast } from '@/stores/notification'
import usePlaylistPage from '@/stores/pages/playlist'
import usePlaylistsStore from '@/stores/pages/playlists'

const { t } = useT()

/**
 * Every track of a playlist (the page only loads the first ones).
 */
export async function getAllPlaylistTracks(pid: number) {
    const playlist = await getPlaylist(pid, false, 0, -1)
    return playlist?.tracks || []
}

/**
 * Pins or unpins a playlist. The page of the playlist and the list of the Playlists page
 * (and its "Pinned" group) follow without reloading the app.
 */
export async function togglePlaylistPin(pid: number) {
    const done = await pinUnpinPlaylist(pid)

    if (!done) {
        useToast().showNotification(t('Common.NotificationError'), NotifType.Error)
        return
    }

    const page = usePlaylistPage()

    if (page.info.id === pid) {
        page.info.pinned = !page.info.pinned
    }

    await usePlaylistsStore().fetchAll()
}

/**
 * Favorites or unfavorites a playlist.
 */
export async function togglePlaylistFavorite(pid: number) {
    const is_favorite = await favoritePlaylist(pid)

    if (is_favorite === null) {
        useToast().showNotification(t('Common.NotificationError'), NotifType.Error)
        return
    }

    const page = usePlaylistPage()

    if (page.info.id === pid) {
        page.info.is_favorite = is_favorite
    }

    await usePlaylistsStore().fetchAll()
}
