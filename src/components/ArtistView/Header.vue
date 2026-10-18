<template>
    <div class="headparent">
        <div
            v-if="!on_sidebar"
            class="artist-header-ambient rounded-lg"
            :class="{ isSmallPhone }"
            :style="{
                boxShadow: !useCircularImage ? (colors.bg.length ? `0 .5rem 2rem ${colors.bg}` : undefined) : undefined,
            }"
        ></div>
        <div
            ref="artistheader"
            class="artist-page-header rounded-lg no-scroll"
            :class="{ isSmallPhone, useCircularImage }"
            :style="{
                height: `${isSmallPhone ? '25rem' : containerHeight}`,
            }"
        >
            <Info :artist="artist" :use-circular-image="useCircularImage" :can-rename="canEditPhoto" />
            <div
                class="artist-img no-select"
                :style="{
                    height: containerHeight,
                }"
            >
                <div class="photo-wrap">
                    <img
                        id="artist-avatar"
                        :src="paths.images.artist.large + artist.image + store.photoQuery"
                        @load="store.setBgColor"
                    />
                    <div v-if="canEditPhoto" ref="photoMenuParent" class="photo-edit">
                        <button
                            class="photo-edit-btn"
                            :title="$t('ArtistView.EditPhoto')"
                            :aria-label="$t('ArtistView.EditPhoto')"
                            :disabled="busy"
                            @click="menuOpen = !menuOpen"
                            v-html="EditIcon"
                        ></button>
                        <div v-if="menuOpen" class="photo-menu rounded shadow-sm">
                            <template v-if="!askingRefetch">
                                <button @click="chooseFile">{{ $t('ArtistView.UploadPhoto') }}</button>
                                <button @click="askingRefetch = true">{{ $t('ArtistView.RefetchPhoto') }}</button>
                            </template>
                            <template v-else>
                                <div class="warn">{{ $t('ArtistView.RefetchPhotoWarning') }}</div>
                                <button class="danger" @click="refetchPhoto">{{ $t('ArtistView.RefetchPhotoConfirm') }}</button>
                                <button @click="closeMenu">{{ $t('ConfirmModal.Cancel') }}</button>
                            </template>
                        </div>
                        <input
                            ref="fileInput"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            hidden
                            @change="onFileChosen"
                        />
                    </div>
                </div>
            </div>
            <div
                v-if="!useCircularImage"
                class="gradient"
                :style="{
                    backgroundImage: colors.bg
                        ? `linear-gradient(${gradientDirection}, transparent ${
                              isSmall ? 60 : gradientTransparentWidth - (width < 700 ? 40 : width < 900 ? 20 : 10)
                          }%,
        ${colors.bg} ${gradientWidth}%,
        ${colors.bg} 100%)`
                        : '',
                }"
            ></div>
        </div>
    </div>
</template>

<script setup lang="ts">
import useSettingsStore from '@/stores/settings'
import { useElementSize } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { Ref, computed, onMounted, ref } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { onBeforeRouteUpdate } from 'vue-router'

import { paths } from '@/config'
import { EditIcon } from '@/icons'
import { refetchArtistImage, uploadArtistImage } from '@/requests/artists'
import useAuth from '@/stores/auth'
import { NotifType, useToast } from '@/stores/notification'
import { useT } from '@/i18n'
import updatePageTitle from '@/utils/updatePageTitle'

import { isSmall } from '@/stores/content-width'
import useArtistStore from '@/stores/pages/artist'
import Info from './HeaderComponents/Info.vue'

const image_width_px = 450
const store = useArtistStore()
const settings = useSettingsStore()

const props = defineProps<{
    on_sidebar?: boolean
}>()

const { t } = useT()
const { info: artist, colors } = storeToRefs(store)

// the photo can be changed by admins, on the artist page only (not in the sidebar)
const canEditPhoto = computed(() => !props.on_sidebar && useAuth().is_admin)
const menuOpen = ref(false)
const askingRefetch = ref(false)
const busy = ref(false)
const fileInput: Ref<HTMLInputElement | null> = ref(null)
const photoMenuParent: Ref<HTMLElement | null> = ref(null)

onClickOutside(photoMenuParent, () => closeMenu())

function closeMenu() {
    menuOpen.value = false
    askingRefetch.value = false
}

function chooseFile() {
    fileInput.value?.click()
    closeMenu()
}

