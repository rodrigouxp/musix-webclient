<template>
    <button :title="$t('Common.Lyrics')" class="lyrics" :class="{ showStatus: lyrics.exists }" @click="handleClick">
        <LyricsSvg /> {{ showText ? $t('Common.Lyrics')  : '' }}
    </button>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Routes } from '@/router'
import { useRoute, useRouter } from 'vue-router'

import useLyrics from '@/stores/lyrics'
import LyricsSvg from '@/assets/icons/lyrics-mic.svg'

defineProps<{
    showText?: boolean
}>()

const route = useRoute()
const router = useRouter()

const lyrics = useLyrics()
let prevRoute = ref(route.name)

function handleClick() {
    if (lyrics.onLyricsPage) {
        return router.back()
    }

    router.push({
        name: Routes.nowPlaying,
        params: {
            tab: 'lyrics',
        },
    })

    prevRoute.value = route.name
}
</script>
