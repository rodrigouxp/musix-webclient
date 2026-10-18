<template>
    <div v-if="prompt.visible" class="modal promptdialog">
        <div class="bg" @click="prompt.close()"></div>
        <div class="m-content rounded">
            <div class="heading">{{ prompt.title }}</div>
            <input
                ref="input"
                v-model="prompt.value"
                type="text"
                :disabled="prompt.busy"
                @keydown.enter="prompt.save()"
                @keydown.esc="prompt.close()"
            />
            <div class="buttons">
                <button class="cancel" :disabled="prompt.busy" @click="prompt.close()">
                    {{ $t('ConfirmModal.Cancel') }}
                </button>
                <button class="save" :disabled="prompt.busy || !prompt.value.trim()" @click="prompt.save()">
                    {{ prompt.saveLabel }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { usePromptStore } from '@/stores/prompt'

const prompt = usePromptStore()
const input = ref<HTMLInputElement | null>(null)

watch(
    () => prompt.visible,
    async visible => {
        if (!visible) return
        await nextTick()
        input.value?.focus()
        input.value?.select()
    }
)
</script>

<style lang="scss">
.promptdialog {
    z-index: 30;

    .m-content {
        max-width: 32rem;
    }

    .heading {
        font-weight: 600;
        margin-bottom: 1rem;
    }

    input {
        width: 100%;
        padding: 0.75rem 1rem;
        border: none;
        border-radius: $small;
        background-color: $gray5;
        color: #fff;
        outline: none;
    }

    .buttons {
        margin-top: 1.5rem;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }
}
</style>
