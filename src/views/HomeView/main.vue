<template>
    <!-- above 600px: the FeedPanel of the Figma. The phone keeps the old page -->
    <FeedPanel v-if="panelLayout" :title="getGreetings(auth.user.username)" />
    <div v-else class="homepageview content-page">
        <GenericHeader>
            <template #name>{{ $t('HomeView.Title') }}</template>
            <template #description>{{ getGreetings(auth.user.username) }}</template>
        </GenericHeader>

        <PageItem
            v-for="item in home.homepageItems"
            :key="item.path"
            :title="item.title || ''"
            :description="item.description"
            :items="item.items"
            :route="item.path"
            :see-all-text="item.seeAllText"
        />
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, watch } from 'vue'
import useAuth from '@/stores/auth'

import { updateCardWidth } from '@/stores/content-width'
import useHome from '@/stores/home'
import useSettings from '@/stores/settings'
import updatePageTitle from '@/utils/updatePageTitle'

import FeedPanel from '@/components/FeedPanel/FeedPanel.vue'
import PageItem from '@/components/shared/CardScroller.vue'
import GenericHeader from '@/components/shared/GenericHeader.vue'
import { useT } from '@/i18n'

const { t } = useT()
const home = useHome()
const auth = useAuth()
const settings = useSettings()

const panelLayout = computed(() => settings.is_panel_layout)

function getGreetings(username: string) {
    username = username ? username : ''

    const date = new Date()
    const hour = date.getHours()

    if (hour <= 3) {
        return t('HomeView.Greetings.midnight')
    } else if (hour <= 5) {
        return t('HomeView.Greetings.dawn')
    } else if (hour <= 12) {
        return t('HomeView.Greetings.morning', { name: username })
    } else if (hour <= 17) {
        return t('HomeView.Greetings.afternoon', { name: username })
    } else {
        return t('HomeView.Greetings.evening', { name: username })
    }
}

// the old page: the rows of the homepage store (the FeedPanel fetches its own)
async function loadOldPage() {
    await home.fetchAll()
    await nextTick()
    updateCardWidth()
}

onMounted(async () => {
    updatePageTitle(t('HomeView.title'))

    if (!panelLayout.value) await loadOldPage()
})

// the window changed while the Home is open (it crossed the 600px)
watch(panelLayout, isPanel => {
    if (!isPanel) loadOldPage()
})
</script>

<style lang="scss">
.homepageview {
    height: 100%;
    overflow: auto;

    .generichead {
        margin-bottom: 0;
    }
}
</style>
