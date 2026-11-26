<template>
    <!-- In the SidePanel (above 600px) and in the top bar of the phone. A click anywhere in the field goes to the search page;
         in the collapsed SidePanel, where only the magnifier shows, it opens the panel and puts the cursor in the field. -->
    <div class="gsearch-input" @click="openSearch">
        <div id="ginner" ref="inputRef" tabindex="0">
            <!-- only the magnifier: the field is the button -->
            <button class="no_bg" :title="$t('SearchInput.GoToSearch')">
                <SearchSvg class="search-glyph" />
            </button>
            <input
                id="globalsearch"
                v-model.trim="search.query"
                :placeholder="settings.is_panel_layout ? $t('LeftSidebar.SearchPlaceholder') : $t('Search.SearchPlaceholder')"
                type="search"
                autocomplete="off"
                spellcheck="false"
                @blur.prevent="removeFocusedClass"
                @focus.prevent="addFocusedClass"
            />
            <div
                class="clear_input circular noSelect"
                :class="{ active: search.query.length > 0 }"
                @click.stop="clearInput"
            >
                <CancelSvg />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import useSearch from '@/stores/search'
import useSettings from '@/stores/settings'
import { nextTick, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

import CancelSvg from '@/assets/icons/figma/close.svg'
import SearchSvg from '@/assets/icons/figma/search.svg'
import { Routes } from '@/router'

const search = useSearch()
const settings = useSettings()
const router = useRouter()
const route = useRoute()

// The collapsed SidePanel shows only the magnifier (the field has no room): the click opens the panel and the cursor goes
// to the field, which is where typing starts. Anywhere else it goes to the search page, as before.
function openSearch() {
    if (settings.is_panel_layout && settings.side_panel_collapsed) {
        settings.toggleSidePanel()
        nextTick(() => document.getElementById('globalsearch')?.focus())
        return
    }

    if (route.name !== Routes.search) {
        router.push({
            name: Routes.search,
            params: { page: 'top' },
            query: { q: search.query },
        })
    }
}

// HANDLE FOCUS
const inputRef = ref<HTMLInputElement | null>(null)

// NOTE: Functions are used because classes are added to the sorrounding element
// and not the input itself.
function addFocusedClass() {
    if (inputRef.value) {
        inputRef.value.classList.add('search-focused')
    }
}

function removeFocusedClass() {
    if (inputRef.value) {
        inputRef.value.classList.remove('search-focused')
    }
}

function clearInput() {
    search.query = ''
    if (inputRef.value) {
        inputRef.value.focus()
    }
}

// @end
</script>

<style>
.clear_search {
    /* Style applied when clear_search class is active */
    visibility: visible;
    cursor: pointer;
}
</style>

<style lang="scss">
.gsearch-input {
    display: grid;
    grid-template-columns: 1fr max-content;

    #ginner {
        width: 100%;
        display: flex;
        align-items: center;
        border-radius: 3rem;
        background-color: $gray5;
        outline: solid 2px transparent;
        transition: outline-color 0.2s ease-out;

        button {
            background: transparent;
            border: none;
            width: 1.625rem;
            height: 1.625rem;
            padding: 0;
            margin-left: 6px;
            margin-right: $smaller;
            border-radius: 3rem;
            cursor: pointer;
            flex-shrink: 0;
            color: $white;

            &:hover {
                transition: all 0.2s ease;
                background-color: $gray2;
            }

            @include allPhones {
                display: none;
            }
        }

        button.no_bg {
            pointer-events: none;
        }

        // the glyph of the magnifier is 15.7px (the Figma icon has a 2px margin in its 24px)
        button svg.search-glyph {
            height: 1.175rem;
            width: 1.175rem;
        }

        input {
            width: 100%;
            border: none;
            line-height: 2.25rem;
            color: inherit;
            font-size: 14px;
            font-weight: 500;
            background-color: transparent;
            outline: none;
            appearance: none;
            text-overflow: ellipsis;

            @include allPhones {
                font-size: 0.9rem;
                font-weight: 600;
                padding-right: $small;
            }
        }

        .clear_input {
            cursor: pointer;
            margin-right: $smaller;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s ease-out, visibility 0.3s ease-out, background-color 0.2s ease-out;
            width: 1.75rem;
            aspect-ratio: 1;

            display: grid;
            place-items: center;
            flex-shrink: 0;

            &:hover {
                background-color: $gray;
            }

            // the X: 10 x 10px
            svg {
                height: 10px;
                width: 10px;
            }

            @include allPhones {
                width: $larger;
                border-radius: 4px;
                margin-right: $small;
            }
        }

        .clear_input.active {
            opacity: 1;
            visibility: visible;
        }

        .clear_input.active:active {
            opacity: 0.3;
        }

        @include allPhones {
            border-radius: unset;
            background-color: transparent;
        }
    }

    @include allPhones {
        width: 100%;
    }
}

// The search of the SidePanel of the Penpot (SearchBar): no fill and no stroke, corners of 4, padding 8, the magnifier (20) and the
// text (paragraph-16px) 12 apart, 38 high. Closed, only the magnifier is left, in the 36 of the panel: the field loses its width
// and the text fades with the panel (the motion of the prototype). Only above 600px; the phone keeps its own search.
@media only screen and (min-width: 601px) {
    .l-sidebar .gsearch-input #ginner {
        box-sizing: border-box;
        height: var(--sidepanel-search-height);
        padding: var(--sidepanel-search-padding);
        gap: var(--sidepanel-search-gap);
        border: none;
        border-radius: var(--sidepanel-item-radius);
        background-color: transparent;
        overflow: hidden;

        button {
            width: var(--sidepanel-icon-slot);
            height: var(--sidepanel-icon-slot);
            margin: 0;
            color: var(--sidepanel-search-color);

            &:hover {
                background-color: transparent;
            }

            // the SVG of the icon is 24 with the glyph of 20 (the vector of the Penpot): natural size, the slot gets the 20
            svg.search-glyph {
                flex-shrink: 0;
                width: var(--sidepanel-icon-size);
                height: var(--sidepanel-icon-size);
                margin: calc((var(--sidepanel-icon-slot) - var(--sidepanel-icon-size)) / 2);
            }
        }

        input {
            @include text('paragraph-16px');
            min-width: 0;
            color: var(--sidepanel-search-text-color);
            transition: opacity var(--panel-toggle-duration) ease-in-out;

            &::placeholder {
                color: var(--sidepanel-search-color);
                opacity: 1;
            }
        }

        .clear_input {
            width: var(--sidepanel-icon-slot);
            margin-right: 0;
        }
    }

    .l-sidebar.collapsed .gsearch-input #ginner {
        input {
            opacity: 0;
            pointer-events: none;
        }

        .clear_input {
            display: none;
        }
    }
}

.search-focused {
    outline: solid 2px #fff;

    @include allPhones {
        outline: none;
    }
}
</style>
