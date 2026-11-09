<template>
    <Teleport to="body">
        <div class="modal artist-thumb-dialog">
            <div class="bg" @click="close"></div>
            <div class="m-content rounded" role="dialog" aria-modal="true" @keydown.esc="close">
                <div class="heading">{{ $t('Menus.Artist.UpdateThumbnail') }}</div>

                <!-- the photo (the current one, or the one chosen) and, over a chosen one, the square that becomes the round photo -->
                <div class="at-stage-wrap">
                    <div
                        ref="stage"
                        class="at-stage"
                        :class="{ picking: !!file }"
                        @pointerdown="onDown"
                        @pointermove="onMove"
                        @pointerup="onUp"
                        @pointercancel="onUp"
                    >
                        <img ref="img" :src="src" alt="" draggable="false" @load="onLoad" />
                        <div v-if="file" class="crop-box" :style="boxStyle"></div>
                    </div>
                </div>

                <p v-if="file" class="at-hint">{{ $t('ArtistView.ThumbnailHint') }}</p>
                <p v-if="error" class="at-error">{{ error }}</p>

                <template v-if="askingRefetch">
                    <p class="at-warn">{{ $t('ArtistView.RefetchPhotoWarning') }}</p>
                    <div class="at-actions">
                        <button class="at-btn primary" :disabled="busy" @click="refetch">
                            {{ $t('ArtistView.RefetchPhotoConfirm') }}
                        </button>
                        <button class="at-btn" :disabled="busy" @click="askingRefetch = false">
                            {{ $t('ConfirmModal.Cancel') }}
                        </button>
                    </div>
                </template>
                <div v-else class="at-actions">
                    <button v-if="file" class="at-btn primary" :disabled="busy" @click="save">
                        {{ $t('ArtistView.Save') }}
                    </button>
                    <button class="at-btn" :disabled="busy" @click="choose">{{ $t('ArtistView.UploadPhoto') }}</button>
                    <button class="at-btn" :disabled="busy" @click="askingRefetch = true">
                        {{ $t('ArtistView.RefetchPhoto') }}
                    </button>
                    <button class="at-btn" :disabled="busy" @click="close">{{ $t('ConfirmModal.Cancel') }}</button>
                </div>
                <input ref="input" type="file" accept="image/jpeg,image/png,image/webp" hidden @change="onFile" />
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'

import { paths } from '@/config'
import { useT } from '@/i18n'
import { refetchArtistImage, uploadArtistImage } from '@/requests/artists'
import { NotifType, useToast } from '@/stores/notification'
import useArtistPageStore from '@/stores/pages/artist'

// "Update artist's thumbnail": the photo that becomes the round one. A new photo is chosen from the computer and the
// square that is cut from it is dragged to the part that matters; "Fetch automatic photo again" is here too.
const props = defineProps<{
    artisthash: string
    name: string
}>()

const emit = defineEmits<{
    (e: 'close'): void
}>()

const { t } = useT()
const store = useArtistPageStore()

const input = ref<HTMLInputElement | null>(null)
const img = ref<HTMLImageElement | null>(null)
const file = ref<File | null>(null)
const previewUrl = ref('')
const busy = ref(false)
const error = ref('')
const askingRefetch = ref(false)

// the size of the photo on the screen and the square (a side, and where its top left corner is), all in px
const shown = ref({ w: 0, h: 0 })
const box = ref({ left: 0, top: 0 })

const src = computed(
    () => previewUrl.value || `${paths.images.artist.large}${props.artisthash}.webp?v=${store.photoVersion || 0}`
)

const side = computed(() => Math.min(shown.value.w, shown.value.h))

const boxStyle = computed(() => ({
    width: `${side.value}px`,
    height: `${side.value}px`,
    transform: `translate(${box.value.left}px, ${box.value.top}px)`,
}))

// the center of the square, in percent of the photo: what the server takes to cut it
const focus = computed(() => ({
    x: shown.value.w ? round(((box.value.left + side.value / 2) / shown.value.w) * 100) : 50,
    y: shown.value.h ? round(((box.value.top + side.value / 2) / shown.value.h) * 100) : 50,
}))

function round(value: number) {
    return Math.round(value * 100) / 100
}

function onLoad() {
    if (!img.value) return

    shown.value = { w: img.value.clientWidth, h: img.value.clientHeight }
    // starts at the center, as the server does without a point
    box.value = {
        left: (shown.value.w - side.value) / 2,
        top: (shown.value.h - side.value) / 2,
    }
}

// dragging the square (it only moves along the longer side of the photo)
let drag: { x: number; y: number; left: number; top: number } | null = null

