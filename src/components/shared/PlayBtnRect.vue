<template>
    <button
        v-wave
        class="playbtnrect shadow-sm circular"
        @click="playFrom(source)"
    >
        <playBtnSvg />
        <div class="text">{{ $t('Common.Play') }}</div>
    </button>
</template>

<script setup lang="ts">
import { playSources } from '@/enums'
import playBtnSvg from '@/assets/icons/play.svg'
import { playFrom } from '@/helpers/usePlayFrom'

defineProps<{
    source: playSources
}>()
</script>

<style lang="scss">
.playbtnrect {
    width: 6rem;
    display: flex;
    align-items: center;
    justify-content: center;
    // always white, whatever the colors of the album, artist or playlist
    background-color: var(--color-neutral-white);
    color: var(--color-background);
    padding-right: 1rem;

    &:hover {
        background-color: var(--color-neutral-white);
    }

    svg {
        height: 1.75rem;
    }
}
</style>
