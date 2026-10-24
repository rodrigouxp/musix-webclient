import { paths } from "@/config";
import { LyricsLine, Track } from "@/interfaces";
import useAxios from "../useAxios";

/** Why the search found nothing (`null` when the lyrics were found and saved). */
export type LyricsSearchReason =
  | "plugin_off"
  | "not_found"
  | "instrumental"
  | "network"
  | "write_failed";

export interface LyricsSearchResult {
  trackhash: string;
  /** the synced lyrics; plain lyrics are saved too and loaded again with `getLyrics` */
  lyrics: LyricsLine[] | null;
  synced: boolean;
  source: "lrclib" | "musixmatch" | null;
  reason: LyricsSearchReason | null;
  /** with `write_failed`: the file that could not be written */
  path?: string;
}

export interface LyricsSearchOptions {
  /** started by the app, not by the user: a song with no lyrics online recently is not looked up again */
  auto?: boolean;
  /** plain lyrics saved in a .lrc may be replaced by synced ones */
  replaceUnsynced?: boolean;
}

export async function findLyrics(
  track: Track,
  options: LyricsSearchOptions = {}
): Promise<LyricsSearchResult | undefined> {
  const { data } = await useAxios({
    url: paths.api.plugins + "/lyrics/search",
    props: {
      trackhash: track.trackhash,
      title: track.title,
      // only the first artist: the server cleans the title and looks the song up by it
      artist: track.artists[0]?.name ?? "",
      filepath: track.filepath,
      album: track.album,
      duration: track.duration,
      auto: options.auto ?? false,
      replace_unsynced: options.replaceUnsynced ?? false,
    },
  });

  return data;
}
