<template>
  <div class="l-sidebar no-scroll" :class="{ 'no-card': !settings.use_np_img }">
    <Logo />
    <div class="scrollable">
      <SidePanelNav />
    </div>

    <SongCard v-if="settings.use_np_img" />
  </div>
</template>

<script setup lang="ts">
import useSettingsStore from "@/stores/settings";

import SidePanelNav from "./SidePanelNav.vue";
import Logo from "@/components/Logo.vue";
import SongCard from "./NP/SongCard.vue";

const settings = useSettingsStore();
</script>

<style lang="scss">
// The side panel of the Figma (SidePanel, node 12329:437): a block of its own (corners of 8, neutral/900)
// in the grid of panels; the header and the card of the song stay, the middle (buttons, divider,
// playlists) scrolls inside. The sizes are the tokens --sidepanel-* (_musix-tokens.scss).
.l-sidebar {
  width: var(--sidepanel-width);
  grid-area: l-sidebar;
  display: grid;
  grid-template-rows: var(--sidepanel-header-height) minmax(0, 1fr) max-content;
  gap: var(--sidepanel-gap);
  position: relative;
  box-sizing: border-box;
  padding: var(--sidepanel-padding);
  border-radius: var(--layout-panel-radius);
  background: var(--sidepanel-bg);

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
