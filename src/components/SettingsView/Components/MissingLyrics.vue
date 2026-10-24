<template>
    <div v-if="store.running || store.showResult" class="missing-lyrics">
        <template v-if="store.running && store.status">
            <div class="progress-text">
                {{
                    $t('Settings.Plugins.Lyrics.FindMissing.Progress', {
                        done: store.status.done,
                        total: store.status.total,
                        found: found,
                        notfound: notFound,
                    })
                }}
            </div>
            <div class="bar"><div class="fill" :style="{ width: store.percent + '%' }"></div></div>
            <div v-if="store.status.current" class="current ellip">{{ store.status.current }}</div>
        </template>
        <template v-else-if="store.status">
            <div class="result">
                {{
                    $t('Settings.Plugins.Lyrics.FindMissing.Summary', {
                        found: found,
                        synced: store.status.found_synced,
                        notfound: notFound,
                        errors: errors.length,
                    })
                }}
            </div>
            <div v-if="store.status.aborted_reason === 'network'" class="warn">
                {{ $t('Settings.Plugins.Lyrics.FindMissing.AbortedNetwork') }}
            </div>
            <div v-else-if="store.status.cancelled" class="note">
                {{ $t('Settings.Plugins.Lyrics.FindMissing.Cancelled') }}
            </div>
            <details v-if="errors.length" class="failures">
                <summary>{{ $t('Settings.Plugins.Lyrics.FindMissing.Errors', { count: errors.length }) }}</summary>
                <ul>
                    <li v-for="[path, reason] in errors" :key="path">
                        <span class="path">{{ path }}</span
                        ><br />{{ reasonText(reason) }}
                    </li>
                </ul>
            </details>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'

import { useT } from '@/i18n'
import useMissingLyrics from '@/stores/plugins/missingLyrics'

const { t } = useT()
const store = useMissingLyrics()

const found = computed(() => (store.status?.found_synced ?? 0) + (store.status?.found_plain ?? 0))
// the songs that are instrumental have no lyrics to find either
const notFound = computed(() => (store.status?.not_found ?? 0) + (store.status?.instrumental ?? 0))
const errors = computed(() => Object.entries(store.status?.errors ?? {}))

function reasonText(reason: string) {
    return t(
        reason === 'write_failed'
            ? 'Settings.Plugins.Lyrics.FindMissing.ErrorWrite'
            : 'Settings.Plugins.Lyrics.FindMissing.ErrorNetwork'
    )
}

onMounted(() => store.refresh())
// the job goes on in the server; the page only stops asking about it
onBeforeUnmount(() => store.stopPolling())
</script>

<style lang="scss">
.missing-lyrics {
    grid-column: 1 / -1;
    width: 100%;
    min-width: 0;
    font-size: small;

    .progress-text,
    .result {
        font-weight: 500;
    }

    .current,
    .note {
        opacity: 0.5;
    }

    .bar {
        margin: $small 0;
        height: 0.5rem;
        border-radius: 1rem;
        background-color: $gray5;
        overflow: hidden;

        .fill {
            height: 100%;
            background-color: $white;
            transition: width 0.3s ease;
        }
    }

    .warn {
        color: #f5b041;
        margin-top: $small;
    }

    .note {
        margin-top: $small;
    }

    .failures {
        margin-top: $small;

        summary {
            cursor: pointer;
            opacity: 0.7;
        }

        ul {
            max-height: 12rem;
            overflow: auto;
            margin-top: $small;
            padding-left: 1rem;
        }

        li {
            margin-bottom: $small;
        }

        .path {
            opacity: 0.7;
            word-break: break-all;
        }
    }
}
</style>
