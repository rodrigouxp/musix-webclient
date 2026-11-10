<template>
    <div class="topnav">
        <div class="left">
            <NavButtons />
            <div v-if="settings.is_panel_layout && $route.name == Routes.folder" class="info">
                <Folder />
            </div>
            <NavTitles v-else-if="settings.is_panel_layout && !isSmall" />
        </div>
        <div class="sidenav_toggle" @click="toggleSidenav">
            <MenuSvg />
        </div>
        <NavSidenav @close="toggleSidenav" :class="{ active: sidenavActive }" />
        <div class="dimmer noSelect" :class="{ active: sidenavActive }" @click="toggleSidenav"></div>
        <div class="right">
            <SearchInput />
            <AvatarWithDropdown />
        </div>
    </div>
</template>

<script setup lang="ts">
import { Routes } from '@/router'
import { computed, ref } from 'vue'

import { content_width } from '@/stores/content-width'
import useSettings from '@/stores/settings'

import MenuSvg from '@/assets/icons/figma/menu.svg'
import SearchInput from './SearchInput.vue'
import NavButtons from './NavButtons.vue'
import NavSidenav from './NavSidenav.vue'
import NavTitles from './NavTitles.vue'
import Folder from './Titles/Folder.vue'
import AvatarWithDropdown from './AvatarWithDropdown.vue'

const settings = useSettings()
const isSmall = computed(() => content_width.value < 800)

const sidenavActive = ref(false)

function toggleSidenav() {
    sidenavActive.value = !sidenavActive.value
}
</script>

<style lang="scss">
.topnav {
    display: grid;
    grid-template-columns: 1fr max-content;

    input {
        min-width: 6rem;
    }

    align-items: center;
    gap: 1rem;
    font-size: 14px;

    .left {
        display: grid;
        grid-template-columns: max-content 1fr;
        gap: 1rem;
        position: relative;

        .info {
            margin: auto 0;
            // what cannot shrink (a button, the sort menu) sets the least room it needs; the text
            // titles and the folder path give way (see SimpleNav.vue and Titles/Folder.vue)
            min-width: min-content;
            max-width: 100%;
            overflow: hidden;

            .title {
                font-size: 1.5rem;
                font-weight: 700;
                display: flex;
                align-items: center;
            }
        }

        @include allPhones {
            display: none;
        }

        // INFO: Folder page sort bar overrides
        .sortbar {
            top: 0 !important;
            right: 0 !important;
        }
    }

    .right {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        align-items: center;
        width: 100%;

        @include allPhones {
            gap: unset;
            justify-content: unset;
        }
    }

    // Above the phone breakpoint: back/forward on the left, the search centered, the avatar on the right edge.
    // The TopBar of the Figma (node 12395:365): back and forward, 64 apart, the search (no fill and no stroke now),
    // and the avatar on the right edge. The search grows to 12px from the avatar. The title of the page (or the path
    // of the folder) is not in the Figma: it keeps its place between the search and the avatar, takes only the room
    // it needs and gives way first; when a page has no title the box is hidden. Tokens --topbar-*.
    @media only screen and (min-width: 601px) {
        --tb-gap: var(--topbar-gap);
        display: flex;
        align-items: center;
        gap: var(--tb-gap);

        // medium widths: tighter gaps, so the buttons, the search (14rem at least) and the avatar fit
        @media only screen and (max-width: 1100px) {
            --tb-gap: 1.5rem;
        }

        .left {
            display: contents;

            #back-forward {
                order: 0;
                flex: none;
            }

            .info {
                order: 2;
                flex: 0 1 auto;
                min-width: min-content;
                max-width: none;
                margin: 0;

                &:empty {
                    display: none;
                }
                // the sort menu of the folder is placed against this box (the .left is not a box here)
                position: relative;

                &:has(#folder-nav-title) {
                    overflow: visible;
                }
            }
        }

        .right {
            display: contents;

            & > .gsearch-input {
                order: 1;
                flex: 1 1 var(--topbar-search-min-width);
                min-width: var(--topbar-search-min-width);
                max-width: var(--topbar-search-max-width);
            }

            // the search stops at 500px: what is left goes before the avatar, which stays on the right edge
            & > .avatar {
                order: 3;
                flex: none;
                width: var(--topbar-avatar-size);
                margin-left: auto;
            }
        }

        // with a title (settings, playlists, folder...) it is the title that takes what is left, and the avatar
        // keeps the normal gap after it
        &:has(.left .info:not(:empty)) .right > .avatar {
            margin-left: 0;
        }

        &:has(.left .info:not(:empty)) .left .info {
            margin-left: auto;
        }
    }

    @include allPhones {
        display: flex;
    }
}
</style>
