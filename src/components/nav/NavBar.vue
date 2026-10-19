<template>
    <div
        class="topnav"
        :class="{
            use_links: settings.is_alt_layout,
            use_sidebar: settings.use_sidebar && isSmall,
        }"
    >
        <div class="left">
            <NavButtons />
            <NavLinks v-if="settings.is_alt_layout" />
            <div v-if="settings.is_default_layout && $route.name == Routes.folder" class="info">
                <Folder />
            </div>
            <NavTitles v-else-if="settings.is_default_layout && !isSmall" />
        </div>
        <div class="sidenav_toggle" @click="toggleSidenav">
            <div class="bar"></div>
            <div class="bar"></div>
        </div>
        <NavSidenav @close="toggleSidenav" :class="{ active: sidenavActive }" />
        <div class="dimmer noSelect" :class="{ active: sidenavActive }" @click="toggleSidenav"></div>
        <RouterLink v-if="settings.is_alt_layout" to="/" class="logo rounded-sm"><LogoSvg /></RouterLink>
        <div v-if="settings.is_alt_layout || !settings.use_sidebar || !xl" class="right">
            <SearchInput :on_nav="true" />
            <AvatarWithDropdown />
        </div>
    </div>
</template>

<script setup lang="ts">
import { Routes } from '@/router'
import { computed, ref } from 'vue'

import useAuth from '@/stores/auth'
import { content_width } from '@/stores/content-width'
import useSettings from '@/stores/settings'
import { xl } from './../../composables/useBreakpoints'

import LogoSvg from '@/assets/icons/logos/note.svg'
import SearchInput from '../RightSideBar/SearchInput.vue'
import NavButtons from './NavButtons.vue'
import NavLinks from './NavLinks.vue'
import NavSidenav from './NavSidenav.vue'
import NavTitles from './NavTitles.vue'
import Folder from './Titles/Folder.vue'
import AvatarWithDropdown from './AvatarWithDropdown.vue'

const auth = useAuth()
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

    &.use_links {
        grid-template-columns: 1fr max-content 1fr;
    }

    .left {
        display: grid;
        grid-template-columns: max-content 1fr;
        gap: 1rem;
        position: relative;

        .info {
            margin: auto 0;
            width: fit-content;
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

    .logo {
        width: max-content;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: center;

        svg {
            width: 2rem;
            height: 2rem;
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

    // Default layout above the phone breakpoint: back/forward on the left, search centered
    // on 50% of the top bar, avatar on the right edge. The alt layout keeps the logo in the middle.
    @media only screen and (min-width: 901px) {
        &:not(.use_links) {
            grid-template-columns: minmax(0, 1fr) minmax(14rem, 50%) minmax(0, 1fr);

            .left {
                grid-column: 1;
                min-width: 0;
            }

            .right {
                display: contents;

                & > .gsearch-input {
                    grid-column: 2;
                    min-width: 0;
                }

                & > .avatar {
                    grid-column: 3;
                    justify-self: end;
                }
            }
        }
    }

    @include allPhones {
        display: flex;
    }
}
</style>
