<template>
    <!-- TODO:  -->
    <div
        ref="parentRef"
        class="context-item"
        :class="{ 'inline-children': compact && option.children && !option.singleChild, 'children-open': compact && childrenShown }"
        @pointerenter="handlePointerEnter"
        @mouseleave="handleMouseLeave"
        @click="runAction"
    >
        <div class="item-row">
            <div class="icon image" v-html="option.icon"></div>
            <div class="label ellip">{{ option.label }}</div>
        </div>
        <div v-if="option.children && !option.singleChild" class="more" v-html="MenuSubmenuIcon"></div>
        <div
            v-if="children"
            ref="childRef"
            class="children rounded shadow-sm"
            :class="{ inline: compact, open: childrenShown }"
            @click="onChildrenClick"
        >
            <div className="wrapper">
                <div
                    v-for="child in children"
                    :key="child.label"
                    class="context-item"
                    :class="[{ critical: child.critical }, child.type]"
                    @click="child.action && runChildAction(child.action)"
                >
                    <div class="label ellip">
                        {{ child.label }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { createPopper, Instance, Modifier, Placement, Rect } from '@popperjs/core'
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

import { contextChildrenShowMode } from '@/enums'
import { MenuSubmenuIcon } from '@/icons'
import useContextStore from '@/stores/context'
import { claimInlineSubmenu, releaseInlineSubmenu } from './inlineSubmenu'
import { Option } from '@/interfaces'

const context = useContextStore()

const props = defineProps<{
    option: Option
    childrenShowMode: contextChildrenShowMode
}>()

const emit = defineEmits<{
    // eslint-disable-next-line no-unused-vars
    (event: 'hideContextMenu'): void
}>()

// Narrow or short screens (phones, landscape): the submenu opens inside the menu, under its
// item, and the menu scrolls. Keep this query in sync with the one in ContextMenu.vue.
const compactQuery = '(max-width: 900px), (max-height: 500px)'
const compactMedia = window.matchMedia(compactQuery)
const compact = ref(compactMedia.matches)
const updateCompact = () => (compact.value = compactMedia.matches)

onMounted(() => compactMedia.addEventListener('change', updateCompact))
onBeforeUnmount(() => {
    compactMedia.removeEventListener('change', updateCompact)
    releaseInlineSubmenu(hideChildren)
})

const showChildrenDelay = 250
const stillWaitingForChildren = ref(false)
const children = ref<Option[] | false>(false)

const childrenShown = ref(false)
const childRef = ref<HTMLElement>()
const parentRef = ref<HTMLElement>()

// hover opens the submenu only with a mouse, in hover mode, on screens with room for a flyout
const opensOnHover = computed(() => {
    return props.option.children && props.childrenShowMode === contextChildrenShowMode.hover && !compact.value
})

let popperInstance: Instance | null = null

async function handlePointerEnter(e: PointerEvent) {
    // a touch fires pointerenter and then the click: the tap alone opens the submenu
    if (e.pointerType && e.pointerType !== 'mouse') return
    if (!opensOnHover.value) return

    stillWaitingForChildren.value = true
    await new Promise(resolve => setTimeout(resolve, showChildrenDelay))

    if (stillWaitingForChildren.value) {
        showChildren()
    }
}

function handleMouseLeave() {
    if (!opensOnHover.value) return
    stillWaitingForChildren.value = false
    hideChildren()
}

async function getChildren() {
    if (!props.option.children) return
    const childs = await props.option.children()

    if (childs) {
        children.value = childs
    }
}

let opening = false

async function showChildren() {
    if (childrenShown.value || opening) return
    opening = true

    if (props.option.children) {
        await getChildren()
        await nextTick()
    }

    opening = false
    if (!childRef.value) return

    if (compact.value) {
        claimInlineSubmenu(hideChildren)
        childRef.value.style.visibility = 'visible'
        childRef.value.style.opacity = '1'
        childrenShown.value = true
        // the menu grew: place it again inside the screen, then (it scrolls on small screens)
        // bring the opened submenu into view
        await nextTick()
        context.updatePosition()
        childRef.value?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
        return
    }

    const offsetModifier: Modifier<
        'offset',
        {
            offset:
                | [number, number]
                | ((args: { placement: Placement; reference: Rect; popper: Rect }) => [number, number])
        }
    > = {
        name: 'offset',
        options: {
            offset: ({ placement }) => {
                // Correct type for placement automatically inferred
                if (placement.includes('right') || placement.includes('left')) {
                    return [-7, 0]
                }
                return [0, 0]
            },
        },
    }

    popperInstance = createPopper(parentRef.value as HTMLElement, childRef.value as HTMLElement, {
        placement: 'right-start',
        modifiers: [
            {
                name: 'preventOverflow',
                options: {
                    altAxis: true,
                    boundariesElement: 'viewport',
                    padding: 8,
                },
            },
            {
                name: 'flip',
                options: {
                    // no room on the right or on the left: under the item, or over it
                    fallbackPlacements: ['left-start', 'bottom-start', 'top-start', 'auto'],
                    // a tall submenu next to the bottom of the screen (the add button of the bottom bar)
                    // stays at the side of its item and is moved up, instead of covering the menu
                    altAxis: false,
                    boundariesElement: 'viewport',
                    padding: 8,
                },
            },
            offsetModifier,
        ],
    })
    childRef.value ? (childRef.value.style.visibility = 'visible') : null
    childRef.value ? (childRef.value.style.opacity = '1') : null
    childrenShown.value = true
}

function hideChildren() {
    childRef.value ? (childRef.value.style.visibility = 'hidden') : null
    childRef.value ? (childRef.value.style.opacity = '0') : null
    popperInstance?.destroy()
    childrenShown.value = false
    releaseInlineSubmenu(hideChildren)
    if (compact.value) nextTick(() => context.updatePosition())
}

// the submenu of the inline (compact) mode lives inside its item: a tap on it must not toggle the item
function onChildrenClick(e: MouseEvent) {
    if (compact.value) e.stopPropagation()
}

function hideContextMenu() {
    emit('hideContextMenu')
}

function runAction() {
    if (!props.option.singleChild && props.option.children) {
        if (childrenShown.value) {
            hideChildren()
            return
        }

        showChildren()
        return
    }

    props.option.action && props.option.action()
    hideContextMenu()
}

function runChildAction(action: () => void) {
    action()
    emit('hideContextMenu')
}
</script>

<style lang="scss">
.context-item {
    cursor: pointer;
    width: 100%;
    display: flex;
    align-items: center;
    padding: 0.4rem;
    position: relative;
    border-radius: $small;
    color: var(--menu-item-text);
    transition: background-color 0.2s ease-out;

    // the arrow of the items that open a submenu (chevron-right of the Figma): 10 x 10, 10px from the right edge
    .more {
        height: 10px;
        width: 10px;
        position: absolute;
        right: 10px;
        top: 50%;
        margin-top: -5px;
        color: var(--menu-item-icon);

        svg {
            display: block;
            height: 100%;
            width: 100%;
        }
    }

    .children {
        position: absolute;
        width: 12rem;
        z-index: 10;
        transform: scale(0);
        background-color: var(--menu-bg);
        padding: $small $smaller;
        border: solid 1px $gray3;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.25s ease-out, visibility 0.25s ease-out;

        ::-webkit-scrollbar-thumb {
            background-color: transparent;
        }

        &:hover ::-webkit-scrollbar-thumb {
            background-color: $gray2;
        }

        &:hover ::-webkit-scrollbar-thumb:hover {
            background-color: $gray1;
        }

        .wrapper {
            padding: 0 $smaller;
            overflow: auto;
            overflow-x: hidden;
            max-height: calc(100vh / 2 - 2rem);
            -webkit-overflow-scrolling: touch;
        }

        .context-item {
            line-height: 1.2;
            padding: $small 1rem;
            padding: 0.4rem 0.6rem;
        }

        .separator {
            padding: 0;
        }
    }

    // the icon and the label of an item (its submenu comes under them in the compact mode)
    .item-row {
        display: flex;
        align-items: center;
        flex: 1 1 auto;
        min-width: 0;
        min-height: inherit;
    }

    // compact mode (phones, landscape): the submenu opens under its item, inside the menu
    &.inline-children {
        flex-wrap: wrap;
        align-content: flex-start;

        > .item-row {
            flex: 1 1 100%;
        }

        &.children-open {
            > .more {
                top: calc(var(--menu-item-height, 2rem) / 2);
                transform: rotate(90deg);
            }

            // the whole block is not one big hover target: the header and each option are
            &:hover {
                background: transparent;
                color: var(--menu-item-text);
            }
        }
    }

    .children.inline {
        display: none;
        position: static;
        transform: none;
        flex: 0 0 100%;
        width: 100%;
        margin: 2px 0 4px;
        padding: 0 0 0 1.75rem;
        border: none;
        box-shadow: none;
        background-color: transparent;

        &.open {
            display: block;
        }

        .wrapper {
            padding: 0;
            max-height: none;
            overflow: visible;
        }
    }

    // the selected item (mouse over): blue background and white text; the icon keeps its grey
    &:hover {
        background: var(--menu-item-bg-selected);
        color: var(--menu-item-text-selected);
    }

    // the icons of the Figma are drawn for the 18px of the menu
    .icon {
        height: var(--menu-icon-size);
        width: var(--menu-icon-size);
        margin-right: $small;
        color: var(--menu-item-icon);

        svg {
            height: 100%;
            width: 100%;
        }
    }

    // the delete icon is always error/300 (white while the red item is selected)
    &.critical .icon {
        color: var(--color-error-300);
    }

    &.critical:hover .icon {
        color: var(--color-neutral-white);
    }

    // items with the icons of the album menu prototype
    &.menu-icon {
        min-height: var(--menu-item-height);
        padding: 0 var(--menu-item-padding-x);
        border-radius: var(--menu-item-radius);

        .icon {
            height: var(--menu-icon-size);
            width: var(--menu-icon-size);
            margin-right: var(--menu-item-gap);
            flex-shrink: 0;
        }

        &:hover .icon {
            color: var(--menu-item-icon-selected);
        }

        &.critical:hover .icon {
            color: var(--color-neutral-white);
        }

        .label {
            padding-right: 0;
        }

        &:has(.more) .label {
            padding-right: 1.25rem;
        }

        // no arrow: give the text the room of the arrow too ("Remove from EPs & Singles")
        &:not(:has(.more)) {
            padding-right: 2px;
        }
    }

    .label {
        // takes what is left, so longer labels (like "Remove from EPs & Singles") fit;
        // the padding keeps clear of the arrow of the items with a submenu
        flex: 1;
        min-width: 0;
        padding-right: 1rem;
    }
}

/* Removes the cursor pointer on the empty area within children dropdown of context-items */
.context-item:has(.children) > .children {
    cursor: initial !important;
}
</style>
