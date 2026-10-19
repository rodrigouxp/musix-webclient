<template>
  <h2 class="simple-nav-title" style="margin: 0">{{ text }}</h2>
</template>

<script setup lang="ts">
defineProps<{
  text: string;
}>();
</script>

<style lang="scss">
.simple-nav-title {
  // long names (an artist, for example) are cut with an ellipsis instead of covering the search;
  // contain: inline-size keeps the text from asking the top bar for more room
  min-width: 3rem;
  contain: inline-size;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;

  @include mediumPhones {
    font-size: 1.3rem;
  }
}
</style>
