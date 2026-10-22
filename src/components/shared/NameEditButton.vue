<template>
    <!-- The pencil next to the title of an album, an artist or a playlist (the Figma icon "edit", 18px).
         It shows on the hover of the title row (.title-row / .name-row), and always on screens without hover. -->
    <button class="name-edit-btn" :title="label" :aria-label="label" v-html="EditIcon"></button>
</template>

<script setup lang="ts">
import { EditIcon } from '@/icons'

defineProps<{
    label: string
}>()
</script>

<style lang="scss">
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

.title-row:hover .name-edit-btn,
.name-row:hover .name-edit-btn,
.name-edit-btn:focus-visible {
    opacity: 1;
}

@media (hover: none) {
    .name-edit-btn {
        opacity: 1;
    }
}
</style>
