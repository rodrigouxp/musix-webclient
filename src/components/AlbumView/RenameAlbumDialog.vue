<template>
    <RenameDialog
        prefix="AlbumView.RenameAlbum"
        root-class="renamealbum"
        go-key="GoToAlbum"
        :current="albumTitle"
        :preview="(title: string) => previewAlbumRename(albumhash, title)"
        :start="(title: string) => startAlbumRename(albumhash, title)"
        :get-status="getAlbumRenameStatus"
        :text-of="(p: AlbumRenamePreview) => p.new_title"
        @close="emit('close')"
        @go="goToAlbum"
    >
        <template #hint>
            <p class="tag-hint">{{ $t('AlbumView.RenameAlbum.TagHint') }}</p>
        </template>

        <template #preview="{ preview }">
            <div class="summary">
                <p>
                    <b>{{ preview.current_title }}</b> &rarr; <b>{{ preview.new_title }}</b>
                </p>
                <p>
                    {{ $t('AlbumView.RenameAlbum.Summary', { tracks: preview.tracks_count, total: preview.files_total }) }}
                </p>
                <p v-if="preview.distinct_titles_count > 1" class="warn">
                    {{
                        $t('AlbumView.RenameAlbum.DistinctTitles', {
                            titles: preview.distinct_titles.slice(0, 5).join(' | '),
                        })
                    }}
                </p>
                <p v-if="preview.merge" class="warn">
                    {{
                        $t('AlbumView.RenameAlbum.Merge', {
                            title: preview.merge.title,
                            count: preview.merge.trackcount,
                        })
                    }}
                </p>
                <p v-else-if="!preview.hash_changes" class="note">{{ $t('AlbumView.RenameAlbum.SameIdentity') }}</p>
                <p v-if="preview.no_album_tag_count" class="warn">
                    {{ $t('AlbumView.RenameAlbum.NoAlbumTag', { count: preview.no_album_tag_count }) }}
                </p>
                <p v-if="preview.unsupported_count" class="warn">
                    {{ $t('AlbumView.RenameAlbum.Unsupported', { count: preview.unsupported_count }) }}
                </p>
                <p v-if="preview.not_writable_count" class="warn">
                    {{ $t('AlbumView.RenameAlbum.NotWritable', { count: preview.not_writable_count }) }}
                </p>
                <p class="note">{{ preview.warning }}</p>
            </div>

            <div class="samples">
                <div class="samples-title">{{ $t('AlbumView.RenameAlbum.SamplesTitle') }}</div>
                <div v-for="s in preview.samples" :key="s.filepath" class="sample">
                    <div class="sample-title ellip">{{ s.title }}</div>
                    <div class="row">
                        <em>{{ $t('Common.Album', 1) }}</em> {{ s.album_before ?? '—' }} &rarr; {{ s.album_after ?? '—' }}
                    </div>
                </div>
            </div>
        </template>
    </RenameDialog>
</template>

<script setup lang="ts">
import RenameDialog from '@/components/shared/RenameDialog.vue'
import {
    AlbumRenamePreview,
    AlbumRenameStatus,
    getAlbumRenameStatus,
    previewAlbumRename,
    startAlbumRename,
} from '@/requests/album'
import { RenameJobStatus } from '@/requests/rename'
import { Routes, router } from '@/router'
import useAlbumStore from '@/stores/pages/album'
import { patchAlbumEverywhere } from '@/utils/patchAlbum'

const props = defineProps<{ albumhash: string; albumTitle: string }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const store = useAlbumStore()

async function goToAlbum(status: RenameJobStatus | null) {
    // (the prop follows the page: it is read now, before the page is loaded again)
    const oldHash = props.albumhash
    // the same hash when it did not change (only the letter case)
    const hash = (status as AlbumRenameStatus | null)?.new_albumhash || oldHash

    emit('close')

    // the page shows what the server has now (the header, the title of the tab, the tracks)
    await store.fetchTracksAndArtists(hash)
    patchAlbumEverywhere(oldHash, store.info, store.srcTracks)

    if (hash !== oldHash) {
        router.replace({ name: Routes.album, params: { albumhash: hash } })
    }
}
</script>

<style lang="scss">
.renamealbum {
    .tag-hint {
        margin: $small 0 0;
        font-size: small;
        opacity: 0.7;
    }
}
</style>
