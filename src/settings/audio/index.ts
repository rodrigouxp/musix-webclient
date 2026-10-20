import { SettingCategory } from "@/interfaces/settings";
import gapless from "./groups";

import VolumeSvg from "@/assets/icons/figma/speaker-max.svg?raw"
import { useT } from "@/i18n";

const { t } = useT();

export default {
  title: t("Settings.Audio.Title"),
  groups: [
    {
      title: t("Settings.Audio.Playback"),
      icon: VolumeSvg,
      desc: t("Settings.Audio.PlaybackDesc"),
      settings: [...gapless],
    },
  ],
} as SettingCategory;
