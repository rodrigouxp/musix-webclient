<template>
  <router-link class="musix-logo rounded-md" :to="{ name: 'Home' }"> <LogoSvg /> <span>MUSIX</span> </router-link>
</template>

<script setup lang="ts">
import LogoSvg from "@/assets/icons/logos/note.svg";
</script>

<style lang="scss">
// The header of the side panel (SidePanel > header): the height, the corners, the padding and the space
// are the ones of the Figma; the gradient and the border stay the ones of the app for now.
.musix-logo,
.musix-logo.rounded-md {
  height: var(--sidepanel-header-height);
  font-family: var(--sidepanel-font);
  font-size: var(--sidepanel-font-size);
  font-weight: var(--sidepanel-title-weight);
  text-transform: uppercase;
  color: var(--color-neutral-white);
  display: flex;
  align-items: center;
  gap: var(--sidepanel-header-gap);
  padding: var(--sidepanel-header-padding);
  border: solid 1px $gray5;
  border-radius: var(--sidepanel-header-radius);
  background-image: linear-gradient(37deg, rgb(29, 28, 28), transparent);
  transition: background-color 0.2s ease-out;

  svg {
    width: 2rem;
    height: 2rem;
  }

  &:hover {
    background-color: $gray5;
  }
}
</style>
