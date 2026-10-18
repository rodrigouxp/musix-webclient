<template>
    <div class="aboutmusix">
        <div class="version">MUSIX v{{ settings.version }}</div>
        <span>{{ $t('Settings.About.Origin') }}</span>
    </div>
</template>

<script setup lang="ts">
import useSettings from '@/stores/settings'

const settings = useSettings()
</script>

<style lang="scss">
.aboutmusix {
    padding: $small;

    .version {
        font-size: 1.5rem;
        font-weight: bold;
        margin-bottom: $small;
        border-bottom: solid 1px $separator;
        padding-bottom: 1rem;
    }
}
</style>
