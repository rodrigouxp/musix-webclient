<template>
    <ContextMenu v-if="!hideUI" />
    <Modal v-if="!hideUI" />
    <Notification v-if="!hideUI" />
    <ConfirmDialog v-if="!hideUI" />
    <PromptDialog v-if="!hideUI" />
    <ArtistDialogs v-if="!hideUI" />
    <div id="drag-img" class="ellip2" style=""></div>
    <section
        v-if="!hideUI"
        id="app-grid"
        :class="{
            'has-playing-panel': settings.is_panel_layout,
            'queue-open': settings.is_panel_layout && settings.queue_panel_open,
            'sidepanel-collapsed': settings.is_panel_layout && settings.side_panel_collapsed,
            'panels-animating': panelsAnimating,
        }"
    >
        <LeftSidebar v-if="settings.is_panel_layout" />
        <NavBar />
        <div id="acontent" v-element-size="updateContentElemSize">
            <div id="contentresizer" ref="appcontent"></div>
            <BalancerProvider>
                <!-- the key: Albums and Artists are the same component, it has to start again when the route changes -->
                <RouterView v-slot="{ Component, route: current }">
                    <component :is="Component" :key="String(current.name)" />
                </RouterView>
            </BalancerProvider>
        </div>
        <!-- above 600px: the SidePanel on the left and the PlayingPanel on the right; up to 600px, the phone layout -->
        <PlayingPanel v-if="settings.is_panel_layout" />
        <BottomBar />
        <!-- <BubbleManager /> -->
    </section>
    <div v-else id="noui">
        <BalancerProvider>
            <RouterView v-slot="{ Component, route: current }">
                <component :is="Component" :key="String(current.name)" />
            </RouterView>
        </BalancerProvider>
    </div>
</template>

<script setup lang="ts">
// @libraries
import { vElementSize } from '@vueuse/components'
import { onStartTyping } from '@vueuse/core'
import { onBeforeMount, onMounted, Ref, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BalancerProvider } from 'vue-wrap-balancer'

// @stores
import useAuth from '@/stores/auth'
import { content_height, content_width, resizer_width, updateCardWidth } from '@/stores/content-width'
import useLyrics from '@/stores/lyrics'
import useModal from '@/stores/modal'
import useQueue from '@/stores/queue'
import useSettings from '@/stores/settings'
import useTracker from '@/stores/tracker'
import useInterface from '@/stores/interface'
import useAutoHideScrollbars from '@/composables/useAutoHideScrollbars'

// @utils
import handleShortcuts from '@/helpers/useKeyboard'

// @small-components
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import ContextMenu from '@/components/ContextMenu.vue'
import PromptDialog from '@/components/PromptDialog.vue'
import ArtistDialogs from '@/components/ArtistView/ArtistDialogs.vue'
import Modal from '@/components/modal.vue'
import Notification from '@/components/Notification.vue'

// @app-grid-components
import BottomBar from '@/components/BottomBar/BottomBar.vue'
import LeftSidebar from '@/components/LeftSidebar/index.vue'
import NavBar from '@/components/nav/NavBar.vue'
import PlayingPanel from '@/components/PlayingPanel/PlayingPanel.vue'

import { getAllSettings } from '@/requests/settings'
import { getRootDirs } from '@/requests/settings/rootdirs'
import { getLoggedInUser } from './requests/auth'
// import BubbleManager from "./components/bubbles/BinManager.vue";

const appcontent: Ref<HTMLLegendElement | null> = ref(null)
const auth = useAuth()
const queue = useQueue()
const modal = useModal()
const lyrics = useLyrics()
const router = useRouter()
const route = useRoute()
const settings = useSettings()

// the scrollbars of the panels show while a list scrolls and fade out after it
useAutoHideScrollbars()
const UIStore = useInterface()
const { hideUI } = storeToRefs(UIStore)
useTracker()

// the columns of the SidePanel and of the PlayingPanel only animate while one of them opens, closes, collapses or
// expands: their widths are a share of the window (vw), and a transition that always runs would make the columns lag
// behind when the window is resized
const panelsAnimating = ref(false)
let panelsAnimationTimer: ReturnType<typeof setTimeout> | undefined
watch(
    () => [settings.queue_panel_open, settings.side_panel_collapsed],
    () => {
        panelsAnimating.value = true
        clearTimeout(panelsAnimationTimer)
        panelsAnimationTimer = setTimeout(() => (panelsAnimating.value = false), 400) // --panel-toggle-duration is 300ms
    }
)

handleShortcuts(useQueue, useModal)

