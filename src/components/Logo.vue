<template>
  <!-- the header of the SidePanel (collapsible): the button that collapses and expands the panel -->
  <button
    v-if="collapsible"
    class="musix-logo musix-logo-toggle"
    type="button"
    :aria-expanded="!settings.side_panel_collapsed"
    :aria-label="label"
    :title="label"
    @click="settings.toggleSidePanel()"
  >
    <!-- both drawings are always there, stacked: the one of the current state is opaque and the other fades out -->
    <LogoSvg class="logo-wordmark" />
    <MusicSvg class="logo-note" />
  </button>
  <!-- the login modal: only the wordmark, not a button -->
  <router-link v-else class="musix-logo rounded-md" :to="{ name: 'Home' }" aria-label="MUSIX"> <LogoSvg /> </router-link>
</template>

<script setup lang="ts">
import { computed } from "vue";

import MusicSvg from "@/assets/icons/figma/music.svg";
import LogoSvg from "@/assets/icons/logos/musix.svg";
import { useT } from "@/i18n";
import useSettings from "@/stores/settings";

// `collapsible`: the header of the SidePanel (it toggles the panel). Without it, it is the link to Home of the login modal.
defineProps<{ collapsible?: boolean }>();

const settings = useSettings();
const { t } = useT();
const label = computed(() => t(settings.side_panel_collapsed ? "LeftSidebar.ExpandSidebar" : "LeftSidebar.CollapseSidebar"));
</script>

<style lang="scss">
// The header of the side panel (SidePanel > header): the MUSIX wordmark of the Figma centered, with no
// background of its own. The sizes are the tokens --sidepanel-header-* (_musix-tokens.scss).
.musix-logo,
.musix-logo.rounded-md {
  height: var(--sidepanel-header-height);
  color: var(--color-neutral-white);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--sidepanel-header-radius);
  background-color: transparent;
  transition: background-color 0.2s ease-out;

  // the wordmark keeps its proportion and shrinks if the panel gets narrower than the Figma
  svg {
    width: min(100%, var(--sidepanel-logo-width));
    height: auto;
  }

  // the hover is not in the Figma: it keeps the grey the app already had
  &:hover {
    background-color: $gray5;
  }
}

// The header as the toggle (Prototype: click on the header of the open panel -> SidePanel Closed, click on the music
// icon of the closed one -> Opened). Smart animate: the box goes from the full width to the 36 x 48 of the Figma
// (padding 8, corners 8, icon 27 x 32) and the two drawings cross-fade, so the DOM is the same in both states.
.musix-logo.musix-logo-toggle {
  position: relative;
  display: grid;
  place-items: center;
  box-sizing: border-box;
  width: 100%;
  padding: 0;
  overflow: hidden;
  justify-self: center;
  align-self: center;
  transition:
    width var(--panel-toggle-transition),
    height var(--panel-toggle-transition),
    border-radius var(--panel-toggle-transition),
    background-color 0.2s ease-out;

  svg {
    grid-area: 1 / 1;
    flex-shrink: 0;
    transition: opacity var(--panel-toggle-duration) ease-in-out;
  }

  // the wordmark keeps its size while the panel narrows: it is clipped and fades, it does not shrink with the panel
  .logo-wordmark {
    width: min(var(--sidepanel-logo-width), calc(var(--sidepanel-width) - 2 * var(--sidepanel-padding)));
    opacity: 1;
  }

  .logo-note {
    width: var(--sidepanel-header-icon-width);
    height: var(--sidepanel-header-icon-height);
    opacity: 0;
  }

  &:focus-visible {
    outline: solid 2px var(--color-neutral-100);
    outline-offset: -2px;
  }
}

.l-sidebar.collapsed .musix-logo.musix-logo-toggle {
  width: var(--sidepanel-header-collapsed-width);
  height: var(--sidepanel-header-collapsed-height);
  border-radius: var(--sidepanel-header-collapsed-radius);

  .logo-wordmark {
    opacity: 0;
  }

  .logo-note {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .musix-logo.musix-logo-toggle,
  .musix-logo.musix-logo-toggle svg {
    transition: none;
  }
}
</style>
