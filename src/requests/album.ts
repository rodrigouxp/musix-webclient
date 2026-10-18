import { paths } from '@/config'
import { Album, StatItem, Track } from '@/interfaces'
import { NotifType, useToast } from '@/stores/notification'
import useAxios from './useAxios'
import { useT } from '@/i18n'

const { t } = useT();

const {
    album: albumUrl,
    albumartists: albumArtistsUrl,
    albumbio: albumBioUrl,
    albumsByArtistUrl,
    albumVersions,
} = paths.api

const getAlbumData = async (albumhash: string, albumlimit: number) => {
    interface AlbumData {
        info: Album
        tracks: Track[]
        copyright: string
        extra: {
            track_total: number
            avg_bitrate: number
        }
        stats: StatItem[]
        more_from: {
            [key: string]: Album[]
        }
        other_versions: Album[]
    }

    const { data, status } = await useAxios({
        url: albumUrl,
        props: {
            albumhash,
            albumlimit,
        },
    })

    if (status == 204) {
        useToast().showNotification(t('Requests.Album.AlbumNotCreatedYet'), NotifType.Error)
    }

    return data as AlbumData
}

const getAlbumArtists = async (hash: string) => {
    const { data, error } = await useAxios({
        url: albumArtistsUrl,
        props: {
            hash: hash,
        },
    })

    if (error) {
        console.error(error)
    }

    return data.artists
}

const getAlbumBio = async (hash: string) => {
    const { data, status } = await useAxios({
        url: albumBioUrl,
        props: {
            hash: hash,
        },
    })

    if (data) {
        return data.bio
    }

    if (status == 404) {
        return null
    }
}

export const getAlbumsFromArtist = async (albumartists: {}, limit: number = 2, base_title: string) => {
    const { data } = await useAxios({
        url: albumsByArtistUrl,
        props: {
            albumartists: albumartists,
            limit: limit,
            base_title,
        },
    })

    if (data) {
        return data
    }

    return []
}

export const getAlbumVersions = async (og_album_title: string, albumhash: string) => {
    const { data } = await useAxios({
        url: albumVersions,
        props: {
            og_album_title,
            albumhash,
        },
    })

    if (data) {
        return data
    }

    return []
}

export async function getAlbumTracks(albumhash: string): Promise<Track[]> {
    const { data } = await useAxios({
        url: albumUrl + `/${albumhash}/` + 'tracks',
        method: 'GET',
    })

    return data
}

export async function refreshAlbumCover(albumhash: string): Promise<{ ok: boolean; has_cover: boolean } | null> {
    const { data, error } = await useAxios({
        url: albumUrl + `/${albumhash}/refresh-cover`,
        method: 'POST',
    })

    if (error) {
        return null
    }

    return data
}

export interface EmbedCoverResult {
    ok: boolean
    tracks_ok: number
    tracks_failed: string[]
    errors?: { [path: string]: string }
}

/**
 * Writes the cover of the album folder into the tags of every file of the album.
 * On failure returns `{ error }` with the message of the server.
 */
export async function embedAlbumCover(albumhash: string): Promise<EmbedCoverResult | { error: string }> {
    const { data, error } = await useAxios({
        url: albumUrl + `/${albumhash}/embed-cover`,
        method: 'POST',
    })

    if (error) {
        return { error: (data?.error as string) || error }
    }

    return data as EmbedCoverResult
}

export type AlbumKind = 'ep' | 'soundtrack' | 'live album'

/**
 * Marks the album as an EP, a soundtrack or a live album. `null` removes the mark.
 * Returns `null` if the server refused.
 */
export async function setAlbumType(albumhash: string, kind: AlbumKind | null): Promise<{ ok: boolean; kind: AlbumKind | null } | null> {
    const { data, error } = await useAxios({
        url: albumUrl + `/${albumhash}/type`,
        method: 'POST',
        props: {
            kind,
        },
    })

    if (error) {
        return null
    }

    return data
}

export async function getSimilarAlbums(artisthash: string, limit: number = 5): Promise<Album[]> {
    const { data } = await useAxios({
        url: albumUrl + '/similar?' + 'artisthash=' + artisthash + '&albumlimit=' + limit,
        method: 'GET',
    })

    return data
}

export { getAlbumData as getAlbum, getAlbumArtists, getAlbumBio }
