import { paths } from '@/config'
import { Folder, Track } from '@/interfaces'
import { useT } from '@/i18n'
import { NotifType, useToast } from '@/stores/notification'
import useAxios from './useAxios'

const { t } = useT()

export async function getFiles(
    path: string,
    start: number,
    limit: number,
    tracks_only = false,
    options: {
        sorttracksby: string
        tracksort_reverse: boolean
        sortfoldersby: string
        foldersort_reverse: boolean
    } = {
        sorttracksby: 'default',
        tracksort_reverse: false,
        sortfoldersby: 'default',
        foldersort_reverse: false,
    }
) {
    interface FolderData {
        tracks: Track[]
        folders: Folder[]
        path: string
        total: number
    }

    const { data, error } = await useAxios({
        url: paths.api.folder.base,
        props: {
            folder: path,
            start,
            limit,
            tracks_only,
            ...options,
        },
    })

    if (error) {
        console.error(error)
    }

    if (data) {
        return data as FolderData
    }

    return <FolderData>{
        path: '',
        tracks: [],
        folders: [],
        total: 0,
    }
}

/**
 * The address of a folder in the file manager of the host (ZimaOS Files). `{origin}` is the address
 * the user opened the app from, without the port (the file manager is in the same host, so it works
 * from the home network and from the VPN alike); `{path}` is the folder, a piece at a time encoded.
 */
export function buildFilesUrl(template: string, hostPath: string) {
    const origin = `${window.location.protocol}//${window.location.hostname}`
    const path = hostPath.split('/').filter(Boolean).map(encodeURIComponent).join('/')

    return template.replace(/{origin}/g, () => origin).replace(/{path}/g, () => path)
}

/**
 * Opens, in a new tab, the folder of a song (or the folder itself) in the file manager of the host.
 */
export async function openInFiles(path: string) {
    // The tab opens now, in the click: after waiting for the server the browser (the iPhone, above
    // all) would take it for a pop-up and block it
    const tab = window.open('', '_blank')

    const fail = (key: string) => {
        tab?.close()
        useToast().showNotification(t(`Requests.Folders.${key}`), NotifType.Error)
    }

    const { data, status, error } = await useAxios({
        url: paths.api.folder.showInFiles + `?path=${encodeURIComponent(path)}`,
        method: 'GET',
    })

    if (status === 501) return fail(data?.error === 'not_mapped' ? 'NotMapped' : 'NotConfigured')
    if (status === 403) return fail('NotAllowed')
    if (status === 404) return fail('NotFound')

    if (error || !data?.url_template || !data?.path) {
        if (error) console.error(error)
        return fail('OpenError')
    }

    const url = buildFilesUrl(data.url_template, data.path)

    if (tab) {
        tab.location.href = url
    } else {
        window.open(url, '_blank')
    }
}

export async function getTracksInPath(path: string) {
    const { data, error } = await useAxios({
        url: paths.api.folder.base + '/tracks/all' + `?path=${path}`,
        method: 'GET',
    })

    if (error) {
        console.error(error)
    }

    if (data) {
        return data.tracks as Track[]
    }

    return <Track[]>[]
}
