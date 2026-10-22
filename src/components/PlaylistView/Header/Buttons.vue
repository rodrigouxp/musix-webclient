<template>
  <!-- play, favorite and the three dots: the same buttons of the album banner. The special
       playlists ("recently added") only have the play button. -->
  <div class="playlist-buttons">
    <PlayBtnRect :source="playSources.playlist" :bg_color="colors.btn" />

    <template v-if="isUserPlaylist">
      <HeartSvg
        :state="info.is_favorite"
        :color="colors.bg ? colors.bg : ''"
        @handleFav="togglePlaylistFavorite(info.id)"
      />
      <button class="options" :class="{ context_menu_showing }" @click.prevent="showContextMenu">
        <MoreSvg
          :style="{
            color: textColor,
          }"
        />
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed, ref } from "vue";

import { playSources } from "@/enums";
import { showPlaylistContextMenu } from "@/helpers/contextMenuHandler";
import { togglePlaylistFavorite } from "@/helpers/playlistActions";
import usePlaylistStore from "@/stores/pages/playlist";

import MoreSvg from "@/assets/icons/more.svg";
import HeartSvg from "@/components/shared/HeartSvg.vue";
import PlayBtnRect from "@/components/shared/PlayBtnRect.vue";

const store = usePlaylistStore();
const { info, colors } = storeToRefs(store);

defineProps<{
  textColor: string;
}>();

const isUserPlaylist = computed(() => Number.isInteger(info.value.id));

const context_menu_showing = ref(false);

function showContextMenu(e: MouseEvent) {
  showPlaylistContextMenu(e, context_menu_showing);
}
</script>

<style lang="scss">
.playlist-buttons {
  display: flex;
  gap: $small;

  // small screens: the title and the info are centered, so are the buttons (as in the album banner)
  @include largePhones {
    justify-content: center;
  }

  .options {
    background-color: transparent;
    border: none;

    &.context_menu_showing {
      background-color: $darkblue;

      svg {
        color: $white !important;
      }
    }

    svg {
      transform: scale(1.25);
    }
  }
}
</style>
