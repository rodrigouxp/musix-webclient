<template>
    <div
        ref="root"
        class="nowplaying-mobile"
        :class="{ dragging, settling, closing }"
        :style="offset > 0 || settling ? { transform: `translateY(${offset}px)` } : undefined"
    >
        <div class="npm-top">
            <header class="npm-header">
                <button class="npm-close" :aria-label="$t('NowPlayingMobile.Close')" :title="$t('NowPlayingMobile.Close')" @click="close">
                    <ChevronSvg />
                </button>
                <component
                    :is="source.link ? 'a' : 'div'"
                    class="npm-source"
                    :href="source.link ? router.resolve(source.link).href : undefined"
                    :title="source.link ? $t('NowPlayingMobile.GoToSource') : undefined"
                    @click="onSourceClick"
                >
                    <PlayingSvg v-if="tab !== 'home'" class="npm-playing" />
                    <DiscSvg v-else />
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

import ChevronSvg from '@/assets/icons/figma/chevron.svg'
import DiscSvg from '@/assets/icons/figma/disc.svg'
import PlayingSvg from '@/assets/icons/figma/playing.svg'
import NowPlayingHome from './NowPlayingHome.vue'
import NowPlayingLyrics from './NowPlayingLyrics.vue'
import NowPlayingQueue from './NowPlayingQueue.vue'
import PlayingControls from './PlayingControls.vue'

// NowPlaying of the Figma (node 12294:355) on the phone (up to 600px): the screen over everything, with a header, the
// body of the tab (home, lyrics or queue) and the PlayingControls, which are the same on every tab. It is the page
// /nowplaying/:tab, so the back button closes it; it also closes with the chevron and with a swipe down. Tokens
// --nowplaying-*.
type Tab = 'home' | 'lyrics' | 'queue'

const route = useRoute()
const router = useRouter()
const queue = useQueue()
const tracklist = useTracklist()

const root = ref<HTMLElement | null>(null)
const closing = ref(false)
// after a release the sheet goes back (or out) with a transition; during the swipe it follows the finger without one
const settling = ref(false)

const tab = computed<Tab>(() => {
    const current = route.params.tab

    return current === 'lyrics' || current === 'queue' ? current : 'home'
})

// the tabs replace the page, so the back button leaves NowPlaying and does not walk through the tabs
function setTab(next: Tab) {
    if (next !== tab.value) router.replace({ name: Routes.nowPlaying, params: { tab: next } })
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
function close() {
    if (closing.value) return

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
        if (shouldClose) return close()

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
    top: 0;
    left: 0;
    right: 0;
    // the visible height of the screen (the address bar of the browser comes and goes)
    height: 100vh;
    height: 100dvh;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: calc(var(--nowplaying-padding) + env(safe-area-inset-top, 0px))
        calc(var(--nowplaying-padding) + env(safe-area-inset-right, 0px))
        calc(var(--nowplaying-padding) + env(safe-area-inset-bottom, 0px))
        calc(var(--nowplaying-padding) + env(safe-area-inset-left, 0px));
    background-color: var(--nowplaying-bg);
    z-index: 1000;
    // clip, not hidden: nothing can scroll this screen by script (scrollIntoView of a lyrics line)
    overflow: clip;
    overscroll-behavior: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
    // rises when it opens; nothing is left behind at rest (a transform would make the dragged rows of the queue, which
    // are `position: fixed`, relative to this screen)
    animation: npm-rise var(--nowplaying-slide-duration) var(--nowplaying-slide-easing);

    // follows the finger without delay; on release it goes back (or out) with the transition
    &.dragging {
        transition: none;
    }

    &.settling,
    &.closing {
        transition: transform var(--nowplaying-slide-duration) var(--nowplaying-slide-easing);
    }

    &.closing {
        pointer-events: none;
    }

    // "top" of the Figma: the header and the body of the tab, which takes what the controls leave
    .npm-top {
        display: flex;
        flex-direction: column;
        flex: 1 1 0;
        gap: var(--nowplaying-tab-gap);
        min-height: 0;
    }

    .npm-header {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        // the chevron (at the left, 2 from the corner) never goes under the name, which stays centered
        padding: 0 calc(var(--nowplaying-close-inset) + var(--nowplaying-close-size) + var(--nowplaying-gap));
        min-height: var(--nowplaying-source-icon-size);
    }

    // the chevron is 14 x 14, 2px from the corner of the content; the tap area (44) is bigger and centered on it
    .npm-close {
        position: absolute;
        top: 50%;
        left: calc(var(--nowplaying-close-inset) + (var(--nowplaying-close-size) - var(--nowplaying-close-hit)) / 2);
        display: grid;
        place-items: center;
        width: var(--nowplaying-close-hit);
        height: var(--nowplaying-close-hit);
        padding: 0;
        border: none;
        background: transparent;
        color: var(--color-neutral-white);
        transform: translateY(-50%);
        -webkit-tap-highlight-color: transparent;

        &:focus-visible {
            outline: 2px solid var(--color-primary-300);
            outline-offset: -2px;
        }

        svg {
            width: var(--nowplaying-close-size);
            height: var(--nowplaying-close-size);
            // the chevron points right: 90deg is down
            transform: rotate(90deg);
        }
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

    // the home tab scrolls when the screen is too short for the cover (the Figma does not change its size)
    .npm-body-home {
        overflow-y: auto;
        scrollbar-width: none;

        &::-webkit-scrollbar {
            display: none;
        }
    }

    .npm-body-lyrics,
    .npm-body-queue {
        padding-bottom: var(--nowplaying-tab-padding-bottom);
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
    .nowplaying-mobile {
        animation: none;
    }
}
</style>
