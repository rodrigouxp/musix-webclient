import { defineStore } from 'pinia'

import { Routes, router } from '@/router'

// What the menu of the artist starts and other components finish: the menu can be opened anywhere (a card, the
// search, the page), but the windows and the hero live elsewhere. The menu fills this store and the host
// (ArtistDialogs.vue, in App.vue) and the hero of the artist page (ArtistHero.vue) react to it.
export default defineStore('artistEdit', {
    state: () => ({
        // the rename window
        renaming: null as { artisthash: string; name: string } | null,
        // the window of the round photo ("Update artist's thumbnail")
        thumbnail: null as { artisthash: string; name: string } | null,
        // a new hero chosen in the menu: the hero of the page opens it to be placed (the framing is set there)
        heroDraft: null as { artisthash: string; file: File } | null,
    }),
    actions: {
        openRename(artisthash: string, name: string) {
            this.renaming = { artisthash, name }
        },
        openThumbnail(artisthash: string, name: string) {
            this.thumbnail = { artisthash, name }
        },
        /**
         * The hero is placed on the page itself, so from any other page this goes to the artist first (the
         * page takes the draft when it opens).
         */
        async startHero(artisthash: string, file: File) {
            this.heroDraft = { artisthash, file }

            const current = router.currentRoute.value

            if (current.name !== Routes.artist || current.params.hash !== artisthash) {
                await router.push({ name: Routes.artist, params: { hash: artisthash } })
            }
        },
        takeHeroDraft(artisthash: string) {
            const draft = this.heroDraft

            if (!draft || draft.artisthash !== artisthash) return null

            this.heroDraft = null
            return draft.file
        },
    },
})
