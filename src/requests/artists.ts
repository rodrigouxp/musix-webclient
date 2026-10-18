import { paths } from '@/config'
import { Album, Artist, Genre, StatItem, Track } from '@/interfaces'
import { NotifType, useToast } from '@/stores/notification'
import useAxios from './useAxios'
import { useT } from '@/i18n'

const { t } = useT();

export const getArtistData = async (hash: string, limit: number = 15, albumlimit: number = 7) => {
    interface ArtistData {
        artist: Artist
        tracks: Track[]
        albums: {
            albums: Album[]
            singles_and_eps: Album[]
            soundtracks: Album[]
            live_albums: Album[]
            appearances: Album[]
            compilations: Album[]
        }
        genres: Genre[]
        stats: StatItem[]
    }

    const { data, error, status } = await useAxios({
        method: 'GET',
        url: paths.api.artist + `/${hash}?tracklimit=${limit}&albumlimit=${albumlimit}`,
    })

    if (status == 404) {
        useToast().showNotification(t('Requests.Artists.ArtistNotFound'), NotifType.Error)
    }

    if (error) {
        console.error(error)
    }

    return data as ArtistData
}

export const getArtistAlbums = async (hash: string, limit = 6, all = false) => {
    interface ArtistAlbums {
        artistname: string
        albums: Album[]
        singles_and_eps: Album[]
        soundtracks: Album[]
        live_albums: Album[]
        appearances: Album[]
        compilations: Album[]
    }

    const { data, error } = await useAxios({
        method: 'GET',
        url: paths.api.artist + `/${hash}/albums?limit=${limit}&all=${all}`,
    })

    if (error) {
        console.error(error)
    }

    return data as ArtistAlbums
}

/**
 * Sends a photo of the artist chosen on this computer.
 * On failure returns `{ error }` with the message of the server.
 */
export async function uploadArtistImage(hash: string, file: File) {
    const form = new FormData()
    form.append('image', file)

    const { data, error } = await useAxios({
        method: 'POST',
        url: paths.api.artist + `/${hash}/image`,
        props: form as any,
    })

    return error ? { error: (data?.error as string) || error } : (data as ArtistImageResult)
}

/**
 * Downloads the automatic photo of the artist again, replacing the current one.
 */
export async function refetchArtistImage(hash: string) {
    const { data, error } = await useAxios({
        method: 'POST',
        url: paths.api.artist + `/${hash}/image/refetch`,
    })

    return error ? { error: (data?.error as string) || error } : (data as ArtistImageResult)
}

export interface ArtistImageResult {
    ok: boolean
    image: string
    source: 'upload' | 'deezer'
}

export const getArtistTracks = async (hash: string) => {
    const { data, error } = await useAxios({
        method: 'GET',
        url: paths.api.artist + `/${hash}/tracks`,
    })

    if (error) {
        console.error(error)
    }

    return data as Track[]
}

export const getSimilarArtists = async (hash: string, limit = 6) => {
    const { data, error } = await useAxios({
        method: 'GET',
        url: paths.api.artist + `/${hash}/similar?artistlimit=${limit}`,
    })

    if (error) {
        console.error(error)
    }

    return data as Artist[]
}

export async function saveArtistAsPlaylist(name: string, hash: string) {
    const { data, error } = await useAxios({
        url: paths.api.artist + `/${hash}/playlist`,
        props: {
            name,
        },
    })

    if (error) {
        console.error(error)
    }

    return data
}
