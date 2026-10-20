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
    'album',
    'og_album',
    'albumhash',
    'image',
    'weakhash',
    'explicit',
] as any

/**
 * Calls `fn` with every object (not array) in the state of every store: lists, queue,
 * search results... The copies of a track or an album that is on the screen are found this way.
 */
export function forEachObjectInStores(fn: (value: any) => void) {
    const pinia = getActivePinia() as any
    const stores: Map<string, any> | undefined = pinia?._s
    if (!stores) return

    const seen = new WeakSet<object>()

    const visit = (value: any, depth: number) => {
        if (!value || typeof value !== 'object' || seen.has(value) || depth > 6) return
        seen.add(value)

        if (!Array.isArray(value)) fn(value)

        for (const key of Object.keys(value)) {
            visit(value[key], depth + 1)
        }
    }

    stores.forEach(store => visit(store.$state, 0))
}

/**
 * Updates, in every store, the copies of a track that was renamed (found by its old
 * file path): lists, queue, search results... so the screen shows the new title
 * and the next play uses the new file path, without reloading the page.
 */
export function patchTrackEverywhere(oldFilepath: string, track: Track) {
    forEachObjectInStores(value => {
        if (value.filepath === oldFilepath && value.trackhash) {
            for (const key of FIELDS) {
                if (key in track) value[key] = (track as any)[key]
            }
        }
    })
}
