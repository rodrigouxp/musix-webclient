import { router, Routes } from '@/router'

import useAlbum from '@/stores/pages/album'
import useArtistPage from '@/stores/pages/artist'
import useArtistDiscography from '@/stores/pages/artistDiscog'
import useAuth from '@/stores/auth'
import useCollection from '@/stores/pages/collections'
import useTracklist from '@/stores/queue/tracklist'

import { AlbumKind, embedAlbumCover, getAlbumTracks, refreshAlbumCover, setAlbumType } from '@/requests/album'
import { askConfirm } from '@/stores/confirm'
import { addOrRemoveItemFromCollection } from '@/requests/collections'
import { addAlbumToPlaylist } from '@/requests/playlists'

import { AddToQueueIcon, ArrowRightIcon, DeleteIcon, PlayNextIcon, PlusIcon, RefreshIcon, SaveIcon } from '@/icons'
import { Album, Collection, Option, Playlist, Track } from '@/interfaces'
import { get_find_on_social, getAddToCollectionOptions, getAddToPlaylistOptions } from './utils'
import { NotifType, useToast } from '@/stores/notification'
import { useT } from '@/i18n'

const { t } = useT();

const albumKinds: { kind: AlbumKind; mark: string; remove: string; name: string }[] = [
    {
        kind: 'ep',
        mark: 'Menus.Album.MarkAsEps',
        remove: 'Menus.Album.RemoveFromEps',
        name: 'EPs & Singles',
    },
    {
        kind: 'soundtrack',
        mark: 'Menus.Album.MarkAsSoundtrack',
        remove: 'Menus.Album.RemoveFromSoundtrack',
        name: 'Soundtrack',
    },
    {
        kind: 'live album',
        mark: 'Menus.Album.MarkAsLive',
        remove: 'Menus.Album.RemoveFromLive',
        name: 'Live album',
    },
]

/**
 * Loads the page that is on screen again, so the album shows up in (or leaves)
 * the right section without reloading the whole app.
 */
async function refreshCurrentPage(album: Album) {
    const route = router.currentRoute.value
    const hash = route.params.hash as string

    if (route.name === Routes.artist && hash) {
        await useArtistPage().getData(hash)
    } else if (route.name === Routes.artistDiscography && hash) {
        useArtistDiscography().fetchAlbums(hash)
    } else if (useAlbum().info.albumhash === album.albumhash) {
        await useAlbum().fetchTracksAndArtists(album.albumhash)
    }
}

export default async (album?: Album) => {
    const albumStore = useAlbum()

    if (!album) {
        album = albumStore.info
    }

    const play_next = <Option>{
        label: t('Menus.Common.PlayNext'),
        action: async () => {
            let tracks: Track[] = []

            if (album) {
                tracks = await getAlbumTracks(album.albumhash)
            } else {
                tracks = albumStore.tracks.filter(track => !track.is_album_disc_number)
            }

            useTracklist().insertAfterCurrent(tracks)
        },
        icon: PlayNextIcon,
    }

    const add_to_queue = <Option>{
        label: t('Menus.Common.AddToQueue'),
        action: async () => {
            let tracks: Track[] = []

            if (album) {
                tracks = await getAlbumTracks(album.albumhash)
            } else {
                tracks = albumStore.tracks.filter(track => !track.is_album_disc_number)
            }

            useTracklist().addTracks(tracks)
        },
        icon: AddToQueueIcon,
    }

    // Action for each playlist option
    const AddToPlaylistAction = (playlist: Playlist) => {
        addAlbumToPlaylist(playlist, album.albumhash)
    }

    const add_to_playlist: Option = {
        label: t('Menus.Common.AddToPlaylist'),
        children: () =>
            getAddToPlaylistOptions(AddToPlaylistAction, {
                albumhash: album.albumhash,
                playlist_name: album.title,
            }),
        icon: PlusIcon,
    }

    const addToPageAction = (page: Collection) => {
        addOrRemoveItemFromCollection(page.id, album, 'album', 'add')
    }

    const add_to_page: Option = {
        label: t('Menus.Common.AddToCollection'),
        children: () =>
            getAddToCollectionOptions(addToPageAction, {
                collection: null,
                hash: album.albumhash,
                type: 'album',
                extra: {},
            }),
        icon: PlusIcon,
    }

    const remove_from_page: Option = {
        label: t('Menus.Common.RemoveFromCollection'),
        action: async () => {
            const success = await addOrRemoveItemFromCollection(
                parseInt(router.currentRoute.value.params.collection as string),
                album,
                'album',
                'remove'
            )

            if (success) {
                useCollection().removeLocalItem(album, 'album')
            }
        },
        icon: DeleteIcon,
    }

    const update_cover = <Option>{
        label: t('Menus.Common.UpdateAlbumCover'),
        action: async () => {
            const toast = useToast()
            const result = await refreshAlbumCover(album.albumhash)

            if (result === null) {
                toast.showNotification(t('Requests.Album.UpdateCoverError'), NotifType.Error)
                return
            }

            if (!result.has_cover) {
                toast.showNotification(t('Requests.Album.NoCoverFound'), NotifType.Info)
            } else {
                toast.showNotification(t('Requests.Album.CoverUpdated'), NotifType.Success)
            }

            if (albumStore.info.albumhash === album.albumhash) {
                albumStore.bumpCover()
            }
        },
    }

    update_cover.icon = RefreshIcon

    const currentKind = album.album_type ?? album.type
    const markOptions: Option[] = useAuth().is_admin
        ? albumKinds.map(({ kind, mark, remove, name }) => {
              const marked = currentKind === kind

              return <Option>{
                  label: t(marked ? remove : mark),
                  icon: ArrowRightIcon,
                  action: async () => {
                      const toast = useToast()
                      const result = await setAlbumType(album.albumhash, marked ? null : kind)

                      if (result === null) {
                          toast.showNotification(t('Requests.Album.TypeError'), NotifType.Error)
                          return
                      }

                      album.album_type = result.kind ?? 'album'
                      toast.showNotification(
                          result.kind
                              ? t('Requests.Album.TypeMarked', { type: name })
                              : t('Requests.Album.TypeRemoved'),
                          NotifType.Success
                      )

                      await refreshCurrentPage(album)
                  },
              }
          })
        : []

    const embed_cover: Option[] = useAuth().is_admin
        ? [
              <Option>{
                  label: t('Menus.Album.EmbedCover'),
                  icon: SaveIcon,
                  action: async () => {
                      const toast = useToast()
                      const count = album.trackcount

                      const yes = await askConfirm(
                          t('Menus.Album.ConfirmEmbedCover', { count }),
                          t('Menus.Album.EmbedCoverConfirm')
                      )

                      if (!yes) return

                      const result = await embedAlbumCover(album.albumhash)

                      if ('error' in result) {
                          toast.showNotification(result.error || t('Requests.Album.EmbedCoverError'), NotifType.Error)
                          return
                      }

                      toast.showNotification(
                          result.tracks_failed.length
                              ? t('Requests.Album.CoverEmbeddedPartial', {
                                    ok: result.tracks_ok,
                                    failed: result.tracks_failed.length,
                                })
                              : t('Requests.Album.CoverEmbedded', { count: result.tracks_ok }),
                          result.tracks_failed.length ? NotifType.Error : NotifType.Success
                      )
                  },
              },
          ]
        : []

    return [
        play_next,
        add_to_queue,
        add_to_playlist,
        ...[router.currentRoute.value.name === Routes.Page ? remove_from_page : add_to_page],
        get_find_on_social('album', '', album),
        update_cover,
        ...markOptions,
        ...embed_cover,
    ]
}
