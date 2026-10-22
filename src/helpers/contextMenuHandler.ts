import { Store } from 'pinia'
import { Ref } from 'vue'
import { useRoute } from 'vue-router'

import { ContextSrc } from '@/enums'
import { Album, Playlist, Track } from '@/interfaces'
import useContextStore from '@/stores/context'

import albumContextItems from '@/context_menus/album'
import artistContextItems from '@/context_menus/artist'
import folderContextItems from '@/context_menus/folder'
import trackContextItems, { getTrackAddOptions } from '@/context_menus/track'
import { useT } from '@/i18n'
import queueContextItems from '@/context_menus/queue'
import playlistContextItems, { playlistCardItems } from '@/context_menus/playlist'

let stop_prev_watcher = () => {}

function flagWatcher(menu: Store, flag: Ref<boolean>) {
    stop_prev_watcher()

    if (flag.value) {
        return (flag.value = false)
    }

    // watch for context menu visibility and reset flag
    stop_prev_watcher = menu.$subscribe((mutation, state) => {
        //@ts-ignore
        flag.value = state.visible
    })
}

export const showTrackContextMenu = (e: MouseEvent, track: Track, flag: Ref<boolean>) => {
    const menu = useContextStore()
    const options = () => trackContextItems(track)

    menu.showContextMenu(e, options, ContextSrc.Track)

    flagWatcher(menu, flag)
}

// The menu of the add button of the bottom bar: it opens upward, from the top of the button
export const showPlayingAddMenu = (button: HTMLElement, track: Track) => {
    const menu = useContextStore()
    const { t } = useT()
    const rect = button.getBoundingClientRect()

    const options = async () => {
        const { add_to_q, add_to_playlist } = getTrackAddOptions(track, t('BottomBar.AddToPlaylist'))
        return [add_to_q, add_to_playlist]
    }

    // the menu only needs the point it opens from
    const point = { x: rect.left, y: rect.top - 4 } as MouseEvent
    menu.showContextMenu(point, options, ContextSrc.Track, 'top-start', ['bottom-start'])
}

export const showAlbumContextMenu = (e: MouseEvent, flag: Ref<boolean>, album?: Album) => {
    const menu = useContextStore()

    const options = () => albumContextItems(album)
    menu.showContextMenu(e, options, ContextSrc.AlbumHeader)

    flagWatcher(menu, flag)
}

export const showFolderContextMenu = (e: MouseEvent, flag: Ref<boolean>, source: ContextSrc, path: string) => {
    const menu = useContextStore()

    const options = () => folderContextItems(path)
    menu.showContextMenu(e, options, source)

    flagWatcher(menu, flag)
}

export const showArtistContextMenu = (e: MouseEvent, flag: Ref<boolean>, artisthash: string, artistname: string) => {
    const menu = useContextStore()

    const options = () => artistContextItems(artisthash, artistname)
    menu.showContextMenu(e, options, ContextSrc.ArtistHeader)

    flagWatcher(menu, flag)
}

// The three dots of the page of a playlist
export const showPlaylistContextMenu = (e: MouseEvent, flag: Ref<boolean>) => {
    const menu = useContextStore()

    menu.showContextMenu(e, () => playlistContextItems(), ContextSrc.PHeader)

    flagWatcher(menu, flag)
}

// The right click on the card of a playlist: `rename` puts its name in a text field
export const showPlaylistCardContextMenu = (e: MouseEvent, playlist: Playlist, rename: () => void) => {
    const menu = useContextStore()

    menu.showContextMenu(e, () => playlistCardItems(playlist, rename), ContextSrc.PlaylistCard)
}

export const showQueueContextMenu = (e: MouseEvent, flag: Ref<boolean>) => {
    const menu = useContextStore()

    const options = () => queueContextItems()
    menu.showContextMenu(e, options, ContextSrc.Queue)

    flagWatcher(menu, flag)
}

// export const showAlbumCardContextMenu = (e: MouseEvent, flag: Ref<boolean>, album: Album) => {

// }
