import { Album, Track } from '@/interfaces'
import { forEachObjectInStores, patchTrackEverywhere } from './patchTrack'

// what changes when an album is renamed; the rest of the object belongs to the list it is in
const FIELDS: (keyof Album)[] = ['albumhash', 'title', 'og_title', 'base_title', 'image', 'versions'] as any

/**
 * Updates, in every store, the copies of an album that was renamed (found by its old hash)
 * and of its tracks (found by their file path): cards, lists, queue, search results... so the
 * screen shows the new title without reloading the page.
 *
 * @param oldAlbumhash the hash the album had
 * @param album the album as the server has it now
 * @param tracks the tracks of the album as the server has them now
 */
export function patchAlbumEverywhere(oldAlbumhash: string, album: Album, tracks: Track[]) {
    for (const track of tracks) {
        patchTrackEverywhere(track.filepath, track)
    }

    forEachObjectInStores(value => {
        if (value.albumhash !== oldAlbumhash) return

        // an album (a card), not a track of it
        if ('trackcount' in value && !('filepath' in value)) {
            for (const key of FIELDS) {
                if (key in album) value[key] = (album as any)[key]
            }

            return
        }

        // where the queue and the play tracker say they are playing from ("Playing from album ...")
        if (value.type === 'album' && 'name' in value) {
            value.albumhash = album.albumhash
            value.name = album.title
        }
    })
}
