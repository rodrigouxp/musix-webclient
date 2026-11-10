<template>
    <div
        class="gsearch-input"
        @click="
            $route.name !== Routes.search &&
                $router.push({
                    name: Routes.search,
                    params: { page: 'top' },
                    query: { q: search.query },
                })
        "
    >
        <div id="ginner" ref="inputRef" tabindex="0">
            <!-- only the magnifier: the field is the button (a click anywhere in the search goes to the search page) -->
            <button class="no_bg" :title="$t('SearchInput.GoToSearch')">
                <SearchSvg class="search-glyph" />
            </button>
            <input
                id="globalsearch"
                v-model.trim="search.query"
                :placeholder="$t('Search.SearchPlaceholder')"
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
import { ref } from 'vue'

import CancelSvg from '@/assets/icons/figma/close.svg'
import SearchSvg from '@/assets/icons/figma/search.svg'
import { Routes } from '@/router'

const search = useSearch()

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

// The search of the TopBar of the Figma (SearchBar, node 12394:348): no fill and no stroke (Rodrigo, 2026-11-07),
// the magnifier (the glyph is 18 x 18, in a slot of 18) and the text (paragraph-16px) 12 apart; it grows to the avatar (500px at most)
// (NavBar.vue). Only above 600px; the phone keeps its own search.
@media only screen and (min-width: 601px) {
    #app-grid .topnav .gsearch-input #ginner {
        box-sizing: border-box;
        height: var(--topbar-search-height);
        padding: var(--topbar-search-padding);
        gap: var(--topbar-search-gap);
        border: none;
        border-radius: 400px;
        background-color: transparent;

        button {
            width: var(--topbar-search-icon-slot);
            height: var(--topbar-search-icon-slot);
            margin: 0;
            color: var(--topbar-search-color);

            &:hover {
                background-color: transparent;
            }

            svg.search-glyph {
                flex-shrink: 0;
                width: var(--topbar-search-icon-size);
                height: var(--topbar-search-icon-size);
            }
        }

        input {
            @include text('paragraph-16px');
            min-width: 0;
            color: var(--topbar-search-text-color);

            &::placeholder {
                color: var(--topbar-search-color);
                opacity: 1;
            }
        }

        .clear_input {
            margin-right: 0;
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
