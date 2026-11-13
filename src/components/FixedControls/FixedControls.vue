<template>
    <div class="fixed-controls">
        <PlayerBarMobile />
        <NavBarMobile />
    </div>
</template>

<script setup lang="ts">
import NavBarMobile from './NavBarMobile.vue'
import PlayerBarMobile from './PlayerBarMobile.vue'

// FixedControls of the Figma (node 12540:4132): the block that stays at the bottom of the phone (up to 600px). It is a
// row of the grid (`bottombar`), not `position: fixed`, so the pages never go under it. Tokens --fixedcontrols-*.
</script>

<style lang="scss">
.fixed-controls {
    grid-area: bottombar;
    // a long song name must not widen the column of the grid (its min-content): the name is cut with an ellipsis instead
    min-width: 0;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: var(--fixedcontrols-gap);
    padding: var(--fixedcontrols-padding);
    // phones with a home indicator (index.html has `viewport-fit=cover`)
    padding-bottom: calc(var(--fixedcontrols-padding) + env(safe-area-inset-bottom, 0px));
    z-index: 1;
}
</style>