router.afterEach(() => {
    const acontent = document.getElementById('acontent') as HTMLElement

    if (acontent) {
        acontent.scrollTo(0, 0)
    }
})

onStartTyping(() => {
    const elem = document.getElementById('globalsearch') as HTMLInputElement
    elem.focus()
    elem.value = ''
})

function getContentSize() {
    const elem = document.getElementById('acontent') as HTMLElement
    return {
        width: elem.offsetWidth,
        height: elem.offsetHeight,
    }
}

function updateContentElemSize({ width, height }: { width: number; height: number }) {
    // the side margins of the page come from --layout-gutter (see _musix-tokens.scss)
    const elem_width = appcontent.value?.offsetWidth || 0

    content_width.value = elem_width
    content_height.value = height

    resizer_width.value = elem_width
    updateCardWidth()
}

function handleRootDirsPrompt() {
    getRootDirs().then(dirs => {
        if (dirs.length === 0) {
            modal.showRootDirsPromptModal()
        } else {
            settings.setRootDirs(dirs)
        }
    })
}

const getCookieValue = (name: string) => document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')?.pop() || ''

onMounted(async () => {
    if (import.meta.env.DEV) {
        const onBoardingData = await useAxios({
            url: paths.api.onboardingData,
            method: 'GET',
        })

        if (onBoardingData.status !== 200) {
            // INFO: What should we do 😱?
            return
        }

        const { adminExists, rootDirsSet, onboardingComplete } = onBoardingData.data
        if (!onboardingComplete) {
            UIStore.setHideUi(true)
            if (!rootDirsSet) {
                UIStore.setOnboardingStep(2)
            }

            if (!adminExists) {
                UIStore.setOnboardingStep(0)
            }

            router.push({
                name: Routes.Onboarding,
            })
        }
    }

    if (UIStore.hideUI) {
        // console.log('waiting for onboarding complete')
        // return
        await Waiter.wait(Waiter.keys.ONBOARDING_COMPLETE, null)
    }

    let path: string = ''
    const splits = window.location.href.split('#')
    if (splits.length > 1) {
        path = splits[1]
    }

    // INFO: If we are stuck on the onboarding page at this point,
    // redirect to the home page
    if (path === '/onboarding') {
        return router.push({
            name: Routes.Home,
        })
    }

    const { width, height } = getContentSize()
    updateContentElemSize({ width, height })

    const res = await getLoggedInUser()

    if (res.status == 200) {
        auth.setUser(res.data)
    } else {
        return
    }

    settings.initializeVolume()
    handleRootDirsPrompt()

    getAllSettings()
        .then(({ settings: data }) => {
            settings.mapDbSettings(data)
        })
        .then(() => {
            if (queue.currenttrack?.filepath && queue.currenttrack?.trackhash && !settings.use_lyrics_plugin) {
                lyrics.checkExists(queue.currenttrack.filepath, queue.currenttrack.trackhash)
            }
        })
})

onBeforeMount(async () => {
    if (import.meta.env.DEV) {
        return
    }

    const onboardingComplete = getCookieValue('x-onboarding-complete')

    if (!onboardingComplete || onboardingComplete == 'true') {
        return
    }

    UIStore.setHideUi(true)

    const adminExists = getCookieValue('x-admin-exists')
    const rootDirsSet = getCookieValue('x-root-dirs-set')

    if (rootDirsSet == 'false') {
        UIStore.setOnboardingStep(2)
    }

    if (adminExists == 'false') {
        UIStore.setOnboardingStep(0)
    }

    return router.push({
        name: Routes.Onboarding,
    })
})
</script>

<script lang="ts">
// Detect OS & browser agents and add class
import { defineComponent } from 'vue'
import { Routes } from './router'
import { storeToRefs } from 'pinia'
import useAxios from './requests/useAxios'
import { paths } from './config'
import { Waiter } from './composables/waiter'
export default defineComponent({
    name: 'OsAndBrowserSpecificContent',
    mounted() {
        this.applyClassBasedOnAgent()
    },
    methods: {
        applyClassBasedOnAgent() {
            const userAgent = navigator.userAgent
            const isWindows = /Win/.test(userAgent)
            const isLinux = /Linux/.test(userAgent) && !/Android/.test(userAgent)
            const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor)
            if ((isWindows || isLinux) && isChrome) {
                document.documentElement.classList.add('designatedOS')
            } else {
                document.documentElement.classList.add('otherOS')
            }
        },
    },
})
</script>

<style lang="scss">
@import './assets/scss/mixins.scss';

#noui {
    height: 100vh;
    width: 100vw;
}
</style>
