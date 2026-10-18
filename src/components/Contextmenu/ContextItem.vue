<template>
    <!-- TODO:  -->
    <div
        ref="parentRef"
        class="context-item"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
        @click="runAction"
    >
        <div class="icon image" v-html="option.icon"></div>
        <div class="label ellip">{{ option.label }}</div>
        <div v-if="hasChildren && !option.singleChild" class="more" v-html="MenuSubmenuIcon"></div>
        <div v-if="children" ref="childRef" class="children rounded shadow-sm">
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
import { computed, ref } from 'vue'

import { contextChildrenShowMode } from '@/enums'
import { MenuSubmenuIcon } from '@/icons'
import { Option } from '@/interfaces'

const props = defineProps<{
    option: Option
    childrenShowMode: contextChildrenShowMode
}>()

const emit = defineEmits<{
    // eslint-disable-next-line no-unused-vars
    (event: 'hideContextMenu'): void
}>()

const showChildrenDelay = 250
const stillWaitingForChildren = ref(false)
const children = ref<Option[] | false>(false)

const childrenShown = ref(false)
const childRef = ref<HTMLElement>()
const parentRef = ref<HTMLElement>()

const hasChildren = computed(() => {
    return props.option.children && props.childrenShowMode === contextChildrenShowMode.hover
})

let popperInstance: Instance | null = null

async function handleMouseEnter() {
    if (!hasChildren.value) return

    stillWaitingForChildren.value = true
    await new Promise(resolve => setTimeout(resolve, showChildrenDelay))

    if (stillWaitingForChildren.value) {
        showChildren()
    }
}

function handleMouseLeave() {
    if (!hasChildren.value) return
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

async function showChildren() {
    if (childrenShown.value) {
        childrenShown.value = false
        return
    }

    if (props.option.children) {
        await getChildren()
        // return;
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
                },
            },
            {
                name: 'flip',
                options: {
                    fallbackPlacements: ['left-start', 'auto'],
                    boundariesElement: 'viewport',
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

    // the arrow of the items that open a submenu: 8 x 12, 10px from the right edge
    .more {
        height: 12px;
        width: 8px;
        position: absolute;
        right: 10px;
        top: 50%;
        margin-top: -6px;
        color: var(--menu-item-icon);

        svg {
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

    // the selected item (mouse over): blue background and white text; the icon keeps its grey
    &:hover {
        background: var(--menu-item-bg-selected);
        color: var(--menu-item-text-selected);
    }

    .icon {
        height: 1.25rem;
        width: 1.25rem;
        margin-right: $small;
        color: var(--menu-item-icon);

        svg {
            height: 100%;
            width: 100%;
        }
    }

    // add to queue icon (the old one: the new icons are already the right size)
    &:nth-child(2):not(.menu-icon) .icon > svg {
        transform: scale(0.85);
    }

    // an 18px icon in a menu that keeps its old layout: the text stays where it was
    // (20px icon + 8px gap = 18px icon + 10px gap)
    &.icon18 .icon {
        height: var(--menu-icon-size);
        width: var(--menu-icon-size);
        margin-right: calc($small + 2px);
        flex-shrink: 0;
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
