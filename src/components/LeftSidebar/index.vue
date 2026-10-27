<template>
  <div class="l-sidebar no-scroll" :class="{ 'no-card': !settings.use_np_img }">
    <Logo />
    <div class="scrollable">
      <Navigation />
    </div>

    <SongCard v-if="settings.use_np_img" />
  </div>
</template>

<script setup lang="ts">
import useSettingsStore from "@/stores/settings";

import Navigation from "@/components/LeftSidebar/NavButtons.vue";
import Logo from "@/components/Logo.vue";
import SongCard from "./NP/SongCard.vue";

const settings = useSettingsStore();
</script>

<style lang="scss">
// The side panel of the Figma (SidePanel): the header and the card of the song stay, the middle (buttons,
// divider, playlists) scrolls inside. The sizes are the tokens --sidepanel-* (_musix-tokens.scss).
.l-sidebar {
  // the panel of the Figma has --sidepanel-width; the border of 1px that the app keeps is on top of it
  width: calc(var(--sidepanel-width) + var(--sidepanel-border));
  grid-area: l-sidebar;
  display: grid;
  grid-template-rows: var(--sidepanel-header-height) minmax(0, 1fr) max-content;
  gap: var(--sidepanel-gap);
  border-right: solid var(--sidepanel-border) $gray5;
  position: relative;
  padding: var(--sidepanel-padding);
  background: var(--sidepanel-bg);
  font-family: var(--sidepanel-font);

  // no card of the song (Settings): the middle takes its place
  &.no-card {
    grid-template-rows: var(--sidepanel-header-height) minmax(0, 1fr);
  }

  .scrollable {
    height: 100%;
    min-height: 0;
    overflow: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;

    &::-webkit-scrollbar-thumb {
      background-color: transparent;
    }
  }

  &:hover .scrollable::-webkit-scrollbar-thumb {
    background-color: $gray2;
  }

  &:hover .scrollable::-webkit-scrollbar-thumb:hover {
    background-color: $gray1;
  }
}
</style>
