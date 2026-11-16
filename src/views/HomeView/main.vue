<template>
    <!-- the FeedPanel of the Figma on every width, the phone included (Rodrigo, 2026-11-15: the phone used the old page, with the
         old cards) -->
    <FeedPanel :title="getGreetings(auth.user.username)" />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

import useAuth from '@/stores/auth'
import updatePageTitle from '@/utils/updatePageTitle'

import FeedPanel from '@/components/FeedPanel/FeedPanel.vue'
import { useT } from '@/i18n'

const { t } = useT()
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

onMounted(() => updatePageTitle(t('HomeView.title')))
</script>
