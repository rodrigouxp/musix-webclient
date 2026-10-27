interface WithPath {
    folder?: string
    filepath?: string
}

const SEPARATOR = /[\\/]/

/** The parts of a path, without the separator at the end ("/music/A/" is ["", "music", "A"]). */
function partsOf(path: string): string[] {
    const parts = path.split(SEPARATOR)

    while (parts.length > 1 && parts[parts.length - 1] === '') parts.pop()

    return parts
}

/** The folder of a track: its `folder`, or the folder of its `filepath`. "" when it has neither. */
function folderOf(track: WithPath): string {
    if (track.folder) return track.folder

    const path = track.filepath ?? ''
    const cut = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'))

    return cut > 0 ? path.slice(0, cut) : ''
}

/**
 * The folder of an album: the one that holds all of its tracks. When they are in different
 * folders (disc 1 and disc 2 in subfolders) it is their common parent, compared by the parts of
 * the path and not by text (`/music/A/CD1` and `/music/A/CD2` give `/music/A`; `/music/AB` and
 * `/music/AC` do not give `/music/A`). With no common folder worth opening (only the root or the
 * drive), it is the folder of the first track. "" when no track has a folder.
 */
export function commonFolder(tracks: WithPath[]): string {
    const folders = tracks.map(folderOf).filter(Boolean)

    if (!folders.length) return ''

    const windows = folders[0].includes('\\') && !folders[0].includes('/')
    const separator = windows ? '\\' : '/'
    const all = folders.map(partsOf)

    let common = all[0]

    for (const parts of all.slice(1)) {
        let i = 0

        while (i < common.length && i < parts.length && common[i] === parts[i]) i++

        common = common.slice(0, i)
    }

    // "/" or "C:" alone is not a folder of the album
    if (common.length < 2) return folders[0].replace(/[\\/]+$/, '') || folders[0]

    return common.join(separator)
}
