<template>
  <router-link
    v-for="playlist in pinned"
    :key="playlist.id"
    :to="{ name: 'PlaylistView', params: { pid: playlist.id } }"
    class="circular pinned-playlist"
    :title="playlist.name"
    @contextmenu="showMenu($event, playlist)"
  >
    <img :src="coverOf(playlist)" alt="" class="pinned-cover" :class="{ border: !hasCover(playlist) }" />
    <span>{{ playlist.name }}</span>
  </router-link>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from "vue";

import { paths } from "@/config";
import { showPlaylistCardContextMenu } from "@/helpers/contextMenuHandler";
import { Playlist } from "@/interfaces";
import { router } from "@/router";
import useAuth from "@/stores/auth";
import usePlaylistPage from "@/stores/pages/playlist";
import usePlaylistsStore from "@/stores/pages/playlists";

const store = usePlaylistsStore();
const auth = useAuth();

// the same order as the group "Pinned" of the Playlists page: the one the server gives
const pinned = computed(() => store.playlists.filter((p) => p.pinned));

const hasCover = (playlist: Playlist) => playlist.has_image || !!playlist.images?.length;

// The cover is the one of the card of the playlist (`PlaylistCard`): its own image or, when it has none,
// the collage of the albums; the collage does not fit in 28 px, so it is its first image.
function coverOf(playlist: Playlist) {
  if (!playlist.has_image && playlist.images?.length) {
    const first: any = playlist.images[0];
    return paths.images.thumb.smallish + (first["image"] || first);
  }

  return paths.images.playlist + playlist.thumb;
}

// the right click is the menu of the card (pin, rename, add to queue, delete); "Rename" opens the
// playlist with its title in a text field, because the panel has no field of its own
function showMenu(e: MouseEvent, playlist: Playlist) {
  if (!Number.isInteger(playlist.id)) return;

  e.preventDefault();
  showPlaylistCardContextMenu(e, playlist, async () => {
    await router.push({ name: "PlaylistView", params: { pid: playlist.id } });
    usePlaylistPage().renaming = true;
  });
}

// The panel is always on screen: it asks for the playlists once, without waiting for the Playlists
// page. Pinning, renaming, changing the cover or deleting one (anywhere) already reload the store.
let asked = false;

function load() {
  if (asked) return;

  asked = true;
  store.fetchAll();
}

onMounted(() => {
  // before the login there is no user: it is asked when the user shows up
  if (auth.user?.id !== undefined) load();
});

watch(
  () => auth.user?.id,
  (id) => {
    if (id !== undefined) load();
  }
);
</script>

<style lang="scss">
// A pinned playlist (SidePanel > playlists > playlist of the Figma): 28 of height, padding 0 12, 8 between
// the cover (28, corners 4) and the name (Roboto Medium 14, line 20, white).
.sidepanel-nav .pinned-playlist {
  display: flex;
  align-items: center;
  gap: var(--sidepanel-playlist-gap);
  width: 100%;
  height: var(--sidepanel-playlist-height);
  flex-shrink: 0;
  padding: 0 var(--sidepanel-playlist-padding-x);
  font-family: var(--sidepanel-font);
  font-size: var(--sidepanel-font-size);
  font-weight: var(--sidepanel-playlist-weight);
  line-height: var(--sidepanel-playlist-line-height);
  color: var(--sidepanel-playlist-color);
  text-transform: none;
  transition: background-color 0.2s ease-out;

  .pinned-cover {
    flex-shrink: 0;
    width: var(--sidepanel-playlist-cover-size);
    height: var(--sidepanel-playlist-cover-size);
    border-radius: var(--sidepanel-playlist-cover-radius);
    object-fit: cover;
  }

  span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &:hover {
    background-color: $gray;
  }

  &:focus-visible {
    outline: solid 2px var(--color-neutral-100);
    outline-offset: -2px;
  }
}
</style>