function onDown(e: PointerEvent) {
    if (!file.value) return

    drag = { x: e.clientX, y: e.clientY, left: box.value.left, top: box.value.top }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}

function onMove(e: PointerEvent) {
    if (!drag) return

    box.value = {
        left: clamp(drag.left + e.clientX - drag.x, shown.value.w - side.value),
        top: clamp(drag.top + e.clientY - drag.y, shown.value.h - side.value),
    }
}

function onUp() {
    drag = null
}

function clamp(value: number, max: number) {
    return Math.min(Math.max(value, 0), Math.max(max, 0))
}

function choose() {
    input.value?.click()
}

function onFile(e: Event) {
    const chosen = (e.target as HTMLInputElement).files?.[0]
    ;(e.target as HTMLInputElement).value = ''

    if (!chosen) return

    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)

    file.value = chosen
    previewUrl.value = URL.createObjectURL(chosen)
    error.value = ''
}

// the browser keeps the old photo in its cache under the same address: ask for the three sizes again
function refreshImages() {
    const image = `${props.artisthash}.webp`

    return Promise.all(
        [paths.images.artist.large, paths.images.artist.medium, paths.images.artist.small].map(base =>
            fetch(base + image, { cache: 'reload' }).catch(() => null)
        )
    )
}

async function finish(message: string) {
    await refreshImages()

    if (store.info.artisthash === props.artisthash) store.bumpPhoto()

    useToast().showNotification(message, NotifType.Success)
    close()
}

async function save() {
    if (!file.value) return

    busy.value = true
    error.value = ''
    const result = await uploadArtistImage(props.artisthash, file.value, focus.value)
    busy.value = false

    if ('error' in result) {
        error.value = result.error
        return
    }

    await finish(t('ArtistView.PhotoUpdated'))
}

async function refetch() {
    busy.value = true
    error.value = ''
    const result = await refetchArtistImage(props.artisthash)
    busy.value = false

    if ('error' in result) {
        askingRefetch.value = false
        error.value = result.error
        return
    }

    await finish(t('ArtistView.PhotoRefetched'))
}

function close() {
    if (busy.value) return
    emit('close')
}

onBeforeUnmount(() => {
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})
</script>

<style lang="scss">
.artist-thumb-dialog {
    z-index: 30;
    // the window is teleported to the end of the body (as the rename one)
    top: 0;
    left: 0;

    .m-content {
        max-width: 36rem;
        max-height: calc(100% - 4rem);
        display: flex;
        flex-direction: column;
        gap: 1rem;
        overflow: auto;
    }

    .heading {
        font-weight: 600;
    }

    .at-stage-wrap {
        display: grid;
        place-items: center;
    }

    // the photo and the square sit in a box as big as the photo
    .at-stage {
        position: relative;
        display: inline-block;
        overflow: hidden;
        line-height: 0;
        border-radius: var(--layout-panel-radius);
        user-select: none;
        touch-action: none;

        img {
            display: block;
            max-width: 100%;
            max-height: 50vh;
            -webkit-user-drag: none;
        }

        &.picking {
            cursor: grab;
        }

        &.picking:active {
            cursor: grabbing;
        }
    }

    // the square that becomes the round photo: the rest is dimmed; the circle shows what the round photo keeps
    .crop-box {
        position: absolute;
        top: 0;
        left: 0;
        box-sizing: border-box;
        border: 2px solid var(--color-neutral-white);
        box-shadow: 0 0 0 100vmax color-mix(in srgb, var(--color-background) 60%, transparent);
        pointer-events: none;

        &::after {
            content: '';
            position: absolute;
            inset: 0;
            border: 1px solid var(--color-neutral-white);
            border-radius: 50%;
        }
    }

    .at-hint,
    .at-warn,
    .at-error {
        @include text('paragraph-14px');
        margin: 0;
    }

    .at-hint {
        color: var(--color-neutral-300);
    }

    .at-error {
        color: var(--color-error-300);
    }

    .at-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
    }

    .at-btn {
        @include text('action-button-14px');
        font-size: var(--text-action-button-14px-size) !important; // the global `button` sets one with !important
        height: auto;
        padding: 6px 12px;
        border: 1px solid var(--color-neutral-white);
        border-radius: var(--layout-panel-radius);
        background: transparent;
        color: var(--color-neutral-white);
        cursor: pointer;

        &.primary {
            background-color: var(--color-neutral-white);
            color: var(--color-background);
        }

        &:disabled {
            opacity: 0.5;
            cursor: default;
        }
    }
}
</style>
