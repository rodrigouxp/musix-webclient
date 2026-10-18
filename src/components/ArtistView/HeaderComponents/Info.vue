<template>
    <div
        class="artist-info"
        :style="{
            color: !useCircularImage ? (artist.color ? getTextColor(artist.color) : undefined) : undefined,
        }"
    >
        <section class="text">
            <div class="card-title">{{ $t('ArtistView.Title') }}</div>
            <div class="name-row">
                <div class="artist-name" :class="`${useCircularImage ? 'ellip' : 'ellip2'}`" :title="artist.name">
                    {{ artist.name }}
                </div>
                <button
                    v-if="canRename"
                    class="name-edit-btn"
                    :title="$t('ArtistView.RenameArtist.EditName')"
                    :aria-label="$t('ArtistView.RenameArtist.EditName')"
                    @click="renaming = true"
                    v-html="EditIcon"
                ></button>
            </div>
            <RenameArtistDialog
                v-if="renaming"
                :artisthash="artist.artisthash"
                :artist-name="artist.name"
                @close="renaming = false"
            />
            <div class="stats">
                <span v-if="artist.trackcount">
                    {{ artist.trackcount.toLocaleString() }} {{ `${ $t('Common.Track', artist.trackcount) } • `}}
                </span>
                <span v-if="artist.albumcount">
                    {{ artist.albumcount.toLocaleString() }} {{ `${ $t('Common.Album', artist.albumcount) } • ` }}
                </span>
                <span v-if="artist.duration">
                    {{ `${formatSeconds(artist.duration, true)}` }}
                </span>
            </div>
        </section>
        <Buttons :use-circular-image="useCircularImage" />
    </div>
</template>

<script setup lang="ts">
import { getTextColor } from '@/utils/colortools/shift'

import { ref } from 'vue'

import { Artist } from '@/interfaces'
import { EditIcon } from '@/icons'
import formatSeconds from '@/utils/useFormatSeconds'
import Buttons from './Buttons.vue'
import RenameArtistDialog from '../RenameArtistDialog.vue'

defineProps<{
    artist: Artist
    useCircularImage?: boolean
    // admins can rename the artist, on the artist page only
    canRename?: boolean
}>()

const renaming = ref(false)
</script>

<style lang="scss">
.artist-info {
    z-index: 1;
    padding: 1rem;
    padding-right: 0;

    display: flex;
    flex-direction: column;
    justify-content: flex-end;

    gap: 1rem;

    .text {
        display: flex;
        flex-direction: column;
        gap: $small;
    }

    .card-title {
        font-size: small;
        font-weight: 700;
    }

    .name-row {
        display: flex;
        align-items: center;
        gap: $small;
        min-width: 0;

        .name-edit-btn {
            flex-shrink: 0;
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

        &:hover .name-edit-btn,
        .name-edit-btn:focus-visible {
            opacity: 1;
        }

        @media (hover: none) {
            .name-edit-btn {
                opacity: 1;
            }
        }
    }

    .artist-name {
        font-size: 3.5rem;
        font-weight: 700;
        word-wrap: break-all;
        margin-left: -1px;
    }

    .stats {
        font-size: small;
        font-weight: 700;
    }
}
</style>
