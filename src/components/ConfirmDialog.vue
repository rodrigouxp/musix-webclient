<template>
    <div v-if="confirm.visible" class="modal confirmdialog">
        <div class="bg" @click="confirm.answer(false)"></div>
        <div class="m-content rounded">
            <div class="t-center text">{{ confirm.text }}</div>
            <div class="buttons">
                <button class="cancel" @click="confirm.answer(false)">{{ $t('ConfirmModal.Cancel') }}</button>
                <button class="confirm" @click="confirm.answer(true)">{{ confirm.confirmLabel }}</button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useConfirmStore } from '@/stores/confirm'

const confirm = useConfirmStore()
</script>

<style lang="scss">
.confirmdialog {
    z-index: 30;

    .m-content {
        max-width: 26rem;
    }

    .text {
        font-weight: 500;
        padding: 0 1rem;
    }

    .buttons {
        margin-top: 2rem;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }
}
</style>
