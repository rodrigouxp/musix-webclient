<template>
  <router-link class="musix-logo rounded-md" :to="{ name: 'Home' }"> <LogoSvg /> <span>MUSIX</span> </router-link>
</template>

<script setup lang="ts">
import LogoSvg from "@/assets/icons/logos/note.svg";
</script>

<style lang="scss">
.musix-logo {
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: $medium;
  padding-left: 1rem;
  border: solid 1px $gray5;
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
