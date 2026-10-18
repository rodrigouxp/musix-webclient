import { paths } from '@/config'
import { Track } from '@/interfaces'
import useAxios from './useAxios'

export interface RenameResult {
    ok: boolean
    track: Track
    old_trackhash: string
    new_trackhash: string
}

/**
 * Renames a track: the title tag and the name of the file become `title`.
 * On failure returns `{ error }` with the message of the server.
 */
export async function renameTrack(filepath: string, title: string): Promise<RenameResult | { error: string }> {
    const { data, error } = await useAxios({
        url: paths.api.track + '/rename',
        method: 'POST',
        props: { filepath, title },
    })

    if (error) {
        return { error: (data?.error as string) || error }
    }

    return data as RenameResult
}
