<template>
    <div
        ref="root"
        class="nowplaying-mobile"
        :class="{ dragging, settling, closing, released: releasedOut || (settling && !closing) }"
    >
        <!-- the page behind, darkened -->
        <div class="npm-backdrop" aria-hidden="true"></div>

        <!-- the drawer of the Penpot: it comes up over the page, with a handle at the top (the handle also closes it) -->
        <div
            class="npm-drawer"
            role="dialog"
            aria-modal="true"
            :style="offset > 0 || settling ? { transform: `translateY(${offset}px)` } : undefined"
        >
            <button class="npm-handle" :aria-label="$t('NowPlayingMobile.Close')" :title="$t('NowPlayingMobile.Close')" @click="close()"></button>

            <div class="npm-top">
                <header class="npm-header">
                    <component
                        :is="source.link ? 'a' : 'div'"
                        class="npm-source"
                        :href="source.link ? router.resolve(source.link).href : undefined"
                        :title="source.link ? $t('NowPlayingMobile.GoToSource') : undefined"
                        @click="onSourceClick"
                    >
                        <PlayingSvg v-if="tab !== 'home'" class="npm-playing" />
                        <AlbumSvg v-else class="icon-active" />
                        <span class="npm-source-name">{{ source.name }}</span>
                    </component>
                </header>

                <div class="npm-body" :class="`npm-body-${tab}`">
                    <NowPlayingHome v-if="tab === 'home'" @leave="leaveTo" />
                    <NowPlayingLyrics v-else-if="tab === 'lyrics'" />
                    <NowPlayingQueue v-else />
                </div>
            </div>

            <PlayingControls :tab="tab" @tab="setTab" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouteLocationRaw, useRoute, useRouter } from 'vue-router'

import useSwipeDown from '@/composables/useSwipeDown'
import { FromOptions } from '@/enums'
import { Routes } from '@/router'
import useQueue from '@/stores/queue'
import useTracklist from '@/stores/queue/tracklist'
import playingFrom from '@/utils/playingFrom'

import AlbumSvg from '@/assets/icons/figma/album.svg'
import PlayingSvg from '@/assets/icons/figma/playing.svg'
import NowPlayingHome from './NowPlayingHome.vue'
import NowPlayingLyrics from './NowPlayingLyrics.vue'
import NowPlayingQueue from './NowPlayingQueue.vue'
import PlayingControls from './PlayingControls.vue'

// NowPlaying of the Penpot on the phone (up to 600px): a drawer over everything, with the page behind darkened (80% black),
// a handle at the top, a header, the body of the tab (home, lyrics or queue) and the PlayingControls, which are the same
// on every tab. It is the page /nowplaying/:tab, so the back button closes it; it also closes with the handle and with a
// swipe down. Tokens --nowplaying-*.
type Tab = 'home' | 'lyrics' | 'queue'

const route = useRoute()
const router = useRouter()
const queue = useQueue()
const tracklist = useTracklist()

const root = ref<HTMLElement | null>(null)
const closing = ref(false)
// after a release the sheet goes back (or out) with a transition; during the swipe it follows the finger without one
const settling = ref(false)
// the sheet leaves by the release of a swipe: it uses the easing of the release, not the one of the chevron
const releasedOut = ref(false)

const tab = computed<Tab>(() => {
    const current = route.params.tab

    return current === 'lyrics' || current === 'queue' ? current : 'home'
})

// the tabs replace the page, so the back button leaves NowPlaying and does not walk through the tabs. The tab that is
// open and is pressed again closes, and the screen goes back to the main one (there is no tab for it)
function setTab(next: Tab) {
    const target = next === tab.value ? 'home' : next

    if (target !== tab.value) router.replace({ name: Routes.nowPlaying, params: { tab: target } })
}

// the header: the name of the source (album, playlist...) on the home tab, the name of the song on the others
const source = computed(() => {
    if (tab.value !== 'home') return { name: queue.currenttrack?.title ?? '', link: undefined }

    const from = playingFrom(tracklist.from)
    const hasLink = !!tracklist.from.type && tracklist.from.type !== FromOptions.search && !!Object.keys(from.location).length

    return { name: from.name, link: hasLink ? from.location : undefined }
})

// ---- leaving ----
const SLIDE_MS = 300 // --nowplaying-slide-duration

function slideMs() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : SLIDE_MS
}

// back to the page that was open; with nothing to go back to (a direct link) it is the Home
function leave() {
    if (window.history.state?.back) router.back()
    else router.replace({ name: Routes.Home })
}

// slides down and then leaves
// `released`: the sheet leaves after a swipe, so it keeps the easing of the release (the finger started the movement)
function close(released = false) {
    if (closing.value) return

    releasedOut.value = released
    closing.value = true
    settling.value = true
    offset.value = window.innerHeight

    window.setTimeout(leave, slideMs())
}

// a link inside the screen (the artist, the source): NowPlaying is replaced by the page, so the back button of that
// page goes to the one that was open before NowPlaying
function leaveTo(location: RouteLocationRaw) {
    router.replace(location)
}

function onSourceClick(e: MouseEvent) {
    if (!source.value.link) return

    e.preventDefault()
    leaveTo(source.value.link)
}

const { offset, dragging, reset } = useSwipeDown({
    root: () => root.value,
    // the sliders, the handles that move the rows, and the controls are not part of the swipe
    ignore: 'input, .qt-drag, .qg-drag, .playing-controls',
    onRelease(shouldClose) {
        if (shouldClose) return close(true)

        settling.value = true
        reset()
        window.setTimeout(() => (settling.value = false), slideMs())
    },
})
</script>

