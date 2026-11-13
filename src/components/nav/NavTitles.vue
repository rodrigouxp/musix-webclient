<template>
  <div class="info">
    <SettingsTitle v-if="$route.name == Routes.settings" :text="$t('NavTitles.Settings')" />
    <PlaylistsTitle v-if="$route.name == Routes.playlists" />
    <SimpleNav
      v-if="$route.name == Routes.artistTracks"
      :text="$route.query.artist as string || $t('NavTitles.ArtistTracks')"
    />
  </div>
</template>

<script setup lang="ts">
import { Routes } from "@/router";

import SimpleNav from "./Titles/SimpleNav.vue";
import SettingsTitle from "./Titles/SettingsTitle.vue";
import PlaylistsTitle from "./Titles/PlaylistsTitle.vue";
</script>
