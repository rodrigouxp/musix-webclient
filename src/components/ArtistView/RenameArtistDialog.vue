<template>
    <Teleport to="body">
        <div class="modal renameartist">
            <div class="bg" @click="close"></div>
            <div class="m-content rounded">
                <div class="heading">{{ $t('ArtistView.RenameArtist.EditName') }}</div>

                <!-- step 1: the new name -->
                <template v-if="step === 'name'">
                    <label class="field">
                        <span>{{ $t('ArtistView.RenameArtist.NewName') }}</span>
                        <input
                            ref="input"
                            v-model="name"
                            type="text"
                            :disabled="busy"
                            @keydown.enter="runPreview"
                            @keydown.esc="close"
                        />
                    </label>
                    <div v-if="error" class="error">{{ error }}</div>
                    <div class="buttons">
                        <button :disabled="busy" @click="close">{{ $t('ConfirmModal.Cancel') }}</button>
                        <button :disabled="busy || !name.trim() || name.trim() === artistName" @click="runPreview">
                            {{ $t('ArtistView.RenameArtist.Preview') }}
                        </button>
                    </div>
                </template>

                <!-- step 2: the preview -->
                <template v-else-if="step === 'preview' && preview">
                    <div class="summary">
                        <p>
                            <b>{{ artistName }}</b> &rarr; <b>{{ preview.new_name }}</b>
                        </p>
                        <p>
                            {{
                                $t('ArtistView.RenameArtist.Summary', {
                                    tracks: preview.tracks_in_artist_tag,
                                    albums: preview.albums_in_artist_tag,
                                })
                            }}
                        </p>
                        <p v-if="preview.tracks_as_participant">
                            {{ $t('ArtistView.RenameArtist.SummaryParticipant', { count: preview.tracks_as_participant }) }}
                        </p>
                        <p v-if="preview.tracks_title_only">
                            {{ $t('ArtistView.RenameArtist.SummaryTitle', { count: preview.tracks_title_only }) }}
                        </p>
                        <p v-if="preview.files_to_rename">
                            {{ $t('ArtistView.RenameArtist.SummaryRename', { count: preview.files_to_rename }) }}
                        </p>
                        <p v-if="preview.merge" class="warn">
                            {{
                                $t('ArtistView.RenameArtist.Merge', {
                                    name: preview.merge.name,
                                    count: preview.merge.trackcount,
                                })
                            }}
                        </p>
                        <p v-if="preview.unsupported_count" class="warn">
                            {{ $t('ArtistView.RenameArtist.Unsupported', { count: preview.unsupported_count }) }}
                        </p>
                        <p v-if="preview.not_writable_count" class="warn">
                            {{ $t('ArtistView.RenameArtist.NotWritable', { count: preview.not_writable_count }) }}
                        </p>
                        <div v-if="preview.name_conflicts_count" class="warn">
                            {{ $t('ArtistView.RenameArtist.ConflictsWarning') }} ({{ preview.name_conflicts_count }})
                            <ul>
                                <li v-for="c in preview.name_conflicts.slice(0, 5)" :key="c.filepath">{{ c.name }}</li>
                            </ul>
                        </div>
                        <div v-if="preview.same_tag_collapses_count" class="warn">
                            {{ $t('ArtistView.RenameArtist.CollapseWarning') }} ({{ preview.same_tag_collapses_count }})
                            <ul>
                                <li v-for="s in preview.same_tag_collapses.slice(0, 5)" :key="s.filepath">
                                    {{ s.title }}: {{ s.artist_before }} &rarr; {{ s.artist_after }}
                                </li>
                            </ul>
                        </div>
                        <div v-if="preview.no_albumartist_count" class="warn">
                            {{ $t('ArtistView.RenameArtist.NoAlbumArtist') }} ({{ preview.no_albumartist_count }})
                        </div>
                        <p class="note">{{ preview.warning }}</p>
                    </div>

                    <div class="samples">
                        <div class="samples-title">{{ $t('ArtistView.RenameArtist.SamplesTitle') }}</div>
                        <div v-for="s in preview.samples" :key="s.filepath" class="sample" :class="{ participant: s.participant }">
                            <div class="sample-title ellip">
                                {{ s.title }}
                                <span v-if="s.participant" class="badge">{{ $t('ArtistView.RenameArtist.Participant') }}</span>
                            </div>
                            <div class="row"><em>Artist</em> {{ s.artist_before }} &rarr; {{ s.artist_after }}</div>
                            <div class="row">
                                <em>Album artist</em> {{ s.albumartist_before ?? '—' }} &rarr; {{ s.albumartist_after ?? '—' }}
                            </div>
                        </div>
                    </div>

                    <div class="buttons">
                        <button @click="step = 'name'">{{ $t('ArtistView.RenameArtist.BackToName') }}</button>
                        <button class="go" :disabled="!preview.files_to_rewrite" @click="runRename">
                            {{ $t('ArtistView.RenameArtist.RenameFiles', { count: preview.files_to_rewrite }) }}
                        </button>
                    </div>
                </template>

                <!-- step 3: progress and result -->
                <template v-else-if="step === 'progress'">
                    <div class="progress-text">
                        {{ status?.finished ? '' : $t('ArtistView.RenameArtist.Running') }}
                        {{ $t('ArtistView.RenameArtist.Progress', { done: status?.done ?? 0, total: status?.total ?? 0 }) }}
                    </div>
                    <div class="bar"><div class="fill" :style="{ width: percent + '%' }"></div></div>
                    <div v-if="failures.length" class="failures">
                        <div class="warn">{{ $t('ArtistView.RenameArtist.Failed') }}</div>
                        <ul>
                            <li v-for="[path, message] in failures" :key="path">
                                <span class="path">{{ path }}</span><br />{{ message }}
                            </li>
                        </ul>
                    </div>
                    <div v-if="status?.finished" class="buttons">
                        <button @click="close">{{ $t('ArtistView.RenameArtist.Close') }}</button>
                        <button class="go" @click="goToArtist">{{ $t('ArtistView.RenameArtist.GoToArtist') }}</button>
                    </div>
                </template>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

