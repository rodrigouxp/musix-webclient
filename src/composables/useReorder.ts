import { onBeforeUnmount, reactive } from 'vue'

// touch: how long the finger has to stay on an item before the drag starts, and how much it can move meanwhile (it is a scroll then)
const HOLD_MS = 350
const HOLD_SLOP = 8
// mouse: how far the pointer goes with the button down before the drag starts (a click does not move)
const MOUSE_SLOP = 6
// how close to the edge of the scrolling box the pointer has to be for it to scroll by itself, and the most it scrolls per frame
const EDGE = 48
const MAX_SPEED = 14
// how long after a drag the click that ends it is thrown away (it would open the playlist)
const CLICK_GUARD_MS = 400

interface Options {
    /** CSS selector of the items that can be moved: they are the children of the same parent, in the order of the list. */
    itemSelector: string
    /** 'column': one item per row (the SidePanel); 'grid': cards that wrap (the Playlists page). */
    layout: 'column' | 'grid'
    /** The drop: the item at `from` goes to `to` (both positions of the list, after the move). */
    onDrop: (from: number, to: number) => void
}

/**
 * Drag the items of a list (the pinned playlists of the SidePanel, the cards of the Playlists page) to another position, with
 * pointer events: they work with a mouse and with touch.
 *
 * With a mouse the drag starts when the pointer moves a few pixels with the button down (a plain click still opens the item).
 * With a finger it starts after a long press (350 ms without moving more than 8px): until then the list scrolls as always.
 * The item that is dragged follows the pointer; a line shows where it will go; the scrolling box scrolls by itself near its
 * edges. It does not copy the item: the one in the page moves, and goes back to its place when the drag ends (the list is
 * redrawn by the caller on the drop).
 *
 * `blocksMenu` is for the `contextmenu` of the items: on Android a long press fires it, and here the long press is the drag.
 * A long press that is let go without moving is not a drag: the item gets a `contextmenu` event of its own, so its menu opens
 * (the long press was the menu before the drag took it).
 */
