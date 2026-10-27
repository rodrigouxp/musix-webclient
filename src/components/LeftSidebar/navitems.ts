import { Routes } from "@/router";

import AlbumsSvg from "@/assets/icons/figma/ep-and-single.svg";
import ArtistsSvg from "@/assets/icons/figma/user.svg";
import HeartSvg from "@/assets/icons/figma/favorite.svg";
import PlaylistSvg from "@/assets/icons/figma/add-to-playlist.svg";
import HomeSvg from "@/assets/icons/figma/home.svg";
import { useT } from "@/i18n";

// The icons of the Figma have a 2px margin inside their 24px: `icon_pad` is the padding (px) that keeps
// the glyph of each one as big as the glyph of the icon it replaced, inside the same 1.5rem box.
export const useNavItems = () => {
  const { t } = useT()

  const albums = {
    name: t('LeftSidebar.NavItems.Albums'),
    route_name: Routes.AlbumList,
    icon: AlbumsSvg,
    icon_pad: "3px",
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
    icon_pad: "1.4px",
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
    icon_pad: "2.35px",
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
