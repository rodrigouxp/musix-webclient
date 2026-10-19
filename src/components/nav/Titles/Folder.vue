<template>
    <div id="folder-nav-title">
        <div class="fname">
            <div
                class="icon"
                @click="
                    $router.push({
                        name: Routes.folder,
                        params: { path: '$home' },
                    })
                "
            >
                <FolderSvg />
            </div>
            <BreadCrumbNav @navigate="navigate" />
        </div>
        <DropDown
            :items="items"
            :current="current"
            component_key="sortbar"
            :reverse="folder.trackSortReverse"
            @item-clicked="handleSortKeySet"
        />
    </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

import { Routes } from '@/router'

import FolderSvg from '@/assets/icons/folder.svg'
import BreadCrumbNav from '@/components/FolderView/BreadCrumbNav.vue'
import DropDown from '@/components/shared/DropDown.vue'
import useFolder from '@/stores/pages/folder'
import { computed } from 'vue'
import { useT } from '@/i18n'


const { t } = useT();

const router = useRouter()
const folder = useFolder()

function navigate(path: string) {
    router.push({ name: Routes.folder, params: { path } })
}

interface SortItem {
    key: string
    title: string
}

const items: SortItem[] = [
    { key: 'default', title: t('Common.Default') },
    { key: 'title', title: t('Common.Title') },
    { key: 'filepath', title: t('Common.FileName') },
    { key: 'album', title:  t('Common.Album') },
    // { key: 'albumartists', title: t('Common.AlbumArtist')} },
    { key: 'artists', title: t('Common.Artist', 2) },
    // { key: 'bitrate', title: t('Common.Bitrate') },
    { key: 'date', title: t('Common.ReleaseDate') },
    // { key: 'disc', title: t('Common.Disc') },
    // { key: 'duration', title: t('Common.Duration') },
    { key: 'last_mod', title: t('Common.DateAdded') },
    { key: 'lastplayed', title: t('Common.LastPlayed') },
    { key: 'playcount', title: t('Common.PlayCount') },
    { key: 'playduration', title: t('Common.PlayDuration') },
]

const handleSortKeySet = (item: SortItem) => {
    folder.setFolderTrackSortKey(item.key)
}

const current = computed(() => {
    return items.find(item => item.key === folder.trackSortBy) || items[0]
})
</script>

<style lang="scss">
// .info > #folder-nav-title {
//   display: grid;
// }

// .is_alt_layout #folder-nav-title {
//   display: grid;
// }

#folder-nav-title {
    box-sizing: border-box;
    width: 100%;
    min-width: 13rem; // the sort menu (10rem with its gap) and at least 3rem of the path
    display: grid;

    @media only screen and (min-width: 1101px) {
        min-width: 18rem; // more room for the path where there is room
    }
    grid-template-columns: minmax(0, 1fr);
    justify-content: space-between;
    padding-right: 10rem; // sortbar width (the sort menu is always visible, the path gives way)

    @include allPhones {
        display: grid;
        padding-top: $medium;
        padding-bottom: 1rem;

        // INFO: Folder page sort bar overrides
        .sortbar {
            top: $medium !important;
            right: 1rem !important;
        }
    }

    .sortbar {
        position: absolute;
        top: 1rem;
        right: 0;
        width: 9rem;
    }

    .fname {
        background-color: $gray5;
        border-radius: $small;
        height: 2.188rem;
        display: flex;
        align-items: center;
        max-width: 100%;
        min-width: 3rem;
        // the path scrolls inside its own strip (the open folder is brought into view);
        // contain: inline-size keeps a long path from asking the top bar for more room
        contain: inline-size;
        overflow: auto;
        overflow-y: hidden;
        -webkit-overflow-scrolling: touch;

        .icon {
            aspect-ratio: 1;
            margin: 0 $small;
            display: flex;

            svg {
                height: 1.5rem;
            }
        }
    }
}

.fname {
    scrollbar-width: none;

    &::-webkit-scrollbar {
        display: none;
    }
}
</style>
