<template>
    <!-- the speaker and, always open and horizontal, the slider next to it -->
    <div class="speaker-inline" :title="`${volume_percent}%`" @wheel.passive="handleMouseWheel">
        <button class="speaker-icon" :aria-label="$t('BottomBar.VolumeLabel', { percent: volume_percent })" @click="settings.toggleMute">
            <VolumeMuteSvg v-if="settings.mute || settings.volume == 0.0" />
            <VolumeMidSvg v-else-if="settings.volume > 0.75" />
            <VolumeLowSvg v-else-if="settings.volume > 0" />
        </button>
        <input
            id="volume"
            type="range"
            name="volume"
            max="1"
            min="0"
            step="0.01"
            :value="settings.volume"
            :title="`${volume_percent}%`"
            :aria-label="$t('BottomBar.VolumeLabel', { percent: volume_percent })"
            :aria-valuetext="`${volume_percent}%`"
            :style="{
                backgroundSize: `${volume_percent}% 100%`,
            }"
            @input="changeVolume"
        />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import VolumeMidSvg from '@/assets/icons/figma/speaker-max.svg'
import VolumeLowSvg from '@/assets/icons/figma/speaker-min.svg'
import VolumeMuteSvg from '@/assets/icons/figma/speaker-mute.svg'
import useSettingsStore from '@/stores/settings'
import { clamp } from '@/utils/audio/volume'

const settings = useSettingsStore()

// a slider position, not an amplitude — the taper is applied in `settings.volume_gain`
const volume_percent = computed(() => Math.round(settings.volume * 100))

// how much of the slider a single wheel notch covers
const WHEEL_STEP = 0.02

// wheel deltas per notch, by `WheelEvent.deltaMode` (pixels, lines, pages)
const DELTA_PER_NOTCH = [100, 3, 1]

// wheel movement too small to be worth a step yet, carried into the next event
let wheel_remainder = 0

const changeVolume = (event: Event) => {
    const target = event.target as HTMLInputElement
    settings.setVolume(parseFloat(target.value))
}

const handleMouseWheel = (event: WheelEvent) => {
    // deltaY is device- and browser-dependent, so normalise it to notches and cap it
    const notches = clamp(event.deltaY / (DELTA_PER_NOTCH[event.deltaMode] ?? 100), -3, 3)
    wheel_remainder -= notches * WHEEL_STEP

    // move in whole steps, carrying the rest over so tiny trackpad deltas still count
    const change = Math.trunc(wheel_remainder * 100) / 100
    if (change === 0) return

    wheel_remainder -= change
    settings.setVolume(Math.round((settings.volume + change) * 100) / 100)
}
</script>

<style lang="scss">
// the speaker and the slider that is always open (the PlayerBar and the controls of NowPlaying on the phone)
.speaker-inline {
    display: flex;
    align-items: center;
    gap: var(--playerbar-volume-gap);
    height: var(--playerbar-side-control-size);

    input#volume {
        // between 601px and about 1200px the slider shrinks (4rem at the least)
        width: clamp(4rem, 8vw, var(--playerbar-volume-width));
        height: var(--playerbar-progress-height);
        border-radius: 400px;
        flex-shrink: 0;
        margin: 0;
        touch-action: pan-x;
        background: linear-gradient(to top, var(--playerbar-progress-fill), var(--playerbar-progress-fill)) 0% 50%
                no-repeat,
            var(--playerbar-progress-bg);

        // the thumb is always there (in the progress bar it only shows on hover)
        &::-webkit-slider-thumb {
            height: var(--playerbar-thumb-size);
            width: var(--playerbar-thumb-size);
            cursor: pointer;
        }

        &::-moz-range-thumb {
            height: var(--playerbar-thumb-size);
            width: var(--playerbar-thumb-size);
            cursor: pointer;
        }
    }
}
</style>
