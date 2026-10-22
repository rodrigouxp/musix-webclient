<template>
  <div
    class="index t-center ellip"
    @click.prevent="!reorderable && $emit('addToFav')"
    @dblclick.prevent.stop="() => {}"
    :class="{ 'ready': !showInlineFavIcon && !reorderable, reorderable }"
  >
    <div class="text">
      {{ index }}
    </div>
    <!-- a playlist: the number turns into the handle to drag the row (and the click does not favorite) -->
    <div
      v-if="reorderable"
      class="drag-icon"
      @pointerenter="$emit('dragHover')"
      @pointerdown="$emit('dragStart', $event)"
      v-html="DragIcon"
    ></div>
    <div class="heart-icon" v-else-if="!showInlineFavIcon">
      <HeartSvg :state="is_fav" :no_emit="true" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { DragIcon } from "@/icons";
import HeartSvg from "../HeartSvg.vue";

defineProps<{
  index: number | string;
  is_fav: boolean | undefined;
  showInlineFavIcon: boolean;
  reorderable?: boolean;
}>();

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

  // the handle of the rows that can be dragged: it takes the place of the number on the hover
  .drag-icon {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    opacity: 0;
    cursor: grab;
    touch-action: none;
    color: var(--menu-item-icon);
    transition: opacity 0.2s;

    svg {
      height: 1.25rem;
      width: 1.25rem;
    }
  }

  &.reorderable {
    cursor: grab;
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

.songlist-item:hover > .index.reorderable {
  .text {
    opacity: 0;
  }

  .drag-icon {
    opacity: 1;
  }
}
</style>
