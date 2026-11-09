<template>
    <RenameArtistDialog
        v-if="edit.renaming"
        :artisthash="edit.renaming.artisthash"
        :artist-name="edit.renaming.name"
        @close="edit.renaming = null"
    />
    <ArtistThumbnailDialog
        v-if="edit.thumbnail"
        :artisthash="edit.thumbnail.artisthash"
        :name="edit.thumbnail.name"
        @close="edit.thumbnail = null"
    />
</template>

<script setup lang="ts">
import useArtistEdit from '@/stores/artistedit'

import ArtistThumbnailDialog from './ArtistThumbnailDialog.vue'
import RenameArtistDialog from './RenameArtistDialog.vue'

// The windows that the menu of the artist opens (rename and thumbnail). They live here, in App.vue, because the
// menu opens from anywhere: a card, the search, the page.
const edit = useArtistEdit()
</script>
