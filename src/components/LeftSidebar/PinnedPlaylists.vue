<template>
  <router-link
    v-for="(playlist, index) in pinned"
    :key="playlist.id"
    :to="{ name: 'PlaylistView', params: { pid: playlist.id } }"
    class="pinned-playlist reorderable"
    draggable="false"
    :title="playlist.name"
    :aria-label="settings.side_panel_collapsed ? playlist.name : undefined"
    @pointerdown="reorder.begin($event, index)"
    @contextmenu="showMenu($event, playlist)"
  >
    <img :src="coverOf(playlist)" alt="" draggable="false" class="pinned-cover" :class="{ border: !hasCover(playlist) }" />
    <span>{{ playlist.name }}</span>
  </router-link>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from "vue";

import { paths } from "@/config";
import { showPlaylistCardContextMenu } from "@/helpers/contextMenuHandler";
import { Playlist } from "@/interfaces";
import { router } from "@/router";
import useReorder from "@/composables/useReorder";
import useAuth from "@/stores/auth";
import usePlaylistPage from "@/stores/pages/playlist";
import usePlaylistsStore from "@/stores/pages/playlists";
import useSettings from "@/stores/settings";

const settings = useSettings();
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
  if (reorder.blocksMenu(e)) return;
  if (!Number.isInteger(playlist.id)) return;

  e.preventDefault();
  showPlaylistCardContextMenu(e, playlist, async () => {
    await router.push({ name: "PlaylistView", params: { pid: playlist.id } });
    usePlaylistPage().renaming = true;
  });
}

// The pinned playlists can be dragged to another position (a long press with a finger, a drag with the mouse): the order is
// kept on the server and is the one of the group "Pinned" of the Playlists page. A long press that is let go without moving
// still opens the menu (useReorder sends the `contextmenu` event itself).
const reorder = useReorder({
  itemSelector: ".pinned-playlist",
  layout: "column",
  onDrop: (from, to) => store.moveInGroup(true, from, to),
});

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
// A pinned playlist (SidePanel > playlists > playlist of the Penpot): padding 8 (it was 8 12), corners 4, 8 between the cover
// (28, corners 4) and the name (the text style action-button-14px, white). The hover and the open playlist
// are neutral/700 (Rodrigo, 2026-11-11).
.sidepanel-nav .pinned-playlist {
  display: flex;
  align-items: center;
  gap: var(--sidepanel-playlist-gap);
  width: 100%;
  box-sizing: border-box;
  flex-shrink: 0;
  padding: var(--sidepanel-playlist-padding-y) var(--sidepanel-playlist-padding-x);
  border-radius: var(--sidepanel-item-radius);
  @include text('action-button-14px');
  color: var(--sidepanel-playlist-color);
  text-transform: none;
  // the panel collapses to 36 of content: the name is clipped, not wrapped
  overflow: hidden;
  // the same motion as the panel (the sizes change with it)
  transition:
    background-color 0.2s ease-out,
    padding var(--panel-toggle-transition);

  .pinned-cover {
    flex-shrink: 0;
    width: var(--sidepanel-playlist-cover-size);
    height: var(--sidepanel-playlist-cover-size);
    border-radius: var(--sidepanel-playlist-cover-radius);
    object-fit: cover;
    transition:
      width var(--panel-toggle-transition),
      height var(--panel-toggle-transition);
  }

  span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    transition: opacity var(--panel-toggle-duration) ease-in-out;
  }

  &:hover,
  &.router-link-active {
    background-color: var(--sidepanel-item-active-bg);
  }

  &:focus-visible {
    outline: solid 2px var(--color-neutral-100);
    outline-offset: -2px;
  }
}

// SidePanel Closed (Penpot): each playlist is only the cover, 36 x 36 with no padding (the cover was 18 inside a padding of 8).
// The tokens --sidepanel-playlist-collapsed-* hold these sizes.
.l-sidebar.collapsed .sidepanel-nav .pinned-playlist {
  padding: var(--sidepanel-playlist-collapsed-padding-y) var(--sidepanel-playlist-collapsed-padding-x);

  .pinned-cover {
    width: var(--sidepanel-playlist-collapsed-cover-size);
    height: var(--sidepanel-playlist-collapsed-cover-size);
  }
}

@media (prefers-reduced-motion: reduce) {
  .sidepanel-nav .pinned-playlist,
  .sidepanel-nav .pinned-playlist .pinned-cover,
  .sidepanel-nav .pinned-playlist span {
    transition: none;
  }
}
</style>
