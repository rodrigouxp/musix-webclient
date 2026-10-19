<template>
    <div class="homepageview content-page">
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
import { nextTick, onMounted } from 'vue'
import useAuth from '@/stores/auth'

import { updateCardWidth } from '@/stores/content-width'
import useHome from '@/stores/home'
import updatePageTitle from '@/utils/updatePageTitle'

import PageItem from '@/components/shared/CardScroller.vue'
import GenericHeader from '@/components/shared/GenericHeader.vue'
import { useT } from '@/i18n'

const { t } = useT()
const home = useHome()
const auth = useAuth()

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

onMounted(async () => {
    updatePageTitle(t('HomeView.title'))
    await home.fetchAll()
    await nextTick()
    updateCardWidth()
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
