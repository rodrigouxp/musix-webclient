<template>
  <Motion
    :key="q.currenttrack?.trackhash"
    :initial="{ opacity: 0, scale: 0.9 }"
    :animate="{
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: 'ease-in' },
    }"
    :exit="{ opacity: 0, scale: 0.9 }"
  >
    <div v-wave class="sidebar-songcard rounded-sm">
      <router-link
        :to="{
          name: Routes.nowPlaying,
          params: {
            tab: 'home',
          },
        }"
      >
        <img
          :src="imguri + q.currenttrack?.image"
          alt=""
          class="l-image rounded-sm"
        />
      </router-link>
      <Bitrate />
    </div>
  </Motion>
</template>

<script setup lang="ts">
import { Motion } from "motion/vue";
import { Routes } from "@/router";

import { paths } from "@/config";
import useQueueStore from "@/stores/queue";

import Bitrate from "./Bitrate.vue";

const imguri = paths.images.thumb.medium;
const q = useQueueStore();
</script>

<style lang="scss">
.l-image {
  width: 100%;
}

// the card of the song (SidePanel > album-art-NowPlaying): as wide as the panel lets it be, and square
.sidebar-songcard,
.sidebar-songcard.rounded-sm {
  width: 100%;
  aspect-ratio: 1;
  position: relative;
  border-radius: var(--sidepanel-art-radius);

  img,
  img.l-image {
    cursor: pointer;
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: var(--sidepanel-art-radius);
  }
}
</style>
