<template>
  <div
    class="playlist-info"
    :style="{
      color: textColor,
    }"
  >
    <div class="btns">
      <Buttons :text-color="textColor" />
    </div>
    <div class="duration">
      {{ $t('Common.TrackCount', { count: playlist.info.count.toLocaleString() }, playlist.info.count) }}
      •
      {{ formatSeconds(playlist.info.duration, true) }}
    </div>
    <div ref="test_elem"></div>
    <div class="name-row">
      <input
        v-if="renaming"
        ref="nameInput"
        v-model="newName"
        class="title title-input"
        type="text"
        spellcheck="false"
        autocomplete="off"
        :aria-label="$t('PlaylistView.RenamePlaylist')"
        @keydown.enter.prevent="saveName"
        @keydown.esc.prevent="stopRenaming"
        @blur="onBlur"
      />
      <div v-else class="title ellip2">
        <span v-for="t in balanceText(playlist.info.name, room, '4rem')" :key="t">
          {{ t }}
          <br />
        </span>
      </div>
      <NameEditButton
        v-if="canRename && !renaming"
        :label="$t('PlaylistView.RenamePlaylist')"
        @click="playlist.renaming = true"
      />
    </div>
    <div class="type">{{ $t('Common.Playlist') }}</div>
  </div>
</template>
<script setup lang="ts">
import { storeToRefs } from "pinia";
import { Ref, computed, nextTick, ref, watch } from "vue";

import { updatePlaylistInfo } from "@/requests/playlists";
import { NotifType, useToast } from "@/stores/notification";
import { formatSeconds } from "@/utils";
import updatePageTitle from "@/utils/updatePageTitle";

import NameEditButton from "@/components/shared/NameEditButton.vue";
import Buttons from "./Buttons.vue";
import usePStore from "@/stores/pages/playlist";
import usePlaylistsStore from "@/stores/pages/playlists";
import { balanceText } from "@/utils/balanceText";

const playlist = usePStore();
const playlists = usePlaylistsStore();
const { renaming } = storeToRefs(playlist);

defineProps<{
  textColor: string;
  btn_color?: string;
}>();

const test_elem: Ref<HTMLElement | null> = ref(null);
const nameInput: Ref<HTMLInputElement | null> = ref(null);
const newName = ref("");
let saving = false;

// special playlists ("recently added") are not renamed
const canRename = computed(() => Number.isInteger(playlist.info.id));

// the room the pencil takes next to the title (2.25rem and the gap), so the lines keep their balance
const EDIT_BTN_SPACE = 44;
const room = computed(() => (test_elem.value?.offsetWidth || 0) - (canRename.value ? EDIT_BTN_SPACE : 0));

// the field starts with the current name selected (also when the page opens already renaming: the
// "Rename" of the side panel opens the playlist and then asks for the field)
watch(
  renaming,
  async (on) => {
    if (!on) return;

    newName.value = playlist.info.name;
    await nextTick();
    nameInput.value?.focus();
    nameInput.value?.select();
  },
  { immediate: true }
);

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

  if (name === playlist.info.name) {
    stopRenaming();
    return;
  }

  saving = true;
  const result = await updatePlaylistInfo(playlist.info.id, { name });
  saving = false;

  if ("error" in result) {
    // a name that is taken (409) and the other errors: the field stays open
    useToast().showNotification(result.error, NotifType.Error);
    nameInput.value?.focus();
    return;
  }

  playlist.updatePInfo(result.playlist);
  updatePageTitle(result.playlist.name);
  playlists.fetchAll();
  stopRenaming();
}
</script>

<style lang="scss">
.playlist-info {
  width: 100%;
  height: 100%;
  display: grid;
  z-index: 10;
  padding: 0 1.25rem;
  display: flex;
  flex-direction: column-reverse;

  .type {
    font-size: small;
    font-weight: 700;
    opacity: 0.85;
  }

  .name-row {
    display: flex;
    align-items: flex-end;
    gap: $small;
    min-width: 0;

    // the title and the pencil are centered together, as the title was
    @include largePhones {
      justify-content: center;
    }
  }

  .title {
    font-size: 4rem;
    font-weight: 1000;
    cursor: text;
    min-width: 0;
  }

  // the field that takes the place of the title
  .title-input {
    width: 100%;
    padding: 0;
    background: transparent;
    border: none;
    border-bottom: solid 2px currentColor;
    border-radius: 0;
    color: inherit;
    font-family: inherit;
    line-height: 1.2;
    outline: none;
  }

  .duration {
    font-size: 0.8rem;
    padding: $smaller;
    padding-left: 0;
    font-weight: 900;
    cursor: text;
    opacity: 0.85;
  }

  .btns {
    margin-top: $small;
    display: flex;
    gap: $small;

    // small screens: the title and the info are centered, so are the buttons (as in the album banner)
    @include largePhones {
      justify-content: center;
    }
  }
}
</style>