<style lang="scss">
// over everything, the controls of the bar included (the context menu is above: 1001)
.nowplaying-mobile {
    position: fixed;
    inset: 0;
    // the visible height of the screen (the address bar of the browser comes and goes)
    height: 100vh;
    height: 100dvh;
    z-index: 1000;
    // clip, not hidden: nothing can scroll this screen by script (scrollIntoView of a lyrics line)
    overflow: clip;
    overscroll-behavior: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;

    // the page behind: 80% black, it fades in while the drawer comes up
    .npm-backdrop {
        position: absolute;
        inset: 0;
        background-color: var(--nowplaying-backdrop);
        animation: npm-fade var(--nowplaying-slide-duration) ease-out;
    }

    // the drawer (Penpot: 404 x 740 on a screen of 412 x 780): 4 from each side, 40 from the top, touching the bottom;
    // radius 12 and a 1px border; the content has 20 of padding all around
    .npm-drawer {
        position: absolute;
        top: calc(var(--nowplaying-drawer-top) + env(safe-area-inset-top, 0px));
        right: var(--nowplaying-drawer-inset);
        bottom: 0;
        left: var(--nowplaying-drawer-inset);
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: var(--nowplaying-padding) var(--nowplaying-padding) calc(var(--nowplaying-padding) + env(safe-area-inset-bottom, 0px));
        border: var(--nowplaying-drawer-border);
        border-radius: var(--nowplaying-drawer-radius);
        background-color: var(--nowplaying-bg);
        // the motion goes about 10% past its place at the end of the rise and at the start of the way out: the shadow
        // paints the background below the drawer so the page never shows under it (a pseudo-element would be cut by the
        // overflow: clip of the root)
        box-shadow: 0 20vh 0 0 var(--nowplaying-bg);
        // rises when it opens; nothing is left behind at rest (a transform would make the dragged rows of the queue, which
        // are `position: fixed`, relative to this screen)
        animation: npm-rise var(--nowplaying-slide-duration) var(--nowplaying-slide-easing);
    }

    // follows the finger without delay; on release it goes back (or out) with the transition
    &.dragging .npm-drawer {
        transition: none;
    }

    &.settling .npm-drawer,
    &.closing .npm-drawer {
        transition: transform var(--nowplaying-slide-duration) var(--nowplaying-slide-easing);
    }

    &.closing .npm-backdrop {
        opacity: 0;
        transition: opacity var(--nowplaying-slide-duration) ease-in;
    }

    // coming back to place or going out after a swipe: the finger already started the movement and a step backwards
    // would look like a glitch (own decision)
    &.released.settling .npm-drawer,
    &.released.closing .npm-drawer {
        transition-timing-function: var(--nowplaying-release-easing);
    }

    &.closing {
        pointer-events: none;
    }

    // the handle: 83 x 5, 20 under the top of the drawer; the tap area (a taller button) is centered on it
    .npm-handle {
        position: absolute;
        top: var(--nowplaying-padding);
        left: 50%;
        width: var(--nowplaying-handle-width);
        height: var(--nowplaying-handle-height);
        padding: 0;
        border: none;
        border-radius: var(--nowplaying-handle-radius);
        background-color: var(--nowplaying-handle-color);
        transform: translateX(-50%);

        &::before {
            content: '';
            position: absolute;
            inset: calc(-1 * var(--nowplaying-handle-hit)) -20px;
        }

        &:focus-visible {
            outline: 2px solid var(--color-primary-300);
            outline-offset: 4px;
        }
    }

    // "top" of the Penpot: the header and the body of the tab, which takes what the controls leave. It starts under the
    // handle (5 high, and the gap)
    .npm-top {
        display: flex;
        flex-direction: column;
        flex: 1 1 0;
        gap: var(--nowplaying-tab-gap);
        min-height: 0;
        margin-top: calc(var(--nowplaying-handle-height) + var(--nowplaying-handle-gap));
    }

    .npm-header {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        min-height: var(--nowplaying-source-icon-size);
    }

    // "album-playlist-name": the icon of 18 and the name, one line
    .npm-source {
        @include text('paragraph-14px');
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--nowplaying-source-gap);
        max-width: 100%;
        color: var(--nowplaying-source-color);

        svg {
            flex-shrink: 0;
            width: var(--nowplaying-source-icon-size);
            height: var(--nowplaying-source-icon-size);
        }

        .npm-playing {
            color: var(--nowplaying-playing-color);
        }
    }

    .npm-source-name {
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .npm-body {
        display: flex;
        flex-direction: column;
        flex: 1 1 0;
        gap: var(--nowplaying-gap);
        min-height: 0;
    }

    // the home tab does not scroll (Rodrigo, 2026-11-14): when the screen is too short only the cover gets smaller
    .npm-body-home {
        overflow: hidden;
    }

    .npm-body-lyrics,
    .npm-body-queue {
        padding-bottom: var(--nowplaying-tab-padding-bottom);
    }
}

@keyframes npm-fade {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

@keyframes npm-rise {
    from {
        transform: translateY(100%);
    }

    to {
        transform: translateY(0);
    }
}

@media (prefers-reduced-motion: reduce) {
    .nowplaying-mobile .npm-drawer,
    .nowplaying-mobile .npm-backdrop,
    .nowplaying-mobile.settling .npm-drawer,
    .nowplaying-mobile.closing .npm-drawer,
    .nowplaying-mobile.closing .npm-backdrop {
        animation: none;
        transition: none;
    }
}
</style>
