<template>
  <!-- the footer of the SidePanel (Penpot: SidePanel > content > settings and user): Settings and the user, 8 apart -->
  <div class="sidepanel-footer">
    <button
      v-wave
      class="footer-item footer-settings"
      type="button"
      :aria-label="settings.side_panel_collapsed ? label : undefined"
      :title="settings.side_panel_collapsed ? label : undefined"
      @click="modal.showSettingsModal()"
    >
      <span class="footer-slot"><SettingsSvg /></span>
      <span class="footer-label">{{ label }}</span>
    </button>
    <SidePanelUser />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import SettingsSvg from "@/assets/icons/figma/settings.svg";
import { useT } from "@/i18n";
import useModal from "@/stores/modal";
import useSettings from "@/stores/settings";
import SidePanelUser from "./SidePanelUser.vue";

const { t } = useT();
const modal = useModal();
const settings = useSettings();

// the same action as "Settings" in the user menu (ProfileDropdown): the settings modal
const label = computed(() => t("Common.Settings"));
</script>

<style lang="scss">
// The footer of the Penpot SidePanel. Open: Settings is 40 high (icon of 24, padding 8) and the user is 40 (photo of 24); closed:
// Settings is 36 (icon of 20, like the navigation buttons) and the user is the photo of 36. The sizes are the tokens
// --sidepanel-footer-* and --sidepanel-user-* (_musix-tokens.scss).
.sidepanel-footer {
  display: flex;
  flex-direction: column;
  gap: var(--sidepanel-footer-gap);
}

// the row of both buttons (Settings and the user)
.sidepanel-footer .footer-item {
  display: flex;
  align-items: center;
  // a button centers its content by default
  justify-content: flex-start;
  gap: var(--sidepanel-item-gap);
  width: 100%;
  height: var(--sidepanel-footer-item-height);
  box-sizing: border-box;
  flex-shrink: 0;
  padding: var(--sidepanel-item-padding);
  border: none;
  border-radius: var(--sidepanel-item-radius);
  background-color: transparent;
  color: var(--sidepanel-nav-color);
  text-align: left;
  cursor: pointer;
  // the panel collapses to 36 of content: what does not fit (the name) is clipped, not wrapped
  overflow: hidden;
  transition:
    background-color 0.2s ease-out,
    height var(--panel-toggle-transition),
    padding var(--panel-toggle-transition);

  .footer-label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    transition: opacity var(--panel-toggle-duration) ease-in-out;
  }

  &:hover {
    background-color: $gray;
  }

  @include press;

  &:focus-visible {
    outline: solid 2px var(--color-neutral-100);
    outline-offset: -2px;
  }
}

.sidepanel-footer .footer-settings {
  @include text('action-button-14px');

  // the icon is the SVG of 24 at its natural size (the glyph of 18 x 20); the slot is 24 open and 20 closed
  // (flex centers what overflows its box on both sides; a grid would pin it to the start)
  .footer-slot {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: var(--sidepanel-footer-icon-slot);
    height: var(--sidepanel-footer-icon-slot);
    transition:
      width var(--panel-toggle-transition),
      height var(--panel-toggle-transition);

    svg {
      flex-shrink: 0;
      width: var(--sidepanel-icon-size);
      height: var(--sidepanel-icon-size);
    }
  }
}

.l-sidebar.collapsed .sidepanel-footer {
  .footer-settings {
    height: var(--sidepanel-footer-settings-collapsed-height);

    .footer-slot {
      width: var(--sidepanel-icon-slot);
      height: var(--sidepanel-icon-slot);
    }
  }

  .footer-label {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sidepanel-footer .footer-item,
  .sidepanel-footer .footer-item .footer-label,
  .sidepanel-footer .footer-settings .footer-slot {
    transition: none;
  }
}
</style>
