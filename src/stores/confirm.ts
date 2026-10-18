import { defineStore } from 'pinia'

let resolver: ((answer: boolean) => void) | null = null

/**
 * A yes/no question on top of the page. Use `askConfirm`, which gives the answer as a promise.
 */
export const useConfirmStore = defineStore('confirm', {
    state: () => ({
        visible: false,
        text: '',
        confirmLabel: '',
    }),
    actions: {
        ask(text: string, confirmLabel: string): Promise<boolean> {
            // a question that is still open counts as "no"
            resolver?.(false)

            this.text = text
            this.confirmLabel = confirmLabel
            this.visible = true

            return new Promise(resolve => {
                resolver = resolve
            })
        },
        answer(answer: boolean) {
            this.visible = false
            resolver?.(answer)
            resolver = null
        },
    },
})

export function askConfirm(text: string, confirmLabel: string): Promise<boolean> {
    return useConfirmStore().ask(text, confirmLabel)
}
