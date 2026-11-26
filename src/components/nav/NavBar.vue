<template>
    <!-- The top bar of the phone (up to 600px): the menu, the search and the user. Above 600px there is no top bar: the search,
         the user and Settings live in the SidePanel, and the back and forward buttons and the page title are in the PageBar. -->
    <div class="topnav">
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
import { ref } from 'vue'

import MenuSvg from '@/assets/icons/figma/menu.svg'
import SearchInput from './SearchInput.vue'
import NavSidenav from './NavSidenav.vue'
import AvatarWithDropdown from './AvatarWithDropdown.vue'

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

    @include allPhones {
        display: flex;
    }
}
</style>