async function finishPhotoChange(result: { error: string } | { ok: boolean }, message: string) {
    const toast = useToast()

    if ('error' in result) {
        toast.showNotification(result.error, NotifType.Error)
        return
    }

    store.bumpPhoto()
    toast.showNotification(message, NotifType.Success)
}

async function onFileChosen(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''

    if (!file) return

    busy.value = true
    const result = await uploadArtistImage(artist.value.artisthash, file)
    busy.value = false

    await finishPhotoChange(result, t('ArtistView.PhotoUpdated'))
}

async function refetchPhoto() {
    closeMenu()
    busy.value = true
    const result = await refetchArtistImage(artist.value.artisthash)
    busy.value = false

    await finishPhotoChange(result, t('ArtistView.PhotoRefetched'))
}

function updateTitle() {
    props.on_sidebar ? () => {} : updatePageTitle(artist.value.name)
}

onMounted(() => updateTitle())
onBeforeRouteUpdate(() => updateTitle())

const artistheader: Ref<HTMLElement | null> = ref(null)
const { width } = useElementSize(artistheader)

const gradientTransparentWidth = computed(() => Math.floor((image_width_px / (width.value || 1)) * 100))

const isSmallPhone = computed(() => width.value <= 660)
const useCircularImage = computed(() => !isSmallPhone.value && settings.useCircularArtistImg)

const gradientDirection = computed(() => (isSmallPhone.value ? '210deg' : 'to left'))

const gradientWidth = computed(() => {
    return isSmallPhone.value ? '80' : Math.min(gradientTransparentWidth.value, 50)
})

const containerHeight = computed(() => {
    return useCircularImage.value ? '13rem' : '18rem'
})
</script>

<style lang="scss">
.headparent {
    height: 100%;
    width: 100%;
    position: relative;
}

.artist-header-ambient {
    height: 18rem;
    width: 100%;
    position: absolute;
    opacity: 0.25;
}

.artist-page-header {
    display: grid;
    grid-template-columns: 1fr 450px;
    position: relative;

    .photo-wrap {
        position: relative;
        display: flex;
        align-items: flex-end;
        height: 100%;
        width: 100%;
    }

    .photo-edit {
        position: absolute;
        right: 1rem;
        bottom: 1rem;
        z-index: 20;

        .photo-edit-btn {
            height: 2.25rem;
            width: 2.25rem;
            padding: 0;
            display: grid;
            place-items: center;
            border-radius: 50%;
            opacity: 0;
            transition: opacity 0.15s ease;

            svg {
                height: 18px;
                width: 18px;
            }
        }

        .photo-menu {
            position: absolute;
            right: 0;
            bottom: 2.75rem;
            min-width: 15rem;
            padding: $small;
            display: grid;
            gap: $smaller;
            background-color: $black;
            text-align: left;

            .warn {
                padding: $small;
                font-size: 0.9rem;
            }

            button {
                width: 100%;
                text-align: left;
            }

            .danger {
                background: $red;
            }
        }
    }

    // the round photo sits on the left edge, so the menu opens to the right
    &.useCircularImage .photo-menu {
        left: 0;
        right: auto;
    }

    &:hover .photo-edit .photo-edit-btn,
    .photo-edit:focus-within .photo-edit-btn {
        opacity: 1;
    }

    @media (hover: none) {
        .photo-edit .photo-edit-btn {
            opacity: 1;
        }
    }

    .artist-img {
        display: flex;
        align-items: flex-end;
        order: 1;

        img {
            height: 100%;
            width: 100%;
            aspect-ratio: 1;
            object-fit: cover;
            object-position: 0% 20%;
        }
    }

    &.useCircularImage {
        grid-template-columns: min-content 1fr;

        .artist-img {
            padding: 1rem;
            order: -1;
            z-index: 10;

            img {
                border-radius: 50%;
                height: calc(100% - 0rem);
                width: unset;
                aspect-ratio: 1;
            }
        }
    }

    .gradient {
        position: absolute;
        background-image: linear-gradient(to left, transparent 10%, $gray 50%, $gray 100%);
        height: 100%;
        width: 100%;

        &.isSmallPhone {
            background-image: linear-gradient(210deg, transparent 20%, $gray 80%, $gray 100%);
        }
    }

    &.isSmallPhone {
        display: flex;
        flex-direction: column-reverse;
        position: relative;

        .artist-img {
            position: absolute;
            width: 100%;
            top: 0;
            height: 100% !important;

            img {
                height: 100%;
                width: 100%;
                aspect-ratio: 1;
                object-fit: cover;
                object-position: 0% 20%;
            }
        }
    }
}
</style>
