<template>
    <nav class="navbar-mobile">
        <RouterLink
            v-for="item in items"
            :key="item.route_name"
            class="nbm-item"
            :class="{ active: $route.name === item.route_name, 'icon-active': $route.name === item.route_name }"
            :to="{ name: item.route_name }"
            :title="item.name"
            :aria-label="item.name"
            :aria-current="$route.name === item.route_name ? 'page' : undefined"
        >
            <component :is="item.icon" />
        </RouterLink>
    </nav>
</template>

<script setup lang="ts">
import { Routes } from '@/router'

import { useNavItems } from '@/components/LeftSidebar/navitems'

// NavBarMobile of the Figma (node 12536:3896): four buttons, Home, Albums, Artists and Playlists (no Favorites on the
// phone, Rodrigo's decision; they stay in the drawer of the top bar). The one of the open page has the filled icon on a
// round background; the icons with two states swap by the class `icon-active` (Global/basic.scss).
const { menus } = useNavItems()

const shown: string[] = [Routes.Home, Routes.AlbumList, Routes.ArtistList, Routes.playlists]

const items = menus.filter(
    (menu): menu is Exclude<(typeof menus)[number], { separator: boolean }> =>
        'route_name' in menu && shown.includes(menu.route_name)
)
</script>

<style lang="scss">
.navbar-mobile {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--navbarmobile-padding);
    border-radius: var(--fixedcontrols-radius);
    background-color: var(--fixedcontrols-bg);

    .nbm-item {
        display: grid;
        place-items: center;
        width: var(--navbarmobile-button-size);
        height: var(--navbarmobile-button-size);
        border-radius: 400px;
        color: var(--color-neutral-white);
        transition: background-color 0.2s ease-out;
        -webkit-tap-highlight-color: transparent;

        svg {
            width: var(--navbarmobile-icon-size);
            height: var(--navbarmobile-icon-size);
        }

        &.active {
            background-color: var(--navbarmobile-active-bg);
        }

        &:focus-visible {
            outline: 2px solid var(--color-primary-300);
            outline-offset: -2px;
        }
    }
}
</style>
