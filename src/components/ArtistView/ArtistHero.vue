<template>
    <section
        ref="root"
        class="artist-hero"
        :class="{ editing }"
        @pointerdown="onDown"
        @pointermove="onMove"
        @pointerup="onUp"
        @pointercancel="onUp"
    >
        <!-- the checkerboard is the background; the image goes over it (cut by `object-fit: cover` around the focus point) -->
        <div class="hero-image" aria-hidden="true">
            <img
                v-if="imageSrc"
                ref="img"
                class="hero-img"
                :src="imageSrc"
                :srcset="imageSrcset"
                sizes="100vw"
                alt=""
                draggable="false"
                :style="{ objectPosition: `${focus.x}% ${focus.y}%` }"
                @load="onImageLoad"
            />
        </div>
        <div class="hero-shade" aria-hidden="true"></div>

        <!-- the hero is placed here: drag the image, then save -->
        <div v-if="editing" class="hero-edit-ui">
            <p class="hero-edit-hint">{{ $t('ArtistView.RepositionHint') }}</p>
            <div class="hero-edit-actions">
                <button class="hero-text-btn primary" :disabled="saving" @click="save">
                    {{ $t('ArtistView.Save') }}
                </button>
                <button class="hero-text-btn" :disabled="saving" @click="endEdit">
                    {{ $t('ConfirmModal.Cancel') }}
                </button>
                <button v-if="artist.hero" class="hero-text-btn" :disabled="saving" @click="remove">
                    {{ $t('ArtistView.RemoveHero') }}
                </button>
            </div>
        </div>
        <button v-else-if="canEdit && artist.hero" class="hero-text-btn hero-reposition" @click="startEdit()">
            {{ $t('ArtistView.Reposition') }}
        </button>

        <div class="hero-content">
            <h1 class="hero-name" :title="artist.name">{{ artist.name }}</h1>
            <InfoLine class="hero-infos" :items="infos" />
            <div class="hero-buttons">
                <button
                    class="hero-btn hero-play"
                    :class="{ 'is-pause': isPlaying }"
                    :title="isPlaying ? $t('BottomBar.Pause') : $t('BottomBar.Play')"
                    :aria-label="isPlaying ? $t('BottomBar.Pause') : $t('BottomBar.Play')"
                    @click="togglePlay"
                >
                    <PauseSvg v-if="isPlaying" />
                    <PlaySvg v-else />
                </button>
                <button
                    class="hero-btn hero-fav"
                    :class="{ favorited: artist.is_favorite }"
                    :title="$t('BottomBar.Favorite')"
                    :aria-label="$t('BottomBar.Favorite')"
                    :aria-pressed="!!artist.is_favorite"
                    @click="handleFav"
                >
                    <FavoriteSvg :class="{ 'icon-active': artist.is_favorite }" />
                </button>
                <button
                    class="hero-btn hero-options"
                    :class="{ 'context-open': contextOpen }"
                    :aria-label="$t('ArtistView.Options')"
                    @click="showContext"
                >
                    <OptionsSvg />
                </button>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import FavoriteSvg from '@/assets/icons/figma/favorite.svg'
import OptionsSvg from '@/assets/icons/figma/options.svg'
import PauseSvg from '@/assets/icons/figma/pause.svg'
import PlaySvg from '@/assets/icons/figma/play.svg'
import { paths } from '@/config'
import { FromOptions, favType } from '@/enums'
import { showArtistContextMenu } from '@/helpers/contextMenuHandler'
import favoriteHandler from '@/helpers/favoriteHandler'
import { utilPlayFromArtist } from '@/helpers/usePlayFrom'
import { useT } from '@/i18n'
import { deleteArtistHero, setArtistHeroPosition, uploadArtistHero } from '@/requests/artists'
import useArtistEdit from '@/stores/artistedit'
import useAuth from '@/stores/auth'
import { askConfirm } from '@/stores/confirm'
import { NotifType, useToast } from '@/stores/notification'
import useArtistPageStore from '@/stores/pages/artist'
import useQueue from '@/stores/queue'
import useTracklist from '@/stores/queue/tracklist'
import formatSeconds from '@/utils/useFormatSeconds'

import InfoLine from '@/components/shared/InfoLine.vue'

// ArtistHero of the Figma (node 12452:2138): the image with a gradient, and at the bottom left the name, the numbers
// and the buttons (play or pause, favorite, options). The play plays "Most played tracks" in order.
// The image is the hero chosen by hand ("Update artist's hero"): it is never stretched, `object-fit: cover` cuts it
// around a focus point (x and y, percent) that the admin sets by dragging, so the same part stays in view at any width.
const { t } = useT()
const store = useArtistPageStore()
const queue = useQueue()
const tracklist = useTracklist()
const artistEdit = useArtistEdit()

const artist = computed(() => store.info)
const contextOpen = ref(false)

