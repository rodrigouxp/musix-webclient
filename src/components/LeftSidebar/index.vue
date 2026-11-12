<template>
  <div class="l-sidebar no-scroll">
    <Logo />
    <div class="scrollable">
      <SidePanelNav />
    </div>
  </div>
</template>

<script setup lang="ts">
import SidePanelNav from "./SidePanelNav.vue";
import Logo from "@/components/Logo.vue";
</script>

<style lang="scss">
// The side panel of the Figma (SidePanel, node 12329:437): a block of its own (corners of 8, neutral/900)
// in the grid of panels; the header and the card of the song stay, the middle (buttons, divider,
// playlists) scrolls inside. The sizes are the tokens --sidepanel-* (_musix-tokens.scss).
.l-sidebar {
  width: var(--sidepanel-width);
  grid-area: l-sidebar;
  display: grid;
  grid-template-rows: var(--sidepanel-header-height) minmax(0, 1fr);
  gap: var(--sidepanel-gap);
  position: relative;
  box-sizing: border-box;
  padding: var(--sidepanel-padding);
  border-radius: var(--layout-panel-radius);
  background: var(--sidepanel-bg);

  .scrollable {
    height: 100%;
    min-height: 0;
    overflow: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;

    // the thumb shows while the panel scrolls and fades out after it (Global/scrollbars.scss), or with the pointer on it
    &::-webkit-scrollbar-thumb {
      background-color: var(--scrollbar-thumb);
      border-radius: 400px;
    }

    &::-webkit-scrollbar-thumb:hover {
      background-color: var(--color-neutral-500);
    }
  }
}
</style>
