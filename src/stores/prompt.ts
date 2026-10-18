import { defineStore } from 'pinia'

type PromptRun = (value: string) => Promise<boolean>

let runner: PromptRun | null = null

/**
 * A text field on top of the page with Save and Cancel. `run` gets the text and says
 * whether it worked: the dialog stays open (and shows nothing more) when it did not,
 * so the caller can show the error.
 */
export const usePromptStore = defineStore('prompt', {
    state: () => ({
        visible: false,
        title: '',
        value: '',
        saveLabel: '',
        busy: false,
    }),
    actions: {
        open(opts: { title: string; value: string; saveLabel: string; run: PromptRun }) {
            this.title = opts.title
            this.value = opts.value
            this.saveLabel = opts.saveLabel
            this.busy = false
            runner = opts.run
            this.visible = true
        },
        async save() {
            if (this.busy || !runner) return

            this.busy = true
            let ok = false

            try {
                ok = await runner(this.value)
            } finally {
                this.busy = false
            }

            if (ok) this.close()
        },
        close() {
            if (this.busy) return
            this.visible = false
            runner = null
        },
    },
})

export function askText(title: string, value: string, saveLabel: string, run: PromptRun) {
    usePromptStore().open({ title, value, saveLabel, run })
}
