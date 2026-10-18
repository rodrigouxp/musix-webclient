<template>
  <div class="content-page artistdiscogview">
    <GenericHeader>
      <template #name>{{ getTypeName(route.params.type) }}</template>
      <template #description>
        <RouterLink
          :to="{
            name: Routes.artist,
            params: {
              hash: route.params.hash,
            },
          }"
          >{{ route.query.artist }}</RouterLink
        >
        • {{ artist.toShow.length }}
        <span class="caps">{{ getTypeString(route.params.type.toString()) }}</span></template
      >
    </GenericHeader>
    <GenericTabs
      :items="
        Object.values(discographyAlbumTypes).filter(showTab).map((type) => ({
          title: type,
          params: {
            hash: route.params.hash,
            type: type,
          },
          query: { artist: route.query.artist },
        }))
      "
      :active="
        (item) => {
          return item.title == route.params.type;
        }
      "
      :route="Routes.artistDiscography"
    /><br />
    <div v-if="artist.toShow.length" class="cards">
      <AlbumCard
        v-for="album in artist.toShow.sort((a, b) => parseInt(b.date) - parseInt(a.date))"
        :key="album.albumhash"
        :album="album"
        :artist_page="true"
        :show_date="true"
      />
    </div>
    <NoItems
      v-else
      :title="$t('Views.ArtistDiscography.NoContributions')"
      :flag="!artist.toShow.length"
      :icon="AlbumSvg"
      :description="$t('Views.ArtistDiscography.NoContributionsDesc', {type: getTypeName($route.params.type), artist: route.query.artist})"
    />
  </div>
</template>

<script setup lang="ts">
import { Routes } from "@/router";
import { onMounted } from "vue";
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute } from "vue-router";

import { discographyAlbumTypes } from "@/enums";
import useArtistDiscography from "@/stores/pages/artistDiscog";
import updatePageTitle from "@/utils/updatePageTitle";

import AlbumSvg from "@/assets/icons/album.svg";
import AlbumCard from "@/components/shared/AlbumCard.vue";
import GenericHeader from "@/components/shared/GenericHeader.vue";
import GenericTabs from "@/components/shared/GenericTabs.vue";
import NoItems from "@/components/shared/NoItems.vue";
import { useT } from "@/i18n";

const { t } = useT();
const route = useRoute();
const artist = useArtistDiscography();

function getTypeString(type: string) {
  if (type === "all") return t('Views.ArtistDiscography.Contributions');
  return getTypeName(type);
}

// the soundtracks and live tabs only exist while the artist has albums marked as such
function showTab(type: string) {
  if (type === route.params.type) return true;
  if (type === discographyAlbumTypes.soundtracks) return artist.soundtracks.length > 0;
  if (type === discographyAlbumTypes.live) return artist.live.length > 0;
  return true;
}

function getTypeName(type: string | string[]) {
  switch (type) {
    case "all":
      return t('Views.ArtistDiscography.AllAlbums');
    case discographyAlbumTypes.albums:
      return t('Common.Album', 2);
    case discographyAlbumTypes.EPs_and_singles:
      return t('Common.Singles');
    case discographyAlbumTypes.soundtracks:
      return t('Common.Soundtracks');
    case discographyAlbumTypes.live:
      return t('Common.Live');
    case discographyAlbumTypes.appearances:
      return t('Common.Appearances');
    case discographyAlbumTypes.compilations:
      return t('Common.Compilations', 2);
    default:
      return String(type);
  }
}

onMounted(() => {
  updatePageTitle(t("Common.Discography", {artist: route.params.artist || ""}));
  artist.fetchAlbums(route.params.hash as string);
});

onBeforeRouteUpdate((to, from, next) => {
  artist.setAlbums(to.params.type as string);
  next();
});

onBeforeRouteLeave(() => artist.resetStore());
</script>

<style lang="scss">
.artistdiscogview {
  height: 100%;
  overflow: auto;

  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax($cardwidth, 1fr));
    gap: 2rem 0;

    @include mediumPhones {
      grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
    }
  }

  .generichead {
    h1,
    .caps {
      text-transform: capitalize;
    }
  }

  .generictabs {
    padding: 0 1rem;
    text-transform: capitalize;
  }

  .nothing {
    height: max-content;
    padding-top: 5rem;
  }
}
</style>
