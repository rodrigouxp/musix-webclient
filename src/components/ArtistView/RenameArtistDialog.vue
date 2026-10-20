<template>
    <RenameDialog
        prefix="ArtistView.RenameArtist"
        root-class="renameartist"
        go-key="GoToArtist"
        :current="artistName"
        :preview="(name: string) => previewArtistRename(artisthash, name)"
        :start="(name: string) => startArtistRename(artisthash, name)"
        :get-status="getArtistRenameStatus"
        :text-of="(p: RenamePreview) => p.new_name"
        @close="emit('close')"
        @go="goToArtist"
    >
        <template #preview="{ preview }">
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
        </template>
    </RenameDialog>
</template>

<script setup lang="ts">
import RenameDialog from '@/components/shared/RenameDialog.vue'
import {
    getArtistRenameStatus,
    previewArtistRename,
    RenamePreview,
    RenameStatus,
    startArtistRename,
} from '@/requests/artists'
import { RenameJobStatus } from '@/requests/rename'
import { Routes, router } from '@/router'

defineProps<{ artisthash: string; artistName: string }>()
const emit = defineEmits<{ (e: 'close'): void }>()

function goToArtist(status: RenameJobStatus | null) {
    const hash = (status as RenameStatus | null)?.new_artisthash

    emit('close')

    if (hash) {
        router.push({ name: Routes.artist, params: { hash } })
    }
}
</script>

<style lang="scss">
// what only the artist preview has (the rest of the window is in RenameDialog.vue)
.renameartist {
    .samples .sample {
        &.participant {
            outline: 1px solid #f5b041;
        }

        .badge {
            margin-left: $small;
            font-size: x-small;
            padding: 0 $small;
            border-radius: 1rem;
            background: #f5b041;
            color: #000;
        }
    }
}
</style>
