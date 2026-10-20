<template>
    <Teleport to="body">
        <div class="modal rename-dialog" :class="rootClass">
            <div class="bg" @click="close"></div>
            <div class="m-content rounded">
                <div class="heading">{{ $t(`${prefix}.EditName`) }}</div>

                <!-- what changes with the step; it scrolls inside the window, the buttons stay in sight -->
                <div class="rd-scroll">
                    <!-- step 1: the new name -->
                    <template v-if="step === 'name'">
                        <label class="field">
                            <span>{{ $t(`${prefix}.NewName`) }}</span>
                            <input
                                ref="input"
                                v-model="name"
                                type="text"
                                :disabled="busy"
                                @keydown.enter="runPreview"
                                @keydown.esc="close"
                            />
                        </label>
                        <slot name="hint"></slot>
                        <div v-if="error" class="error">{{ error }}</div>
                    </template>

                    <!-- step 2: the preview (what is in it depends on what is renamed) -->
                    <template v-else-if="step === 'preview' && preview">
                        <slot name="preview" :preview="preview"></slot>
                    </template>

                    <!-- step 3: progress and result -->
                    <template v-else-if="step === 'progress'">
                        <div class="progress-text">
                            {{ status?.finished ? '' : $t(`${prefix}.Running`) }}
                            {{ $t(`${prefix}.Progress`, { done: status?.done ?? 0, total: status?.total ?? 0 }) }}
                        </div>
                        <div class="bar"><div class="fill" :style="{ width: percent + '%' }"></div></div>
                        <div v-if="failures.length" class="failures">
                            <div class="warn">{{ $t(`${prefix}.Failed`) }}</div>
                            <ul>
                                <li v-for="[path, message] in failures" :key="path">
                                    <span class="path">{{ path }}</span><br />{{ message }}
                                </li>
                            </ul>
                        </div>
                    </template>
                </div>

                <div v-if="step === 'name'" class="buttons">
                    <button :disabled="busy" @click="close">{{ $t('ConfirmModal.Cancel') }}</button>
                    <button :disabled="busy || !name.trim() || name.trim() === current" @click="runPreview">
                        {{ $t(`${prefix}.Preview`) }}
                    </button>
                </div>
                <div v-else-if="step === 'preview' && preview" class="buttons">
                    <button @click="step = 'name'">{{ $t(`${prefix}.BackToName`) }}</button>
                    <button class="go" :disabled="!preview.files_to_rewrite" @click="runRename">
                        {{ $t(`${prefix}.RenameFiles`, { count: preview.files_to_rewrite }) }}
                    </button>
                </div>
                <div v-else-if="step === 'progress' && status?.finished" class="buttons">
                    <button @click="close">{{ $t(`${prefix}.Close`) }}</button>
                    <button class="go" @click="go">{{ $t(`${prefix}.${goKey}`) }}</button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
