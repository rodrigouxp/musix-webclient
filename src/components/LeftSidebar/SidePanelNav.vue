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
        class="nav-item"
        :class="{ active: $route.name === menu.route_name }"
        :aria-label="settings.side_panel_collapsed ? menu.name : undefined"
        :title="settings.side_panel_collapsed ? menu.name : undefined"
      >
        <component :is="menu.icon" />
        <span>{{ menu.name }}</span>
      </router-link>
    </div>

    <div class="sidepanel-divider" role="separator"></div>

    <div class="sidepanel-playlists">
      <PinnedPlaylists />
    </div>
  </nav>
</template>

<script setup lang="ts">
import PinnedPlaylists from "./PinnedPlaylists.vue";
import { useNavItems } from "./navitems";
import useSettings from "@/stores/settings";

const settings = useSettings();
const { menus } = useNavItems();

// the divider splits the menu in the group of the buttons (Home to Favorites) and the pinned playlists under it
const buttons = menus.filter((menu) => !("separator" in menu));
</script>

<style lang="scss">
// The navigation of the side panel (SidePanel > content > buttons, divider-1 and playlists of the Penpot).
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
    // the Penpot spaces the buttons 8 apart when open and 10 when closed
    transition: gap var(--panel-toggle-transition);
  }

  .sidepanel-playlists {
    display: flex;
    flex-direction: column;
    gap: var(--sidepanel-playlists-gap);
  }

  .sidepanel-divider {
    flex-shrink: 0;
    height: 0;
    border-top: solid 1px var(--sidepanel-divider);
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: var(--sidepanel-item-gap);
    width: 100%;
    height: var(--sidepanel-item-height);
    flex-shrink: 0;
    padding: var(--sidepanel-item-padding);
    border-radius: var(--sidepanel-item-radius);
    // the panel collapses to 36 of content: what does not fit (the name) is clipped, not wrapped
    overflow: hidden;
    @include text('action-button-14px');
    color: var(--sidepanel-nav-color);
    transition: background-color 0.2s ease-out;

    // The icon of the Penpot is a vector of 20 x 20 in a slot of 20. The SVG of the app is 24 with the glyph of 20 inside, so it
    // is drawn at its natural size and the negative margin gives back the 2 of each side: the row keeps the slot of 20
    // (before it was shown at 20, which shrank the glyph to 16.7)
    svg {
      flex-shrink: 0;
      width: var(--sidepanel-icon-size);
      height: var(--sidepanel-icon-size);
      margin: calc((var(--sidepanel-icon-slot) - var(--sidepanel-icon-size)) / 2);
    }

    span {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      transition: opacity var(--panel-toggle-duration) ease-in-out;
    }

    // the active item is the neutral/700 pill of the Figma; the hover is not in the Figma and keeps the grey
    // the app already had
    &.active {
      background-color: var(--sidepanel-item-active-bg);

      // the filled vector of the icon (the "active" one of the Figma) is white
      svg {
        color: var(--sidepanel-icon-active-color);
      }
    }

    &:hover:not(.active) {
      background-color: $gray;
    }

    &:focus-visible {
      outline: solid 2px var(--color-neutral-100);
      outline-offset: -2px;
    }
  }
}

// SidePanel Closed (Penpot): the same buttons with only the icon. At 52 of panel the item is already the
// 36 x 36 of the Penpot; the name fades out and the item clips it.
.l-sidebar.collapsed .sidepanel-nav {
  .sidepanel-buttons {
    gap: var(--sidepanel-items-collapsed-gap);
  }

  .nav-item span,
  .pinned-playlist span {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sidepanel-nav .nav-item span {
    transition: none;
  }
}
</style>
