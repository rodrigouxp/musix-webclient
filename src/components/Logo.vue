<template>
  <router-link class="musix-logo rounded-md" :to="{ name: 'Home' }" aria-label="MUSIX"> <LogoSvg /> </router-link>
</template>

<script setup lang="ts">
import LogoSvg from "@/assets/icons/logos/musix.svg";
</script>

<style lang="scss">
// The header of the side panel (SidePanel > header): the MUSIX wordmark of the Figma centered on a
// rounded block. The sizes and the colors are the tokens --sidepanel-header-* (_musix-tokens.scss).
.musix-logo,
.musix-logo.rounded-md {
  height: var(--sidepanel-header-height);
  color: var(--color-neutral-white);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--sidepanel-header-padding);
  border-radius: var(--sidepanel-header-radius);
  background-color: var(--sidepanel-header-bg);
  transition: background-color 0.2s ease-out;

  // the wordmark keeps its proportion and shrinks if the panel gets narrower than the Figma
  svg {
    width: min(100%, var(--sidepanel-logo-width));
    height: auto;
  }

  &:hover {
    background-color: $gray5;
  }
}
</style>
