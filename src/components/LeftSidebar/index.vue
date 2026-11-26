<template>
  <div class="l-sidebar no-scroll" :class="{ collapsed: settings.side_panel_collapsed }">
    <Logo collapsible />
    <SearchInput />
    <div class="scrollable">
      <SidePanelNav />
    </div>
    <SidePanelFooter />
  </div>
</template>

<script setup lang="ts">
import SidePanelFooter from "./SidePanelFooter.vue";
import SidePanelNav from "./SidePanelNav.vue";
import Logo from "@/components/Logo.vue";
import SearchInput from "@/components/nav/SearchInput.vue";
import useSettings from "@/stores/settings";

const settings = useSettings();
</script>

<style lang="scss">
// The side panel of the Penpot (board "SidePanel", variants Opened and Closed): a block of its own (corners of 8,
// neutral/900) in the grid of panels. From top to bottom: the header, the search, the middle (buttons, divider, playlists),
// which scrolls inside, and the footer (Settings and the user). The TopBar is gone: the search, the user and Settings
// live here now. The sizes are the tokens --sidepanel-* (_musix-tokens.scss).
// It has no width of its own: it fills its column of the grid (app-grid.scss), which goes from --sidepanel-width to
// --sidepanel-collapsed-width (the Closed variant) with the motion of the prototype, and clips what
// does not fit while the column moves. `.collapsed` is the same panel as a strip of icons; the children style themselves under it.
.l-sidebar {
  min-width: 0;
  overflow: hidden;
  grid-area: l-sidebar;
  display: grid;
  // one column that never grows with its content (the search, the rows and the wordmark are wider than the closed panel)
  grid-template-columns: minmax(0, 1fr);
  // the middle takes what the header, the search and the footer leave (the Penpot spreads them with space-between)
  grid-template-rows: var(--sidepanel-header-height) auto minmax(0, 1fr) auto;
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
