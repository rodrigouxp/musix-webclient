<template>
    <div class="last-updated">
        <span v-if="!isHeaderSmall" class="status">{{ $t('PlaylistView.LastUpdated', { date: playlist.info._last_updated }) }}</span>
    </div>
</template>
<script setup lang="ts">
import { isHeaderSmall } from '@/stores/content-width'

import usePStore from '@/stores/pages/playlist'

const playlist = usePStore()
</script>

<style lang="scss">
.last-updated {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
    padding: $smaller $small;
    font-size: 0.9rem;
    font-weight: 500;
    border-radius: $smaller;
    z-index: 12;

    display: flex;
    align-items: center;
}
</style>