export default function useReorder(options: Options) {
    const state = reactive({ pending: false, active: false, from: -1, slot: -1 })

    let el: HTMLElement | null = null
    let scroller: HTMLElement | null = null
    let line: HTMLElement | null = null
    let touching = false
    let released = false
    let frame = 0
    let holdTimer = 0
    let startX = 0
    let startY = 0
    let pointerX = 0
    let pointerY = 0
    let scroll0 = 0
    let travelled = 0
    let previousSelect = ''
    let previousCursor = ''

    function items() {
        const parent = el?.parentElement

        return parent ? [...parent.querySelectorAll<HTMLElement>(`:scope > ${options.itemSelector}`)] : []
    }

    // the nearest ancestor that scrolls vertically (the page of the playlists, the list of the SidePanel)
    function findScroller(from: HTMLElement | null) {
        let node = from?.parentElement ?? null

        while (node) {
            const overflowY = getComputedStyle(node).overflowY

            if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) return node

            node = node.parentElement
        }

        return null
    }

    // where the item is when it is not moved: its box minus the translation that the drag gave it
    function naturalRects() {
        const list = items()
        const dx = el ? Number(el.dataset.reorderX || 0) : 0
        const dy = el ? Number(el.dataset.reorderY || 0) : 0

        return list.map(item => {
            const rect = item.getBoundingClientRect()

            return item === el
                ? new DOMRect(rect.left - dx, rect.top - dy, rect.width, rect.height)
                : rect
        })
    }

    // the slot under the pointer: the item is inserted before the slot'th item (the number of items is the end)
    function update() {
        if (!el) return

        const list = items()
        const rects = naturalRects()
        const others = list.map((item, index) => ({ item, index, rect: rects[index] })).filter(o => o.item !== el)

        if (!others.length) {
            state.slot = state.from
            hideLine()
            return
        }

        let slot: number
        // grid: the card the line is drawn next to, and on which side (the end of a row and the start of the next one are the same slot)
        let anchor: { rect: DOMRect; after: boolean } | undefined

        if (options.layout === 'column') {
            const next = others.find(o => pointerY < o.rect.top + o.rect.height / 2)

            slot = next ? next.index : list.length
        } else {
            // the card nearest to the pointer; before it if the pointer is on its left half, after it if not
            let best = others[0]
            let bestDistance = Infinity

            for (const o of others) {
                const distance = Math.hypot(pointerX - (o.rect.left + o.rect.width / 2), pointerY - (o.rect.top + o.rect.height / 2))

                if (distance < bestDistance) {
                    best = o
                    bestDistance = distance
                }
            }

            const after = pointerX >= best.rect.left + best.rect.width / 2

            slot = after ? best.index + 1 : best.index
            anchor = { rect: best.rect, after }
        }

        state.slot = slot
        drawLine(rects, slot, anchor)
    }

    function hideLine() {
        if (line) line.style.display = 'none'
    }

    function drawLine(rects: DOMRect[], slot: number, anchor?: { rect: DOMRect; after: boolean }) {
        if (!line) return

        // the same place as the item had: nothing to show
        if (slot === state.from || slot === state.from + 1) {
            hideLine()
            return
        }

        const before = rects[slot]
        const last = rects[rects.length - 1]

        line.style.display = 'block'

        if (options.layout === 'column') {
            const ref = before ?? last

            line.style.left = ref.left + 'px'
            line.style.width = ref.width + 'px'
            line.style.height = '2px'
            line.style.top = (before ? before.top : last.bottom) - 1 + 'px'
        } else {
            const ref = anchor?.rect ?? before ?? last
            const atRight = anchor ? anchor.after : !before

            line.style.top = ref.top + 'px'
            line.style.height = ref.height + 'px'
            line.style.width = '2px'
            line.style.left = (atRight ? ref.right + 6 : ref.left - 6) - 1 + 'px'
        }
    }

    function follow() {
        if (!el) return

        const dx = pointerX - startX
        // the item scrolls with the list: the scroll that happened since the start is added so it stays under the pointer
        const dy = pointerY - startY + (scroller ? scroller.scrollTop - scroll0 : 0)

        el.dataset.reorderX = String(dx)
        el.dataset.reorderY = String(dy)
        el.style.transform = `translate(${dx}px, ${dy}px)`
    }

    function autoscroll() {
        if (state.active && scroller) {
            const box = scroller.getBoundingClientRect()
            let speed = 0

            if (pointerY < box.top + EDGE) speed = -MAX_SPEED * Math.min(1, (box.top + EDGE - pointerY) / EDGE)
            else if (pointerY > box.bottom - EDGE) speed = MAX_SPEED * Math.min(1, (pointerY - (box.bottom - EDGE)) / EDGE)

            if (speed !== 0) scroller.scrollTop += speed
        }

        if (state.active) {
            follow()
            update()
        }

        frame = requestAnimationFrame(autoscroll)
    }

    function onMove(e: PointerEvent) {
        pointerX = e.clientX
        pointerY = e.clientY
        travelled = Math.max(travelled, Math.hypot(pointerX - startX, pointerY - startY))

        if (state.active) {
            e.preventDefault()
            follow()
            update()
            return
        }

        // touch, still waiting for the long press: a finger that moves is a scroll, not a drag
        if (touching && travelled > HOLD_SLOP) {
            finish()
            return
        }

        if (!touching && travelled > MOUSE_SLOP) activate()
    }

    // the page does not scroll while an item is dragged (iOS only looks at this event)
    function onTouchMove(e: TouchEvent) {
        if (state.active && e.cancelable) e.preventDefault()
    }

    function onKey(e: KeyboardEvent) {
        if (e.key === 'Escape') {
            e.preventDefault()
            finish()
        }
    }

    function guardClick() {
        const stop = (e: Event) => {
            e.preventDefault()
            e.stopPropagation()
        }

        window.addEventListener('click', stop, { capture: true, once: true })
        window.setTimeout(() => window.removeEventListener('click', stop, { capture: true }), CLICK_GUARD_MS)
    }

    function onUp(e: PointerEvent) {
        released = true

        const from = state.from
        const slot = state.slot
        const wasActive = state.active
        const moved = travelled > HOLD_SLOP
        const wasTouch = touching
        const target = el

        if (wasActive) guardClick()

        finish()

        if (!wasActive) return

        if (slot >= 0 && from >= 0) {
            const to = slot > from ? slot - 1 : slot

            if (to !== from) {
                options.onDrop(from, to)
                return
            }
        }

        // a finger that pressed and let go without moving: the menu of the item
        if (wasTouch && !moved) {
            target?.dispatchEvent(
                new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: e.clientX, clientY: e.clientY })
            )
        }
    }

    function activate() {
        if (!el || state.active) return

        scroller = findScroller(el)
        scroll0 = scroller ? scroller.scrollTop : 0
        state.active = true
        state.slot = state.from

        el.classList.add('reorder-lifted')
        previousSelect = document.body.style.userSelect
        previousCursor = document.body.style.cursor
        document.body.style.userSelect = 'none'
        document.body.style.cursor = 'grabbing'

        line = document.createElement('div')
        line.className = 'reorder-line'
        line.style.display = 'none'
        document.body.appendChild(line)

        follow()
        update()
        navigator.vibrate?.(10)
    }

    function finish() {
        cancelAnimationFrame(frame)
        clearTimeout(holdTimer)

        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', finish)
        window.removeEventListener('blur', finish)
        window.removeEventListener('keydown', onKey)
        document.removeEventListener('touchmove', onTouchMove)

        if (state.active) {
            document.body.style.userSelect = previousSelect
            document.body.style.cursor = previousCursor
        }

        if (el) {
            el.classList.remove('reorder-lifted')
            el.style.transform = ''
            delete el.dataset.reorderX
            delete el.dataset.reorderY
        }

        line?.remove()
        line = null
        el = null
        scroller = null
        touching = false
        state.pending = false
        state.active = false
        state.from = -1
        state.slot = -1
    }

    /** `pointerdown` of an item (the element that has the listener), with its position in the list. */
    function begin(e: PointerEvent, index: number) {
        if (e.pointerType === 'mouse' && e.button !== 0) return
        if (state.pending || state.active) return

        el = e.currentTarget as HTMLElement
        released = false
        travelled = 0
        startX = pointerX = e.clientX
        startY = pointerY = e.clientY
        state.pending = true
        state.from = index

        touching = e.pointerType === 'touch' || e.pointerType === 'pen'

        window.addEventListener('pointermove', onMove, { passive: false })
        window.addEventListener('pointerup', onUp)
        window.addEventListener('pointercancel', finish)
        window.addEventListener('blur', finish)
        window.addEventListener('keydown', onKey)

        if (touching) {
            // not passive: it is how iOS lets a page stop the scroll
            document.addEventListener('touchmove', onTouchMove, { passive: false })

            holdTimer = window.setTimeout(() => {
                if (released || !state.pending) return

                activate()
                frame = requestAnimationFrame(autoscroll)
            }, HOLD_MS)

            return
        }

        frame = requestAnimationFrame(autoscroll)
    }

    // On Android a long press fires `contextmenu`: while the finger is down on an item, or right after a drag, it is the
    // drag (or, released in place, the menu that `onHold` opens), so the event is thrown away
    function blocksMenu(e: MouseEvent) {
        if (touching || state.active) {
            e.preventDefault()
            e.stopPropagation()
            return true
        }

        return false
    }

    onBeforeUnmount(finish)

    return { state, begin, blocksMenu }
}
