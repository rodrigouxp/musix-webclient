<template>
    <div class="npm-lyrics">
        <div v-if="lines.length" id="scrollbale" class="npl-scroll" @wheel.passive="onScroll" @touchmove.passive="onScroll">
            <!-- synced: the line that is sung is filled from the left, the ones before it are white, the next ones dark -->
            <div v-if="lyrics.synced" id="np-lyrics-synced" class="npl-lines">
                <div id="lyricsline--1"></div>
                <div
                    v-for="(line, index) in lines"
                    :id="`lyricsline-${index}`"
                    :key="index"
                    class="line"
                    :class="{
                        current: index === lyrics.currentLine,
                        past: index < lyrics.currentLine,
                        blank: !line.text.trim(),
                    }"
                    :style="index === lyrics.currentLine ? { '--npl-sweep': sweep } : undefined"
                    @click="queue.seek(line.time / 1000)"
                >
                    {{ line.text }}
                </div>
                <div v-if="lyrics.copyright" class="copyright">{{ lyrics.copyright }}</div>
            </div>
            <!-- unsynced: everything is white, nothing follows the song -->
            <div v-else class="npl-lines unsynced">
                <div v-for="(line, index) in lines" :key="index" class="line past" :class="{ blank: !line.text.trim() }">
                    {{ line.text }}
                </div>
            </div>
        </div>

        <div v-else class="npl-empty">
            <div>{{ $t('Views.LyricView.NoLyricsFoundFirst') }}</div>
            <div>{{ $t('Views.LyricView.NoLyricsFoundSecond') }}</div>
            <PluginFind v-if="settings.use_lyrics_plugin" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted } from 'vue'

import useLyrics from '@/stores/lyrics'
import useQueue from '@/stores/queue'
import useSettings from '@/stores/settings'
import { cancelLineAnimation } from '@/utils/lyrics/flipScroll'

import PluginFind from '@/views/LyricsView/Plugins/Find.vue'

// NowPlaying:Lyrics of the Figma (node 12540:4213). The store is the same as the one of LyricsView (which the desktop
// keeps): the ids `scrollbale` and `lyricsline-N` are what `lyrics.scrollToCurrentLine()` looks for, and the store only
// follows the song while the route is /nowplaying/lyrics (that is why the tab is a route and not a local state).
const queue = useQueue()
const lyrics = useLyrics()
const settings = useSettings()

// the lines as {time, text}: unsynced lyrics come as plain strings
const lines = computed(() =>
    (lyrics.lyrics as unknown as Array<{ time: number; text: string } | string>).map(line =>
        typeof line === 'string' ? { time: 0, text: line } : line
    )
)

// How much of the line that is sung is filled (0 to 1). The .lrc only has the time where each line starts, so this is an
// estimate: the time since the line started over the time to the next one (the last one: to the end of the song).
// `queue.duration.current` (seconds, from the `timeupdate` of the audio) is the clock because it is reactive; the
// transition of --npl-sweep fills the 250ms between two updates.
const sweep = computed(() => {
    const list = lines.value
    const line = list[lyrics.currentLine]

    if (!line) return 0

    const start = line.time
    const end = list[lyrics.currentLine + 1]?.time ?? queue.duration.full * 1000
    const span = end - start

    if (span <= 0) return 1

    return Math.min(1, Math.max(0, (queue.duration.current * 1000 - start) / span))
})

const onScroll = () => {
    // hand scrolling back to the user with no transforms in flight
    cancelLineAnimation()
    lyrics.setUserScrolled(true)
}

onMounted(async () => {
    if (!queue.currenttrack) return

    lyrics.getLyrics()
    lyrics.setUserScrolled(false)

    // the line that is sung comes to the middle (the lyrics may have been loaded before the tab was open)
    await nextTick()
    if (lyrics.synced) lyrics.scrollToCurrentLine(-1, true)
})
</script>

<style lang="scss">
// the fill of the current line moves with a number, so it can have a transition
@property --npl-sweep {
    syntax: '<number>';
    inherits: false;
    initial-value: 0;
}

.npm-lyrics {
    display: flex;
    flex-direction: column;
    flex: 1 1 0;
    min-height: 0;

    // the lyrics box scrolls on its own
    .npl-scroll {
        flex: 1 1 0;
        min-height: 0;
        overflow-y: auto;
        overscroll-behavior: contain;
        scrollbar-width: none;

        &::-webkit-scrollbar {
            display: none;
        }
    }

    .npl-lines {
        display: flex;
        flex-direction: column;
        gap: var(--nplyrics-gap);
        box-sizing: border-box;
        width: min(var(--nplyrics-width), 100%);
        margin: 0 auto;
        padding: var(--nplyrics-padding);
    }

    // the Figma has no style for the top marker and the spacer: they take no room in the column
    #lyricsline--1 {
        display: none;
    }

    .line {
        @include text('paragraph-18px');
        color: var(--nplyrics-next);
        cursor: pointer;
        transition: color 0.3s ease-out;

        &.past {
            color: var(--nplyrics-past);
        }

        // the line that is sung: the text is transparent and the gradient behind it (clipped to the letters) is filled from
        // the left up to --npl-sweep; the edge of the fill is soft
        &.current {
            color: transparent;
            background-image: linear-gradient(
                90deg,
                var(--nplyrics-current-start) calc(var(--npl-sweep) * (100% + var(--nplyrics-edge)) - var(--nplyrics-edge)),
                var(--nplyrics-current-end) calc(var(--npl-sweep) * (100% + var(--nplyrics-edge)))
            );
            -webkit-background-clip: text;
            background-clip: text;
            transition: --npl-sweep 0.3s linear;
        }

        // an empty line of the .lrc is a pause: no room beyond the gaps around it
        &.blank {
            height: 0;
        }
    }

    .unsynced .line {
        cursor: default;
    }

    .copyright {
        @include text('paragraph-12px');
        color: var(--nplyrics-next);
        text-transform: uppercase;
    }

    .npl-empty {
        @include text('paragraph-18px');
        display: grid;
        place-content: center;
        justify-items: center;
        flex: 1 1 0;
        min-height: 0;
        color: var(--nowplaying-source-color);
        text-align: center;

        button {
            width: fit-content;
        }
    }
}
</style>
