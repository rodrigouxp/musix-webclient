<template>
  <div class="l-sidebar no-scroll" :class="{ collapsed: settings.side_panel_collapsed }">
    <Logo collapsible />
    <div class="scrollable">
      <SidePanelNav />
    </div>
  </div>
</template>

<script setup lang="ts">
import SidePanelNav from "./SidePanelNav.vue";
import Logo from "@/components/Logo.vue";
import useSettings from "@/stores/settings";

const settings = useSettings();
</script>

<style lang="scss">
// The side panel of the Figma (SidePanel, node 12329:437): a block of its own (corners of 8, neutral/900)
// in the grid of panels; the header and the card of the song stay, the middle (buttons, divider,
// playlists) scrolls inside. The sizes are the tokens --sidepanel-* (_musix-tokens.scss).
// It has no width of its own: it fills its column of the grid (app-grid.scss), which goes from --sidepanel-width to
// --sidepanel-collapsed-width (SidePanel Closed, node 12546:5413) with the motion of the prototype, and clips what
// does not fit while the column moves. `.collapsed` is the same panel as a strip of icons; the children style themselves under it.
.l-sidebar {
  min-width: 0;
  overflow: hidden;
  grid-area: l-sidebar;
  display: grid;
  grid-template-rows: var(--sidepanel-header-height) minmax(0, 1fr);
  gap: var(--sidepanel-gap);
  position: relative;
  box-sizing: border-box;
  padding: var(--sidepanel-padding);
  border-radius: var(--layout-panel-radius);
  background: var(--sidepanel-bg);

  // collapsed, the 36px of the buttons are all there is: the scrollbar must not take width from them
  &.collapsed .scrollable {
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

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
