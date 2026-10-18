<template>
  <div
    id="context-menu"
    ref="contextMenuRef"
    class="context-menu rounded shadow-lg no-select"
    :class="{ wide: context.options.some(o => o.menuIcon) }"
    :style="{
      visibility: context.visible ? 'visible' : 'hidden',
      opacity: context.visible ? '1' : '0',
    }"
  >
    <ContextItem
      v-for="(option, index) in context.options"
      :key="`${option.type ?? 'item'}-${index}-${option.label ?? ''}`"
      class="context-item"
      :class="[{ critical: option.critical, 'menu-icon': option.menuIcon, icon18: option.icon18, inset: option.inset }, option.type]"
      :option="option"
      :children-show-mode="settings.contextChildrenShowMode"
      @hideContextMenu="context.hideContextMenu()"
    />
  </div>
</template>

<script setup lang="ts">
import { onClickOutside } from "@vueuse/core";
import { ref } from "vue";

import useContextStore from "@/stores/context";
import useSettingsStore from "@/stores/settings";

import ContextItem from "./Contextmenu/ContextItem.vue";

const context = useContextStore();
const settings = useSettingsStore();
const contextMenuRef = ref<HTMLElement>();

let watcher: any = null;

context.$subscribe((mutation, state) => {
  if (state.visible) {
    setTimeout(() => {
      if (watcher !== null) {
        watcher();
      }
      watcher = onClickOutside(
        contextMenuRef,
        (e: any) => {
          if (e.type == "pointerup") return;
          context.hideContextMenu();
        },
        {
          capture: false,
        }
      );
    }, 200);
    return;
  }

  if (watcher !== null) {
    watcher();
  }
});
</script>

<style lang="scss">
.context-menu {
  position: fixed;
  top: 0;
  left: 0;
  width: 13rem;
  z-index: 1000 !important;
  height: min-content;
  padding: $small;
  background: var(--menu-bg);
  transform-origin: top left;
  font-size: 0.875rem;
  font-weight: 500;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.25s ease-out, visibility 0.25s ease-out;

  // the radius and the shadow of the menu come from the tokens (all menus)
  &.rounded {
    border-radius: var(--menu-radius);
  }

  &.shadow-lg {
    box-shadow: var(--menu-shadow);
  }

  // the album menu of the prototype; the other menus keep 13rem and their padding
  &.wide {
    width: var(--menu-width);
    padding: var(--menu-padding-y) var(--menu-padding-x);
  }

  // the color of the line of every separator
  .separator {
    border-top-color: var(--menu-divider);
  }

  .separator {
    height: 1px;
    padding: 0;
    margin-left: -$medium;
    width: calc(100% + $medium * 2);
    pointer-events: none;
  }

  // the thin separator of the album menu: the width of the items, with the gap of the
  // prototype above and below, so the hover of an item never touches the line
  .separator.inset {
    height: 0;
    min-height: 0;
    padding: 0;
    margin: var(--menu-gap) 0;
    width: 100%;
    overflow: hidden;
    border-top: var(--menu-divider-width) solid var(--menu-divider);
    border-radius: 0;
    box-sizing: content-box;
  }

  .critical {
    color: $red;
    transition: background-color 0.2s ease-out, color 0.2s ease-out;

    &:hover {
      background-color: $red;
      color: $white;
    }
  }
}
</style>