// "120 tracks • 12 albums • 8 hours": only the numbers the artist has (the words in lowercase, as in the Figma)
const infos = computed(() => {
    const { trackcount, albumcount, duration } = store.info
    const list: string[] = []

    if (trackcount) list.push(`${trackcount.toLocaleString()} ${t('Common.Track', trackcount).toLowerCase()}`)
    if (albumcount) list.push(`${albumcount.toLocaleString()} ${t('Common.Album', albumcount).toLowerCase()}`)
    if (duration) list.push(formatSeconds(duration, true))

    return list
})
const canEdit = computed(() => useAuth().is_admin)

// the queue is the one of this artist (it was started from the page, a card or this button)
const isThisArtist = computed(() => {
    const from = tracklist.from as { type?: FromOptions; artisthash?: string }
    return from?.type === FromOptions.artist && from.artisthash === store.info.artisthash
})
const isPlaying = computed(() => isThisArtist.value && queue.playing)

function togglePlay() {
    if (isThisArtist.value) return queue.playPause()
    utilPlayFromArtist(0)
}

function handleFav() {
    favoriteHandler(store.info.is_favorite, favType.artist, store.info.artisthash, store.makeFavorite, store.removeFavorite)
}

function showContext(e: MouseEvent) {
    showArtistContextMenu(e, contextOpen, store.info.artisthash, store.info.name)
}

// SECTION: the image
const root = ref<HTMLElement | null>(null)
const img = ref<HTMLImageElement | null>(null)
const editing = ref(false)
const saving = ref(false)
// a new image chosen in the menu (it is only sent when saving) and its address in the browser
const draftFile = ref<File | null>(null)
const draftUrl = ref('')
const focus = ref({ x: 50, y: 50 })
const natural = ref({ w: 0, h: 0 })

const savedUrl = (folder: string) =>
    store.info.hero ? `${folder}${store.info.hero.image}?v=${store.info.hero.version}` : ''

const imageSrc = computed(() => draftUrl.value || savedUrl(paths.images.artist.hero))
// the small one for narrow screens and the big one for wide ones; the new image (not saved yet) is one file
const imageSrcset = computed(() =>
    draftUrl.value || !store.info.hero
        ? undefined
        : `${savedUrl(paths.images.artist.heroSmall)} 1280w, ${savedUrl(paths.images.artist.hero)} 2560w`
)

// not editing: the focus point is the saved one
watch(
    () => store.info.hero,
    hero => {
        if (!editing.value) focus.value = { x: hero?.x ?? 50, y: hero?.y ?? 50 }
    },
    { immediate: true }
)

function onImageLoad() {
    if (!img.value) return
    natural.value = { w: img.value.naturalWidth, h: img.value.naturalHeight }
}

// SECTION: placing the image
function startEdit(file?: File) {
    focus.value = { x: store.info.hero?.x ?? 50, y: store.info.hero?.y ?? 50 }

    if (file) {
        clearDraft()
        draftFile.value = file
        draftUrl.value = URL.createObjectURL(file)
        focus.value = { x: 50, y: 50 }
    }

    editing.value = true
}

function clearDraft() {
    if (draftUrl.value) URL.revokeObjectURL(draftUrl.value)
    draftFile.value = null
    draftUrl.value = ''
}

function endEdit() {
    editing.value = false
    clearDraft()
    focus.value = { x: store.info.hero?.x ?? 50, y: store.info.hero?.y ?? 50 }
}

// dragging: with `cover` the image is bigger than the frame in one direction; moving it by some pixels moves the
// focus point by those pixels in percent of what overflows (the image goes with the pointer)
let drag: { x: number; y: number; fx: number; fy: number } | null = null

function onDown(e: PointerEvent) {
    if (!editing.value || e.button > 0) return
    if ((e.target as HTMLElement).closest('button, .hero-edit-ui')) return

    drag = { x: e.clientX, y: e.clientY, fx: focus.value.x, fy: focus.value.y }
    root.value?.setPointerCapture(e.pointerId)
}

function onMove(e: PointerEvent) {
    if (!drag || !root.value || !natural.value.w) return

    const frame = root.value.getBoundingClientRect()
    const scale = Math.max(frame.width / natural.value.w, frame.height / natural.value.h)
    const overflowX = natural.value.w * scale - frame.width
    const overflowY = natural.value.h * scale - frame.height
    const limit = (value: number) => Math.round(Math.min(Math.max(value, 0), 100) * 100) / 100

    focus.value = {
        x: overflowX > 1 ? limit(drag.fx - ((e.clientX - drag.x) / overflowX) * 100) : focus.value.x,
        y: overflowY > 1 ? limit(drag.fy - ((e.clientY - drag.y) / overflowY) * 100) : focus.value.y,
    }
}

function onUp() {
    drag = null
}

async function save() {
    const hash = store.info.artisthash
    const toast = useToast()

    saving.value = true
    const result = draftFile.value
        ? await uploadArtistHero(hash, draftFile.value, focus.value)
        : await setArtistHeroPosition(hash, focus.value)
    saving.value = false

    if ('error' in result) {
        toast.showNotification(result.error, NotifType.Error)
        return
    }

    store.setHero(result.hero)
    endEdit()
    toast.showNotification(t('ArtistView.HeroUpdated'), NotifType.Success)
}

