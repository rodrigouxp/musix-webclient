<template>
    <div v-if="items.length" class="info-line">
        <template v-for="(item, i) in items" :key="i">
            <span v-if="i" class="bullet">•</span>
            <span>{{ item }}</span>
        </template>
    </div>
</template>

<script setup lang="ts">
// The line of numbers under a title, with a bullet between them: "14 tracks • 52 minutes" (ArtistHero > infos and
// AlbumPanel > infos of the Figma, paragraph-14px). The color is the one of the text around it.
defineProps<{
    items: string[]
}>()
</script>

<style lang="scss">
.info-line {
    @include text('paragraph-14px');
    display: flex;
    flex-wrap: wrap;
    gap: var(--artist-hero-text-gap);
}
</style>
