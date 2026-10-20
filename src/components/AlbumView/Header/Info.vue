<template>
  <div class="album-info" :style="{ color: textColor }">
    <div class="top">
      <!-- <AlbumType :album="album" /> -->
      <div class="albumtype">{{ album.type }}</div>
      <div class="title-row">
        <div id="albumheadertitle" class="title ellip2">
          <span v-for="t in titleSplits" :key="t">{{ t }}<br /></span>
        </div>
        <button
          v-if="canRename"
          class="name-edit-btn"
          :title="$t('AlbumView.RenameAlbum.EditName')"
          :aria-label="$t('AlbumView.RenameAlbum.EditName')"
          @click="renaming = true"
          v-html="EditIcon"
        ></button>
      </div>
      <RenameAlbumDialog
        v-if="renaming"
        :albumhash="album.albumhash"
        :album-title="album.og_title"
        @close="renaming = false"
      />
    </div>
    <div class="bottom">
      <div id="test-elem"></div>
      <Versions :color="colors.bg" :versions="album.versions" />
      <Stats :album="album" />
      <Buttons :text-color="textColor || ''" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed, onMounted, ref, watch } from "vue";
import { onBeforeRouteUpdate } from "vue-router";

import { EditIcon } from "@/icons";
import { balanceText } from "@/utils/balanceText";
import { getTextColor } from "@/utils/colortools/shift";

import useAlbumStore from "@/stores/pages/album";
import useAuth from "@/stores/auth";
import updatePageTitle from "@/utils/updatePageTitle";

import Stats from "./Stats.vue";
import Buttons from "./Buttons.vue";
import Versions from "./Versions.vue";
import AlbumType from "./AlbumType.vue";
import RenameAlbumDialog from "../RenameAlbumDialog.vue";

const store = useAlbumStore();

const { info: album, colors } = storeToRefs(store);
const titleSplits = ref([""]);

// admins can rename the album, on the album page only (this header is only there)
const canRename = computed(() => useAuth().is_admin);
const renaming = ref(false);

// the room the pencil takes next to the title (2.25rem and the gap), so the lines keep their balance
const EDIT_BTN_SPACE = 44;

const textColor = computed((): string => {
  if (colors.value.bg) {
    return getTextColor(colors.value.bg);
  }

  return "";
});

const updateTitle = () => {
  updatePageTitle(album.value.title + " - " + album.value.albumartists[0].name);
  const elem = document.getElementById("test-elem");
  const room = (elem?.offsetWidth || 0) - (canRename.value ? EDIT_BTN_SPACE : 0);
  titleSplits.value = balanceText(album.value.title, room);
};

onMounted(() => {
  updateTitle();
});

onBeforeRouteUpdate(() => {
  updateTitle();
});

// the album was renamed: the title on the screen and the title of the tab follow
watch(() => album.value.title, updateTitle);
</script>

<style lang="scss">
.album-info {
  img {
    height: 6rem;
    aspect-ratio: 1;
    object-fit: cover;
    user-select: none;
  }

  .top {
    .albumtype {
      font-size: 14px;
      font-weight: 700;
      text-transform: capitalize;
    }

    .title-row {
      display: flex;
      align-items: flex-end;
      gap: $small;
      min-width: 0;

      .name-edit-btn {
        flex-shrink: 0;
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

      &:hover .name-edit-btn,
      .name-edit-btn:focus-visible {
        opacity: 1;
      }

      @media (hover: none) {
        .name-edit-btn {
          opacity: 1;
        }
      }

      @include largePhones {
        justify-content: center;
      }
    }

    .title {
      font-size: 2.75rem;
      font-weight: 700;
      width: fit-content;
      min-width: 0;
      cursor: text;
    }

    .artist {
      font-size: 1.15rem;
    }
  }

  .bottom {
    margin-top: $smaller;

    .stats2 {
      text-align: center;
      margin: 0;
    }

    .versions {
      margin-bottom: $medium;
      margin-left: -$smaller;

      // &:first-child {}
      // .master-flag {
      //   background-color: transparent !important;
      //   border: solid 1px !important;
      // }
    }
  }
}
</style>