async function remove() {
    const yes = await askConfirm(t('ArtistView.ConfirmRemoveHero'), t('ArtistView.RemoveHero'))
    if (!yes) return

    const toast = useToast()
    saving.value = true
    const result = await deleteArtistHero(store.info.artisthash)
    saving.value = false

    if ('error' in result) {
        toast.showNotification(result.error, NotifType.Error)
        return
    }

    store.setHero(result.hero)
    endEdit()
    toast.showNotification(t('ArtistView.HeroRemoved'), NotifType.Success)
}

// a hero chosen in the menu (from this page or from another one) comes here to be placed
function takeDraft() {
    const file = artistEdit.takeHeroDraft(store.info.artisthash)
    if (file) startEdit(file)
}

onMounted(takeDraft)
watch(() => artistEdit.heroDraft, takeDraft)
// another artist: what was being placed is dropped
watch(
    () => store.info.artisthash,
    () => {
        if (editing.value) endEdit()
    }
)
onBeforeUnmount(clearDraft)
</script>

<style lang="scss">
.artist-hero {
    // the height follows the width of the panel (3.3 : 1, the 1319 x 400 of the Figma) between 280 and 400px; it is set on
    // .artist-panel (--artist-hero-height) because the sticky tab bar needs the same number
    position: relative;
    box-sizing: border-box;
    display: flex;
    align-items: flex-end;
    justify-content: flex-start;
    height: var(--artist-hero-height);
    padding: var(--artist-hero-padding);
    overflow: hidden;
    color: var(--artist-hero-color);

    .hero-image {
        position: absolute;
        inset: 0;
        // 16px squares, neutral-900 and neutral-700 (the placeholder while there is no image)
        background-color: var(--artist-hero-check-a);
        background-image: conic-gradient(
            var(--artist-hero-check-b) 25%,
            var(--artist-hero-check-a) 0 50%,
            var(--artist-hero-check-b) 0 75%,
            var(--artist-hero-check-a) 0
        );
        background-size: calc(var(--artist-hero-check-size) * 2) calc(var(--artist-hero-check-size) * 2);
    }

    // never stretched or squeezed: cut around the focus point
    .hero-img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
        -webkit-user-drag: none;
    }

    .hero-shade {
        position: absolute;
        inset: 0;
        background-image: linear-gradient(to bottom, transparent, var(--artist-hero-gradient-end));
        pointer-events: none;
    }

    .hero-content {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: var(--artist-hero-text-gap);
        min-width: 0;
        max-width: 100%;
    }

    // placing the image: it is dragged with the mouse or a finger
    &.editing {
        cursor: grab;
        user-select: none;
        touch-action: none;

        &:active {
            cursor: grabbing;
        }

        .hero-content {
            pointer-events: none;
        }
    }

    .hero-name {
        @include text('screen-title-48px');
        max-width: 100%;
        margin: 0;
        color: var(--artist-hero-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    // the line itself is components/shared/InfoLine.vue; the buttons are in assets/scss/Global/panels.scss
    .hero-infos {
        padding-bottom: var(--artist-hero-text-gap);
        color: var(--artist-hero-color);
    }

    // the buttons with text over the image: transparent, a 1px white border, white text, radius 8, action-button-14px.
    // Their place and padding are not in the Figma (decision: top right, 12px from the edges, padding 6 12)
    .hero-text-btn {
        @include text('action-button-14px');
        font-size: var(--text-action-button-14px-size) !important; // the global `button` sets one with !important
        height: auto;
        padding: var(--artist-hero-reposition-padding);
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

    // it shows on the hover of the hero (and with the keyboard on it), with a fade; on touch screens it is always there
    .hero-reposition {
        position: absolute;
        top: var(--artist-hero-reposition-offset);
        right: var(--artist-hero-reposition-offset);
        opacity: 0;
        pointer-events: none;
        transition: opacity var(--artist-hero-reposition-fade) ease-out;
    }

    &:hover .hero-reposition,
    &:focus-within .hero-reposition {
        opacity: 1;
        pointer-events: auto;
    }

    @media (hover: none) {
        .hero-reposition {
            opacity: 1;
            pointer-events: auto;
        }
    }

    // the line of help (to the left) and the buttons (to the right), on the top of the hero
    .hero-edit-ui {
        position: absolute;
        top: var(--artist-hero-reposition-offset);
        left: var(--artist-hero-reposition-offset);
        right: var(--artist-hero-reposition-offset);
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--artist-hero-reposition-offset);
        cursor: default;
    }

    .hero-edit-hint {
        @include text('paragraph-14px');
        margin: 0;
        padding: var(--artist-hero-reposition-padding);
        border-radius: var(--layout-panel-radius);
        background-color: var(--color-neutral-900);
        color: var(--color-neutral-white);
    }

    .hero-edit-actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--artist-hero-buttons-gap);
        margin-left: auto;
    }
}
</style>
