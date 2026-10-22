<template>
  <div
    class="p-header image rounded-lg use-sqr_img"
    :style="[
      {
        background: bg,
        height: `${isSmallPhone ? '24rem' : '18rem'}`,
      },
    ]"
  >
    <div
      class="album-header-ambient rounded-lg"
      style="height: 100%; width: 100%"
      :style="{
        // hide shadow on small screen
        boxShadow: isSmallPhone ? '' : colors.bg ? `0 .5rem 2rem ${colors.bg}` : '0 .5rem 2rem black',
      }"
    ></div>

    <div class="sqr_img cover rounded-sm no-scroll">
      <img v-if="info.has_image" :src="(info.image as string)" />
      <BannerImages v-else-if="info.count && info.images.length" />
      <img v-else :src="placeholder" class="placeholder" />

      <div v-if="canEditPhoto" ref="photoMenuParent" class="photo-edit">
        <button
          class="photo-edit-btn"
          :title="$t('PlaylistView.EditPhoto')"
          :aria-label="$t('PlaylistView.EditPhoto')"
          :disabled="busy"
          @click="menuOpen = !menuOpen"
          v-html="EditIcon"
        ></button>
        <div v-if="menuOpen" class="photo-menu rounded shadow-sm">
          <button @click="chooseFile">{{ $t('PlaylistView.UploadPhoto') }}</button>
          <button v-if="info.has_image" @click="removePhoto">{{ $t('PlaylistView.RemovePhoto') }}</button>
        </div>
        <input
          ref="fileInput"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          hidden
          @change="onFileChosen"
        />
      </div>
    </div>
    <Info :text-color="textColor" :btn_color="colors.btn" />
    <LastUpdated />
  </div>
</template>

<script setup lang="ts">
import { onClickOutside } from "@vueuse/core";
import { storeToRefs } from "pinia";
import { Ref, computed, ref } from "vue";

import { paths } from "@/config";
import { EditIcon } from "@/icons";
import { useT } from "@/i18n";
import { updatePlaylistInfo } from "@/requests/playlists";
import { isSmallPhone } from "@/stores/content-width";
import { NotifType, useToast } from "@/stores/notification";
import usePStore from "@/stores/pages/playlist";
import usePlaylistsStore from "@/stores/pages/playlists";
import { getTextColor } from "@/utils/colortools/shift";

import BannerImages from "./Header/BannerImages.vue";
import Info from "./Header/Info.vue";
import LastUpdated from "./Header/LastUpdated.vue";

const { t } = useT();
const playlist = usePStore();
const playlists = usePlaylistsStore();

const { info, colors } = storeToRefs(playlist);

// the cover of a playlist with no photo and no tracks: the placeholder of the artists (the server
// answers it for a name that does not exist)
const placeholder = paths.images.artist.large + "playlist-placeholder";

// special playlists ("recently added") have no photo to change
const canEditPhoto = computed(() => Number.isInteger(info.value.id));
const menuOpen = ref(false);
const busy = ref(false);
const fileInput: Ref<HTMLInputElement | null> = ref(null);
const photoMenuParent: Ref<HTMLElement | null> = ref(null);

onClickOutside(photoMenuParent, () => (menuOpen.value = false));

function chooseFile() {
  fileInput.value?.click();
  menuOpen.value = false;
}

async function onFileChosen(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";

  if (!file) return;

  busy.value = true;
  const result = await updatePlaylistInfo(info.value.id, { image: file });
  busy.value = false;

  const toast = useToast();

  if ("error" in result) {
    toast.showNotification(result.error, NotifType.Error);
    return;
  }

  playlist.updatePInfo(result.playlist);
  playlists.fetchAll();
  toast.showNotification(t("PlaylistView.PhotoUpdated"), NotifType.Success);
}

async function removePhoto() {
  menuOpen.value = false;
  busy.value = true;
  await playlist.removeBanner();
  busy.value = false;
  playlists.fetchAll();
}

const bg = computed(() => {
  // hide background on small screen
  if (isSmallPhone.value) {
    return "";
  }

  // no color to take from a photo or the albums: the neutral color of the design system
  return colors.value.bg ? colors.value.bg : "var(--color-neutral-900)";
});

const textColor = computed(() => {
  if (colors.value.bg !== "") {
    // @ts-ignore
    return getTextColor(colors.value.bg);
  }

  return "";
});
</script>

<style lang="scss">
.p-header {
  display: grid;
  grid-template-columns: 1fr;
  position: relative;
  background-position: center 50%;
  background-size: cover !important;
  padding-bottom: 1rem;

  .album-header-ambient {
    position: absolute;
    opacity: 0.25;
  }

  &.use-sqr_img {
    grid-template-columns: max-content 1fr;
    align-items: flex-end;

    .title {
      font-size: 3.75rem !important;
    }

    @include largePhones {
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      align-items: flex-start;
      gap: 1rem;

      // take up the space left by the gradient element
      height: 25rem !important;


      .playlist-info {
        text-align: center;
        height: max-content;
      }

      .sqr_img {
        height: 12rem;
        width: 12rem;
        margin-top: 1rem;
        margin: 0 auto;
      }

      .title {
        font-size: 2rem !important;
      }
    }
  }

  .sqr_img {
    height: 16rem;
    width: 16rem;
    z-index: 100;
    margin-left: 1rem;
    position: relative;

    img {
      height: 100%;
      width: 100%;
      object-fit: cover;
    }
  }

  // the change photo button and its menu: the ones of the artist page
  .photo-edit {
    position: absolute;
    right: 1rem;
    bottom: 1rem;
    z-index: 20;

    .photo-edit-btn {
      height: 2.25rem;
      width: 2.25rem;
      padding: 0;
      display: grid;
      place-items: center;
      border-radius: 50%;
      opacity: 0;
      transition: opacity 0.15s ease;

      svg {
        height: 18px;
        width: 18px;
      }
    }

    .photo-menu {
      position: absolute;
      right: 0;
      bottom: 2.75rem;
      min-width: 15rem;
      padding: $small;
      display: grid;
      gap: $smaller;
      background-color: $black;
      text-align: left;

      button {
        width: 100%;
        text-align: left;
      }
    }
  }

  &:hover .photo-edit .photo-edit-btn,
  .photo-edit:focus-within .photo-edit-btn {
    opacity: 1;
  }

  @media (hover: none) {
    .photo-edit .photo-edit-btn {
      opacity: 1;
    }
  }

  @include largePhones {
    .title {
      font-size: 2.5rem !important;
    }
  }
}
</style>
