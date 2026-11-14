<template>
  <div
    class="index t-center ellip"
    @click.prevent="!reorderable && !panel && $emit('addToFav')"
    @dblclick.prevent.stop="() => {}"
    :class="{ 'ready': !showInlineFavIcon && !reorderable && !panel, reorderable, held, panel }"
    @pointerdown="rememberPointer"
    @contextmenu="stopTouchMenu"
  >
    <div class="text">
      {{ index }}
    </div>
    <!-- a playlist: the number is the handle to drag the row (and the click does not favorite). The handle has no
         icon (Rodrigo, 2026-11-14): with the mouse it works on the hover; with a finger, on a long press (see useTrackDrag) -->
    <div
      v-if="reorderable"
      class="drag-icon"
      @pointerenter="$emit('dragHover')"
      @pointerdown="$emit('dragStart', $event)"
    ></div>
    <div class="heart-icon" v-else-if="!showInlineFavIcon">
      <HeartSvg :state="is_fav" :no_emit="true" />
    </div>
  </div>
</template>

<script setup lang="ts">
import HeartSvg from "../HeartSvg.vue";

const props = defineProps<{
  index: number | string;
  is_fav: boolean | undefined;
  showInlineFavIcon: boolean;
  reorderable?: boolean;
  // the row is being dragged: the number is already the handle
  held?: boolean;
  // the row of the panels of the Figma (artist page)
  panel?: boolean;
}>();

// The long press of a finger opens the menu of the song on Android (the row listens to
// `contextmenu`): not on the number, where the long press is the start of the drag.
let lastPointer = "";

function rememberPointer(e: PointerEvent) {
  lastPointer = e.pointerType;
}

function stopTouchMenu(e: MouseEvent) {
  if (props.reorderable && (lastPointer === "touch" || lastPointer === "pen")) {
    e.preventDefault();
    e.stopPropagation();
  }
}

defineEmits<{
  (e: "addToFav"): void;
  (e: "dragStart", event: PointerEvent): void;
  (e: "dragHover"): void;
}>();
</script>

<style lang="scss">
.songlist-item > .index {
  font-size: 0.8rem;
  width: 100%;
  position: relative;
  height: 3rem;
  display: flex;
  justify-content: center;

  .text {
    opacity: 0.5;
    margin: auto 0;
    transform: translateX($smaller);

    transition: all 0.25s;
    width: 100%;
  }

  // the handle of the rows that can be dragged: the whole cell of the number, with no icon
  .drag-icon {
    position: absolute;
    inset: 0;
    cursor: grab;
  }

  &.reorderable {
    cursor: grab;
    // a long press on the number is not a text selection or an iOS menu
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    user-select: none;
  }

  .heart-icon {
    position: absolute;
    left: -2px;
    display: grid;
    height: 100%;
    align-content: center;
    transition: all 0.2s;
    transform: translateX(-1.5rem);

    button {
      border: none;
      width: 2rem;
      height: 2rem;
      padding: 0;
      background-color: transparent;
    }
  }
}

</style>
