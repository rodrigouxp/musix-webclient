<template>
  <button
    class="pluginfindlyricsbtn circular"
    :class="{ showError: plugin.error }"
    @click="!plugin.error ? plugin.searchLyrics() : null"
  >
    <span v-if="plugin.error">{{ plugin.error }}</span>
    <span v-else-if="plugin.loading">{{ $t('Views.LyricView.Searching') }}</span>
    <span v-else>{{ $t('Views.LyricView.SearchOnline') }}</span>
    <span v-if="plugin.loading" class="spinner"></span>
  </button>
</template>

<script setup lang="ts">
import useLyricsPlugin from "@/stores/plugins/lyrics";

const plugin = useLyricsPlugin();
</script>

<style lang="scss">
.pluginfindlyricsbtn {
  padding: 1.5rem 2rem;
  font-size: 1rem !important;
  background-color: $white;
  color: $black;
  margin-top: 1rem;
  // a long message (the reason of an error) goes to a second line instead of widening the page
  max-width: 100%;
  white-space: normal;
  overflow-wrap: anywhere;
  line-height: 1.3;
  text-align: center;

  &:hover {
    background-color: $white;
    color: $black;
  }

  .spinner {
    margin-left: $medium;
    height: 1rem;
    width: 1rem;
  }

  &.showError {
    background-color: transparent;
    color: $white;
    background-color: $gray4;
  }
}
</style>
