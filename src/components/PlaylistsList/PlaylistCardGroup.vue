<template>
  <div class="playlistcardgroup">
    <h3>{{ title }}</h3>
    <div class="grid">
      <PlaylistCard
        v-for="(p, index) in playlists"
        :key="p.id"
        :playlist="p"
        :reorder="reorderable ? reorder : undefined"
        :index="index"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import PlaylistCard from "@/components/PlaylistsList/PlaylistCard.vue";
import useReorder from "@/composables/useReorder";
import usePlaylistsStore from "@/stores/pages/playlists";
import { Playlist } from "@/interfaces";

const props = defineProps<{
  playlists: Playlist[];
  title: string;
  // the cards can be dragged to another position (not while the list is filtered by a search)
  pinned: boolean;
  reorderable?: boolean;
}>();

const store = usePlaylistsStore();

const reorder = useReorder({
  itemSelector: ".p-card",
  layout: "grid",
  onDrop: (from, to) => store.moveInGroup(props.pinned, from, to),
});
</script>

<style lang="scss">
.playlistcardgroup {
  margin-bottom: 4rem;
  h3 {
    margin-left: $medium;
  }
}
</style>
