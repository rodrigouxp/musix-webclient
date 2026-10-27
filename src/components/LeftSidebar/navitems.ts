import { Routes } from "@/router";

import AlbumsSvg from "@/assets/icons/figma/disc.svg";
import ArtistsSvg from "@/assets/icons/figma/user.svg";
import HeartSvg from "@/assets/icons/figma/favorite.svg";
import PlaylistSvg from "@/assets/icons/figma/add-to-playlist.svg";
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

  // the side panel: the four buttons, a divider, and Playlists (with the pinned ones under it)
  const menus = [
    home,
    albums,
    artists,
    favorites,
    {
      separator: true,
    },
    playlists,
  ];

  const topnavitems = [home, albums, artists, favorites, playlists];

  return { menus, topnavitems };
};
