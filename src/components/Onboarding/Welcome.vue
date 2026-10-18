<template>
    <div class="welcome">
        <div class="logo"><LogoSvg /></div>
        <div class="heading">{{ $t('Onboarding.Welcome.Title') }}</div>
        <div class="appname">{{ $t('Common.AppTitle') }}</div>
        <p class="tagline">
            {{ $t('Onboarding.Welcome.Tagline') }}<br />
            <!-- and configure your music folders to get started. -->
        </p>
        <button class="btn-continue" tabindex="0" @click="emit('continue')">{{ $t('Onboarding.Welcome.GetStarted') }}</button>
    </div>
</template>

<script setup lang="ts">
import LogoSvg from '@/assets/icons/logos/note.svg'

const emit = defineEmits(['continue'])
</script>

<style lang="scss">
.welcome {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $medium;

    // center everything
    text-align: center;

    .logo {
        width: 100%;
        height: 100%;

        svg {
            width: 5rem;
            height: 5rem;
        }
    }

    .appname {
        color: $highlight-blue;
        font-size: 2.5rem;
        font-weight: 700;
        // gradient text
        background: linear-gradient(to right, $red, $blue, $red);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        // disable selection
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
    }
}
</style>
