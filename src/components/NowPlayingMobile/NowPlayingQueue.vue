<template>
    <div class="np-queue npm-queue">
        <QueueList />
    </div>
</template>

<script setup lang="ts">
import QueueList from '@/components/PlayingPanel/QueueList.vue'

// NowPlaying:Queue of the Figma (node 12541:4686): the grouped queue at touch size. It is the list of the PlayingPanel
// (QueueList); the class `np-queue` swaps the --playingpanel-* tokens for the touch sizes (_musix-tokens.scss).
</script>

<style lang="scss">
.npm-queue {
    display: flex;
    flex-direction: column;
    flex: 1 1 0;
    min-height: 0;

    // the text styles of the rows are not tokens: the Figma has the name of the track at 18 and the group at 16
    .queue-track .qt-title {
        @include text('paragraph-18px');
    }

    .queue-group-header .qg-text {
        @include text('paragraph-16px');
    }
}
</style>
