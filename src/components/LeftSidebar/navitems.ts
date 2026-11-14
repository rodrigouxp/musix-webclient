import { Routes } from "@/router";

import AlbumsSvg from "@/assets/icons/figma/album.svg";
import ArtistsSvg from "@/assets/icons/figma/artist.svg";
import HeartSvg from "@/assets/icons/figma/favorite.svg";
import PlaylistSvg from "@/assets/icons/figma/playlist.svg";
import HomeSvg from "@/assets/icons/figma/home.svg";
import { useT } from "@/i18n";

// The icons of the Figma all have a 20px glyph inside their 24px box, so every item shows its icon in the
// same size (no per-icon padding).
export const useNavItems = () => {
  const { t } = useT()

  const albums = {
    name: t('LeftSidebar.NavItems.Albums'),
    route_name: Routes.AlbumList,
    icon: AlbumsSvg,
  };

  const artists = {
    name: t('LeftSidebar.NavItems.Artists'),
    route_name: Routes.ArtistList,
    icon: ArtistsSvg,
  };

  const favorites = {
    name: t('LeftSidebar.NavItems.Favorites'),
    route_name: Routes.favorites,
    icon: HeartSvg,
  };

  const playlists = {
    name: t('LeftSidebar.NavItems.Playlists'),
    route_name: Routes.playlists,
    icon: PlaylistSvg,
  };

  const home = {
    name: t('LeftSidebar.NavItems.Home'),
    route_name: Routes.Home,
    icon: HomeSvg,
  };

  // the side panel: Home, Albums, Artists, Playlists and Favorites, a divider, and the pinned playlists under it
  const menus = [
    home,
    albums,
    artists,
    playlists,
    favorites,
    {
      separator: true,
    },
  ];

  const topnavitems = [home, albums, artists, playlists, favorites];

  return { menus, topnavitems };
};
