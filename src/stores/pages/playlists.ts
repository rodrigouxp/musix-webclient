import { defineStore } from "pinia";
import { Playlist } from "@/interfaces";
import { getAllPlaylists, reorderPlaylists } from "@/requests/playlists";

export default defineStore("playlists", {
  state: () => ({
    playlists: <Playlist[]>[],
  }),
  actions: {
    /**
     * Fetch all playlists from the server
     */
    async fetchAll() {
      const playlists = await getAllPlaylists();
      this.playlists = playlists;
    },
    /**
     * The playlist at `from` of a group goes to `to` (positions inside the group: the pinned ones, or the others). The list
     * changes at once and the order is saved on the server; if that fails the list is asked again.
     */
    async moveInGroup(pinned: boolean, from: number, to: number) {
      const group = this.playlists.filter((p) => !!p.pinned === pinned);
      const [moved] = group.splice(from, 1);

      if (!moved) return;

      group.splice(to, 0, moved);

      // the playlists of the other group stay where they are
      let next = 0;
      this.playlists = this.playlists.map((p) => (!!p.pinned === pinned ? group[next++] : p));

      // the special playlists (recently added...) have no number and are not saved
      const saved = await reorderPlaylists(group.map((p) => p.id).filter((id) => Number.isInteger(id)));

      if (!saved) await this.fetchAll();
    },
    /**
     * Adds a single playlist to the store
     * @param playlist Playlist to add to the store
     * @returns void
     */
    addPlaylist(playlist: Playlist) {
      setTimeout(() => {
        this.playlists.unshift(playlist);
      }, 250);
    },
  },
});
