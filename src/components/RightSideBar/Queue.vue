<template>
    <!-- <QueueActions /> -->
    <PlayingFrom />
    <div class="queue-virtual-scroller" @mouseover="mouseover = true" @mouseout="mouseover = false">
        <NoItems
            :flag="!store.tracklist.length"
            :title="$t('RightSidebar.NoQueueTitle')"
            :description="$t('RightSidebar.NoQueueDescription')"
            :icon="QueueSvg"
        />
        <DynamicScroller
            id="queue-scrollable"
            ref="scroller"
            class="scroller"
            style="height: 100%"
            :items="scrollerItems"
            :min-item-size="itemHeight"
        >
            <template #default="{ item, index, active }">
                <DynamicScrollerItem
                    :item="item"
                    :active="active"
                    :size-dependencies="[item.props]"
                    :data-index="index"
                >
                    <component
                        :is="item.component"
                        v-bind="item.props"
                        :is-current="item.trackIndex === queue.currentindex"
                        :is-current-playing="item.trackIndex === queue.currentindex && queue.playing"
                        @playThis="playFromQueue(item.trackIndex)"
                    ></component>
                </DynamicScrollerItem>
            </template>
        </DynamicScroller>
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import useQStore from '@/stores/queue'
import useInterface from '@/stores/interface'
import useTracklist from '@/stores/queue/tracklist'

import NoItems from '../shared/NoItems.vue'
import QueueActions from './Queue/QueueActions.vue'
import TrackItem from '@/components/shared/TrackItem.vue'
import QueueSvg from '@/assets/icons/queue.svg'
import PlayingFrom from '../NowPlaying/PlayingFrom.vue'


interface QueueScrollerItem {
    id: number
    component: typeof TrackItem
    props: any
    trackIndex: number
}

const itemHeight = 64

const queue = useQStore()
const store = useTracklist()
const mouseover = ref(false)
const scroller = ref<any>(null)

const { focusCurrentInSidebar, setScrollFunction } = useInterface()

// ids are queue positions: the same track can appear in the queue more than
// once, so filepath/trackhash are not valid keys here.
const scrollerItems = computed<QueueScrollerItem[]>(() =>
    store.tracklist.map((track, index) => ({
        id: index,
        component: TrackItem,
        trackIndex: index,
        props: { track, index, isQueueTrack: true },
    }))
)

function playFromQueue(index?: number) {
    if (index === undefined) return
    queue.play(index)
}

const show_above = 1 // the number of tracks to show above the current track

function scrollToCurrent() {
    const currentPos = scrollerItems.value.findIndex(item => item.trackIndex === queue.currentindex)
    if (currentPos < 0) return

    // one row above the current track
    scroller.value?.scrollToItem(Math.max(currentPos - show_above, 0))
}

onMounted(() => {
    setScrollFunction(scrollToCurrent, mouseover)
    focusCurrentInSidebar()
})

onBeforeUnmount(() => {
    setScrollFunction(() => {}, null)
})
</script>

<style lang="scss">
.queue-virtual-scroller {
    height: 100%;
    overflow: hidden;

}
</style>
