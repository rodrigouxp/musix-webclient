<template>
  <router-link
    :to="{ name: 'PlaylistView', params: { pid: playlist.id } }"
    class="p-card rounded no-scroll"
    @contextmenu="showMenu"
  >
    <div v-if="!playlist.has_image && playlist.images.length" class="image-grid rounded-sm no-scroll">
      <img v-for="(img, index) in playlist.images" :key="index" :src="paths.images.thumb.smallish + (img['image'] || img)" />
      <PlayBtn :source="playSources.playlist" :playlist="playlist.id.toString()"/>
    </div>
    <div v-else class="image">
      <img :src="imguri + playlist.thumb" class="rounded-sm" :class="{ border: !playlist.thumb }" />
      <PlayBtn :source="playSources.playlist" :playlist="playlist.id.toString()"/>
    </div>
    <div class="overlay rounded">
      <div v-if="playlist.help_text" class="rhelp playlist">
        <span class="help">{{ playlist.help_text }}</span>
        <span class="time">{{ playlist.time }}</span>
      </div>
      <input
        v-if="renaming"
        ref="nameInput"
        v-model="newName"
        class="p-name p-name-input"
        type="text"
        spellcheck="false"
        autocomplete="off"
        :aria-label="$t('PlaylistView.RenamePlaylist')"
        @click.prevent.stop
        @keydown.enter.prevent="saveName"
        @keydown.esc.prevent="stopRenaming"
        @blur="onBlur"
      />
      <div v-else class="p-name ellip">{{ playlist.name }}</div>
      <div class="p-count">
        <b>{{ playlist.count.toLocaleString() + $t('Common.Track', playlist.count) }}</b>
      </div>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import { Ref, nextTick, ref } from "vue";

import { paths } from "../../config";
import { Playlist } from "../../interfaces";
import { playSources } from '@/enums'
import { showPlaylistCardContextMenu } from '@/helpers/contextMenuHandler'
import { updatePlaylistInfo } from '@/requests/playlists'
import { NotifType, useToast } from '@/stores/notification'
import usePlaylistPage from '@/stores/pages/playlist'
import usePlaylistsStore from '@/stores/pages/playlists'
import PlayBtn from '../shared/PlayBtn.vue'

const imguri = paths.images.playlist;
const props = defineProps<{
  playlist: Playlist;
}>();

const renaming = ref(false);
const newName = ref("");
const nameInput: Ref<HTMLInputElement | null> = ref(null);
let saving = false;

// the right click: pin, rename and add to queue (the special playlists, like "recently added", have no menu)
function showMenu(e: MouseEvent) {
  if (!Number.isInteger(props.playlist.id)) return;

  e.preventDefault();
  showPlaylistCardContextMenu(e, props.playlist, startRenaming);
}

// the name of the card becomes a text field, with the current name selected
async function startRenaming() {
  newName.value = props.playlist.name;
  renaming.value = true;
  await nextTick();
  nameInput.value?.focus();
  nameInput.value?.select();
}

function stopRenaming() {
  renaming.value = false;
}

// losing the focus cancels (unless it is the save that took it)
function onBlur() {
  if (!saving) stopRenaming();
}

async function saveName() {
  const name = newName.value.trim();

  // an empty name is not saved: the field stays open
  if (!name) return;

  if (name === props.playlist.name) {
    stopRenaming();
    return;
  }

  saving = true;
  const result = await updatePlaylistInfo(props.playlist.id, { name });
  saving = false;

  if ("error" in result) {
    // a name that is taken (409) and the other errors: the field stays open
    useToast().showNotification(result.error, NotifType.Error);
    nameInput.value?.focus();
    return;
  }

  const page = usePlaylistPage();

  if (page.info.id === props.playlist.id) {
    page.info.name = result.playlist.name;
  }

  await usePlaylistsStore().fetchAll();
  stopRenaming();
}
</script>

<style lang="scss">
.p-card {
  background-color: #2c2c2e45;
  display: grid;
  grid-template-rows: 1fr max-content;
  padding: $medium;
  gap: $small;
  user-select: none;
  height: max-content;
  transition: background-color 0.2s ease-out;

  .image {
    position: relative;
  }

  .image-grid {
    display: grid;
    grid: repeat(2, 1fr) / repeat(2, 1fr);
    position: relative;
  }

  &:hover {
    background-color: $gray4 !important;
    background-blend-mode: screen;
  }

  $btnwidth: 4rem;

  .play-btn {
    opacity: 0;
    position: absolute;
    width: 4rem;
    bottom: $small;
    left: calc(50% - ($btnwidth / 2));
    transition: all 0.25s;
  }

  &:hover {
    background-color: $gray4;

    .play-btn {
      opacity: 1;
      transform: translateY(-0.75rem);
    }
  }

  img {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    transition: all 0.5s ease;
  }

  .overlay {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    transition: all 0.25s ease;

    .p-name {
      font-weight: 600;
    }

    // the field that takes the place of the name
    .p-name-input {
      width: 100%;
      padding: 0;
      background: transparent;
      border: none;
      border-bottom: solid 1px currentColor;
      border-radius: 0;
      color: inherit;
      font-family: inherit;
      font-size: inherit;
      outline: none;
    }

    .p-count {
      font-size: 0.75rem;
      color: #ffffffbf;
      margin-top: $smaller;
    }
  }
}
</style>
