<template>
  <nav class="sidepanel-nav">
    <div class="sidepanel-buttons">
      <router-link
        v-for="menu in buttons"
        :key="menu.name"
        v-wave
        :to="{
          name: menu.route_name || '',
          params: menu?.params,
          query: menu.query && menu.query(),
        }"
        class="circular nav-item"
        :class="{ active: $route.name === menu.route_name }"
      >
        <component :is="menu.icon" />
        <span>{{ menu.name }}</span>
      </router-link>
    </div>

    <div class="sidepanel-divider" role="separator"></div>

    <div class="sidepanel-playlists">
      <router-link
        v-for="menu in playlists"
        :key="menu.name"
        v-wave
        :to="{
          name: menu.route_name || '',
          params: menu?.params,
          query: menu.query && menu.query(),
        }"
        class="circular nav-item"
        :class="{ active: $route.name === menu.route_name }"
      >
        <component :is="menu.icon" />
        <span>{{ menu.name }}</span>
      </router-link>
      <PinnedPlaylists />
    </div>
  </nav>
</template>

<script setup lang="ts">
import PinnedPlaylists from "./PinnedPlaylists.vue";
import { useNavItems } from "./navitems";

const { menus } = useNavItems();

// the divider splits the menu in the group of the buttons and the group of Playlists
const dividerAt = menus.findIndex((menu) => "separator" in menu && menu.separator);
const buttons = menus.slice(0, dividerAt).filter((menu) => !("separator" in menu));
const playlists = menus.slice(dividerAt + 1).filter((menu) => !("separator" in menu));
</script>

<style lang="scss">
// The navigation of the side panel (SidePanel > top > buttons, divider-1 and playlists of the Figma).
// Every size is a token --sidepanel-*; nothing here has a fixed width.
.sidepanel-nav {
  display: flex;
  flex-direction: column;
  // the space of the Figma between the groups: it is also the space above and below the divider
  gap: var(--sidepanel-gap);
  text-transform: capitalize;

  .sidepanel-buttons {
    display: flex;
    flex-direction: column;
    gap: var(--sidepanel-items-gap);
  }

  .sidepanel-playlists {
    display: flex;
    flex-direction: column;
    gap: var(--sidepanel-playlists-gap);
  }

  .sidepanel-divider {
    flex-shrink: 0;
    height: 0;
    border-top: solid 1px var(--color-divider);
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: var(--sidepanel-item-gap);
    width: 100%;
    height: var(--sidepanel-item-height);
    flex-shrink: 0;
    padding: var(--sidepanel-item-padding);
    font-family: var(--sidepanel-font);
    font-size: var(--sidepanel-font-size);
    font-weight: var(--sidepanel-nav-weight);
    line-height: var(--sidepanel-nav-line-height);
    color: var(--sidepanel-nav-color);
    transition: background-color 0.2s ease-out;

    // the icons of the Figma are 24, drawn with 2 of margin: shown at 20
    svg {
      flex-shrink: 0;
      width: var(--sidepanel-icon-size);
      height: var(--sidepanel-icon-size);
    }

    span {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    // the grey of the active item and of the hover are the ones the app already had
    &.active {
      background-color: $gray5;
    }

    &:hover {
      background-color: $gray;
    }

    &:focus-visible {
      outline: solid 2px var(--color-neutral-100);
      outline-offset: -2px;
    }
  }
}
</style>
