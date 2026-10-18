import { getActivePinia } from 'pinia'
import { Track } from '@/interfaces'

// what changes when a track is renamed; the rest of the object belongs to the list it is in
const FIELDS: (keyof Track)[] = [
    'filepath',
    'trackhash',
    'title',
    'artists',
    'artisthashes',
    'albumartists',
    'folder',
    'albumhash',
    'image',
    'weakhash',
    'explicit',
] as any

/**
 * Updates, in every store, the copies of a track that was renamed (found by its old
 * file path): lists, queue, search results... so the screen shows the new title
 * and the next play uses the new file path, without reloading the page.
 */
export function patchTrackEverywhere(oldFilepath: string, track: Track) {
    const pinia = getActivePinia() as any
    const stores: Map<string, any> | undefined = pinia?._s
    if (!stores) return

    const seen = new WeakSet<object>()

    const visit = (value: any, depth: number) => {
        if (!value || typeof value !== 'object' || seen.has(value) || depth > 6) return
        seen.add(value)

        if (!Array.isArray(value) && value.filepath === oldFilepath && value.trackhash) {
            for (const key of FIELDS) {
                if (key in track) value[key] = (track as any)[key]
            }
        }

        for (const key of Object.keys(value)) {
            visit(value[key], depth + 1)
        }
    }

    stores.forEach(store => visit(store.$state, 0))
}
