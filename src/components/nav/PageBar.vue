<template>
    <!-- What was left of the TopBar when the search, the user and Settings went to the SidePanel (3.35.0): the back and
         forward buttons and the title of the page (the settings buttons, the artist name, the folder path with its sort menu).
         The Penpot "Home" does not draw them; they are functions, so they stay (a decision of mine, not asked for) until Rodrigo decides about them. -->
    <div class="pagebar">
        <NavButtons />
        <div v-if="$route.name == Routes.folder" class="info">
            <Folder />
        </div>
        <NavTitles v-else-if="!isSmall" />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { Routes } from '@/router'
import { content_width } from '@/stores/content-width'

import NavButtons from './NavButtons.vue'
import NavTitles from './NavTitles.vue'
import Folder from './Titles/Folder.vue'

const isSmall = computed(() => content_width.value < 800)
</script>

<style lang="scss">
// A strip at the top of the content panel (not a row of the grid of panels): no fill and no border, as tall as its buttons.
// Tokens --pagebar-* (_musix-tokens.scss).
.pagebar {
    display: flex;
    align-items: center;
    flex: none;
    gap: var(--pagebar-gap);
    box-sizing: border-box;
    min-height: var(--pagebar-height);
    padding: var(--pagebar-padding);
    font-size: 14px;

    #back-forward {
        flex: none;
    }

    // the title takes only the room it needs and gives way first; when a page has no title the box is hidden
    .info {
        position: relative;
        flex: 0 1 auto;
        min-width: min-content;
        margin: 0;
        overflow: hidden;

        &:empty {
            display: none;
        }

        // the sort menu of the folder is placed against this box
        &:has(#folder-nav-title) {
            overflow: visible;
        }

        .title {
            font-size: 1.5rem;
            font-weight: 700;
            display: flex;
            align-items: center;
        }
    }

    // INFO: Folder page sort bar overrides
    .sortbar {
        top: 0 !important;
        right: 0 !important;
    }
}
</style>