import { useT } from '@/i18n'
import {
    getArtistRenameStatus,
    previewArtistRename,
    RenamePreview,
    RenameStatus,
    startArtistRename,
} from '@/requests/artists'
import { NotifType, useToast } from '@/stores/notification'
import { Routes, router } from '@/router'

const props = defineProps<{ artisthash: string; artistName: string }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const { t } = useT()
const name = ref(props.artistName)
const step = ref<'name' | 'preview' | 'progress'>('name')
const busy = ref(false)
const error = ref('')
const preview = ref<RenamePreview | null>(null)
const status = ref<RenameStatus | null>(null)
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
    const result = await previewArtistRename(props.artisthash, name.value.trim())
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

    const result = await startArtistRename(props.artisthash, preview.value.new_name)

    if ('error' in result) {
        useToast().showNotification(result.error || t('ArtistView.RenameArtist.Error'), NotifType.Error)
        return
    }

    step.value = 'progress'
    busy.value = true
    timer = window.setInterval(poll, 700)
    poll()
}

async function poll() {
    const current = await getArtistRenameStatus()

    if (!current) return

    status.value = current

    if (!current.finished) return

    window.clearInterval(timer)
    busy.value = false

    const toast = useToast()
    const result = current.result

    if (result?.error) {
        toast.showNotification(`${t('ArtistView.RenameArtist.Error')}: ${result.error}`, NotifType.Error)
        return
    }

    const failed = Object.keys(result?.files_failed ?? {}).length
    toast.showNotification(
        failed
            ? t('ArtistView.RenameArtist.DonePartial', { ok: result?.files_ok ?? 0, failed })
            : t('ArtistView.RenameArtist.Done', { count: result?.files_ok ?? 0 }),
        failed ? NotifType.Error : NotifType.Success
    )

    // all went well: straight to the new artist; with failures the list stays on screen
    if (!failed) goToArtist()
}

function goToArtist() {
    const hash = status.value?.new_artisthash

    emit('close')

    if (hash) {
        router.push({ name: Routes.artist, params: { hash } })
    }
}
</script>

<style lang="scss">
.renameartist {
    z-index: 30;

    .m-content {
        max-width: 42rem;
        max-height: calc(100% - 4rem);
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

            &.participant {
                outline: 1px solid #f5b041;
            }

            .sample-title {
                font-weight: 600;
            }

            .badge {
                margin-left: $small;
                font-size: x-small;
                padding: 0 $small;
                border-radius: 1rem;
                background: #f5b041;
                color: #000;
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
        margin-top: 1.5rem;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }
}
</style>
