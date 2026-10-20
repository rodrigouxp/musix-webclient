import useAxios from './useAxios'

/**
 * What the renames of an artist and of an album share: the progress of the job that runs
 * in the server (see `RenameDialog.vue`).
 */
export interface RenameJobStatus {
    running: boolean
    done: number
    total: number
    current: string | null
    errors: { [filepath: string]: string }
    finished: boolean
    result: {
        error?: string
        files_ok?: number
        files_failed?: { [filepath: string]: string }
    } | null
}

/**
 * POSTs a rename request (a preview or the rename itself).
 * On failure returns `{ error }` with the message of the server.
 */
export async function postRename<T>(url: string, body: object): Promise<T | { error: string }> {
    const { data, error } = await useAxios({
        method: 'POST',
        url,
        props: body as any,
    })

    return error ? { error: (data?.error as string) || error } : (data as T)
}

/**
 * The progress of the rename that is running (or the last one), or `null` when the
 * request failed.
 */
export async function getRenameStatus<T extends RenameJobStatus>(url: string): Promise<T | null> {
    const { data, error } = await useAxios({
        method: 'GET',
        url,
    })

    return error ? null : (data as T)
}
