import { Routes } from "@/router";
import useDialog from "@/stores/modal";

import AlbumsSvg from "@/assets/icons/menu/mark-eps-singles.svg";
import ArtistsSvg from "@/assets/icons/menu/go-to-artist.svg";
import HeartSvg from "@/assets/icons/heart.svg";
import PlaylistSvg from "@/assets/icons/playlist-1.svg";
import SettingsSvg from "@/assets/icons/settings.svg";
import HomeSvg from "@/assets/icons/home.svg";
import { useT } from "@/i18n";

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

  const menus = [
    home,
    albums,
    artists,
    {
      separator: true,
    },
    favorites,
    playlists,
    {
      separator: true,
    },
    {
      name: t('LeftSidebar.NavItems.Settings'),
      route_name: null,
      icon: SettingsSvg,
      action: () => {
        useDialog().showSettingsModal()
      }
    },
  ];

  const topnavitems = [home, albums, artists, favorites, playlists];

  return { menus, topnavitems };
};
