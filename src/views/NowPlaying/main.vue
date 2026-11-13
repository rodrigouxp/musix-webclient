<template>
    <!-- phone (up to 600px): the NowPlaying screen of the Figma. Above that: only the lyrics, as before -->
    <NowPlayingMobile v-if="isMobile" />
    <div v-else class="now-playing-view content-page" :class="{ isSmall, isMedium }" style="height: 100%">
        <div class="now-playing-content rounded">
            <div
                class="npbgimage"
                :style="{
                    backgroundImage: `url(${paths.images.thumb.small + queue.currenttrack?.albumhash + '.webp'})`,
                }"
            ></div>
            <!-- Whatever the f**k this is!! -->
            <div
                class="npbggradient"
                :style="{
                    background: `linear-gradient(16deg, #000a 2%, #000 60%, ${
                        // top right
                        rgba(darkVibrant, 0.25)
                    }), linear-gradient(-35deg, ${
                        // bottom right
                        // rgba(colors.darkVibrant, 0.85)
                        '#000'
                    } 10%, 
                    ${
                        // center to top right
                        rgba(colors.darkMuted, 0.75) || '#000000'
                    } 60%, ${
                        //  top left
                        rgba(darkVibrant, 0.25)
                    })`,
                }"
            ></div>
            <LyricsView />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import { paths } from '@/config'
import useColor from '@/stores/colors'
import useQueueStore from '@/stores/queue'
import { transitionColor } from '@/utils/colortools'
import { isMedium, isMobile, isSmall } from '@/stores/content-width'

import NowPlayingMobile from '@/components/NowPlayingMobile/NowPlayingMobile.vue'
import LyricsView from '@/views/LyricsView/main.vue'

const colors = useColor()
const queue = useQueueStore()

const darkMuted = ref<string>('rgb(0, 0, 0)')
const darkVibrant = ref<string>('rgb(0, 0, 0)')

// watch for changes to the colors.darkVibrant using pinia watcher and transition the currentColor to the new color
colors.$subscribe((_mutation, state) => {
    if (darkVibrant.value !== state.darkVibrant) {
        transitionColor(darkVibrant.value, state.darkVibrant, 5000, color => {
            darkVibrant.value = color
        })

        if (darkMuted.value !== state.darkMuted) {
            transitionColor(darkMuted.value, state.darkMuted, 5000, color => {
                darkMuted.value = color
            })
        }
    }
})

/**
 * Converts a color string to an rgba string
 * Example: rgb(255, 255, 255) -> rgba(255, 255, 255, 1)
 * @param color - The color to convert to rgba
 * @param transparency - The amount of transparency to add
 * @returns The rgba color string
 */
function rgba(color: string, transparency: number) {
    return color.replace('rgb', 'rgba').replace(')', `, ${transparency})`)
}
</script>

<style lang="scss">
.now-playing-view .now-playing-content {
    // umm ... I think there's a padding 4rem on parent
    height: calc(100% + 2rem);
    justify-content: center;
    overflow: hidden;
    position: relative;

    @include allPhones {
        height: calc(100% + 3rem);
    }

    .npbgimage,
    .npbggradient {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
    }

    .npbgimage {
        background-size: 800px;
        background-position: -10px -10px;

        $brightness: 1;
        $blur-amount: 100px;
        filter: blur($blur-amount) brightness($brightness);
        -webkit-filter: blur($blur-amount) brightness($brightness);
        -moz-filter: blur($blur-amount) brightness($brightness);
        -ms-filter: blur($blur-amount) brightness($brightness);
        -o-filter: blur($blur-amount) brightness($brightness);
    }

    .npbggradient {
        background-color: transparent;
    }
}
</style>