/**
 * The window to rename something in all its files (an artist, an album): the new name, the
 * preview, the progress and the result. What the preview shows and where "go to" leads are
 * up to the one that uses it (`RenameArtistDialog.vue`, `RenameAlbumDialog.vue`).
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

import { useT } from '@/i18n'
import { RenameJobStatus } from '@/requests/rename'
import { NotifType, useToast } from '@/stores/notification'

const props = defineProps<{
    // the start of the keys of the texts, for example `ArtistView.RenameArtist`
    prefix: string
    // the class of the window, for the styles of what each one shows in the preview
    rootClass: string
    // what is renamed has this name now (the same name is not a rename)
    current: string
    // the key (after the prefix) of the button that leads to the renamed thing
    goKey: string
    preview: (text: string) => Promise<any>
    start: (text: string) => Promise<{ ok: boolean } | { error: string }>
    getStatus: () => Promise<RenameJobStatus | null>
    // the name the preview says will be written
    textOf: (preview: any) => string
}>()

const emit = defineEmits<{
    (e: 'close'): void
    // the job finished: the status says where to go
    (e: 'go', status: RenameJobStatus | null): void
}>()

const { t } = useT()
const name = ref(props.current)
const step = ref<'name' | 'preview' | 'progress'>('name')
const busy = ref(false)
const error = ref('')
const preview = ref<any>(null)
const status = ref<RenameJobStatus | null>(null)
const input = ref<HTMLInputElement | null>(null)
let timer: number | undefined

const percent = computed(() => {
    const s = status.value
    return s && s.total ? Math.round((s.done / s.total) * 100) : 0
})

const failures = computed(() => Object.entries(status.value?.result?.files_failed ?? status.value?.errors ?? {}))

onMounted(async () => {
    await nextTick()
    input.value?.focus()
    input.value?.select()
})

onBeforeUnmount(() => window.clearInterval(timer))

function close() {
    // the job goes on in the server; closing only hides the window
    if (busy.value) return
    emit('close')
}

async function runPreview() {
    if (busy.value || !name.value.trim()) return

    busy.value = true
    error.value = ''
    const result = await props.preview(name.value.trim())
    busy.value = false

    if ('error' in result) {
        error.value = result.error
        return
    }

    preview.value = result
    step.value = 'preview'
}

async function runRename() {
    if (!preview.value) return

    const result = await props.start(props.textOf(preview.value))

    if ('error' in result) {
        useToast().showNotification(result.error || t(`${props.prefix}.Error`), NotifType.Error)
        return
    }

    step.value = 'progress'
    busy.value = true
    timer = window.setInterval(poll, 700)
    poll()
}

async function poll() {
    const current = await props.getStatus()

    if (!current) return

    status.value = current

    if (!current.finished) return

    window.clearInterval(timer)
    busy.value = false

    const toast = useToast()
    const result = current.result

    if (result?.error) {
        toast.showNotification(`${t(`${props.prefix}.Error`)}: ${result.error}`, NotifType.Error)
        return
    }

    const failed = Object.keys(result?.files_failed ?? {}).length
    toast.showNotification(
        failed
            ? t(`${props.prefix}.DonePartial`, { ok: result?.files_ok ?? 0, failed })
            : t(`${props.prefix}.Done`, { count: result?.files_ok ?? 0 }),
        failed ? NotifType.Error : NotifType.Success
    )

    // all went well: straight to the renamed thing; with failures the list stays on screen
    if (!failed) go()
}

function go() {
    emit('go', status.value)
}
</script>

<style lang="scss">
.rename-dialog {
    z-index: 30;
    // the window is teleported to the end of the body: without these it sits where it would be
    // in the flow, under the app, and out of the screen
    top: 0;
    left: 0;

    .m-content {
        max-width: 42rem;
        max-height: calc(100% - 4rem);
        display: flex;
        flex-direction: column;
        overflow: hidden;

        @include allPhones {
            max-height: calc(100% - 2rem);
        }
    }

    // the part that scrolls when the content is taller than the window
    .rd-scroll {
        min-height: 0;
        overflow: auto;
    }

    .heading {
        font-weight: 600;
        margin-bottom: 1rem;
    }

    .field {
        display: grid;
        gap: $small;

        span {
            font-size: small;
            opacity: 0.8;
        }

        input {
            width: 100%;
            padding: 0.75rem 1rem;
            border: none;
            border-radius: $small;
            background-color: $gray5;
            color: #fff;
            outline: none;
        }
    }

    .error {
        margin-top: 1rem;
        color: $red;
    }

    .summary {
        display: grid;
        gap: $small;

        p {
            margin: 0;
        }

        .warn {
            color: #f5b041;
        }

        .note {
            opacity: 0.7;
            font-size: small;
        }

        ul {
            margin: $smaller 0 0 1rem;
            font-size: small;
        }
    }

    .samples {
        margin-top: 1rem;
        display: grid;
        gap: $small;
        max-height: 14rem;
        overflow: auto;

        .samples-title {
            font-size: small;
            font-weight: 600;
            opacity: 0.8;
        }

        .sample {
            padding: $small;
            border-radius: $small;
            background-color: $gray5;
            font-size: small;

            .sample-title {
                font-weight: 600;
            }

            em {
                opacity: 0.6;
                margin-right: $smaller;
                font-style: normal;
            }
        }
    }

    .bar {
        margin: 1rem 0;
        height: 0.5rem;
        border-radius: 1rem;
        background-color: $gray5;
        overflow: hidden;

        .fill {
            height: 100%;
            background-color: $white;
            transition: width 0.3s ease;
        }
    }

    .failures {
        font-size: small;
        max-height: 12rem;
        overflow: auto;

        .warn {
            color: #f5b041;
            margin-bottom: $small;
        }

        .path {
            opacity: 0.7;
            word-break: break-all;
        }
    }

    .buttons {
        flex-shrink: 0;
        margin-top: 1.5rem;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }
}
</style>
