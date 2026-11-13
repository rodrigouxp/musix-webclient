<template>
    <!-- above 600px: the PlayerBar of the Figma (in two rows up to 900px). Up to 600px: the FixedControls of the phone -->
    <PlayerBar v-if="settings.is_panel_layout" :tablet="narrow" @handleFav="handleFav" />
    <FixedControls v-else />
</template>

<script setup lang="ts">
import { favType } from '@/enums'
import favoriteHandler from '@/helpers/favoriteHandler'

import { isNarrowWindow } from '@/stores/content-width'

import useQStore from '@/stores/queue'
import useSettings from '@/stores/settings'

import FixedControls from '@/components/FixedControls/FixedControls.vue'
import PlayerBar from '@/components/PlayerBar/PlayerBar.vue'

const queue = useQStore()
const settings = useSettings()

// up to 900px the PlayerBar has two rows (the controls on top; the actions and the song under them)
const narrow = isNarrowWindow

function handleFav() {
    favoriteHandler(
        queue.currenttrack?.is_favorite,
        favType.track,
        queue.currenttrack?.trackhash || '',
        () => null,
        () => null
    )
}
</script>
