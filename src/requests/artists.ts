import { paths } from '@/config'
import { Album, Artist, Genre, StatItem, Track } from '@/interfaces'
import { NotifType, useToast } from '@/stores/notification'
import useAxios from './useAxios'
import { getRenameStatus, postRename, RenameJobStatus } from './rename'
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

export interface RenamePreview {
    artist: { artisthash: string; name: string | null }
    new_name: string
    new_artisthash: string
    tracks_in_artist_tag: number
    albums_in_artist_tag: number
    tracks_as_participant: number
    tracks_title_only: number
    files_to_rename: number
    files_to_rewrite: number
    files_total: number
    unsupported_count: number
    unsupported_formats: { filepath: string; error: string }[]
    name_conflicts_count: number
    name_conflicts: { filepath: string; name: string }[]
    not_writable_count: number
    not_writable: string[]
    other_errors: { filepath: string; error: string }[]
    merge: { name: string; artisthash: string; trackcount: number } | null
    samples: RenameSample[]
    participant_count: number
    same_tag_collapses_count: number
    same_tag_collapses: RenameSample[]
    no_albumartist_count: number
    no_albumartist: RenameSample[]
    warning: string
}

export interface RenameSample {
    filepath: string
    title: string
    album: string
    artist_before: string | null
    artist_after: string | null
    albumartist_before: string | null
    albumartist_after: string | null
    participant: boolean
}

export interface RenameStatus extends RenameJobStatus {
    artisthash: string
    old_name: string
    new_name: string
    new_artisthash: string | null
    result: {
        error?: string
        files_ok?: number
        files_failed?: { [filepath: string]: string }
        artist_moved?: boolean
        new_artisthash?: string | null
    } | null
}

/**
 * What renaming the artist in all the files would do. Writes nothing.
 * On failure returns `{ error }` with the message of the server.
 */
export async function previewArtistRename(hash: string, name: string): Promise<RenamePreview | { error: string }> {
    return postRename<RenamePreview>(paths.api.artist + `/${hash}/rename/preview`, { name })
}

/**
 * Starts the rename, which runs in the background (see `getArtistRenameStatus`).
 */
export async function startArtistRename(hash: string, name: string): Promise<{ ok: boolean } | { error: string }> {
    return postRename<{ ok: boolean }>(paths.api.artist + `/${hash}/rename`, { name, confirm: true })
}

export async function getArtistRenameStatus(): Promise<RenameStatus | null> {
    return getRenameStatus<RenameStatus>(paths.api.artist + '/rename/status')
}
