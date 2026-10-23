import { onBeforeUnmount, reactive } from 'vue'

// how close to the top or the bottom of the list the pointer has to be for the list to scroll by itself
const EDGE = 64
// the most the list scrolls in one frame
const MAX_SPEED = 18
// touch: how long the finger has to stay on the handle before the drag starts, and how much it can move
const HOLD_MS = 350
const HOLD_SLOP = 8

interface Options {
    /** The element that scrolls (the DynamicScroller). */
    scroller: () => HTMLElement | null
    /** How many rows come before the first track (the header, "All tracks"). */
    rowsBefore: number
    /** The drop: the track at `from` goes to `to` (both are positions of the list, after the move). */
    onDrop: (from: number, to: number) => void
}

/**
 * Drag a row of a list to another position, with pointer events (they work with a mouse and with
 * touch). The list is virtual: the position under the pointer comes from the rows that are on
 * the screen (the `data-index` of each one), and the list scrolls by itself near its edges.
 *
 * With a mouse the drag starts at once. With a finger it starts after a long press (350 ms without
 * moving more than 8px): until then the list scrolls as always. From the moment the drag is on, the
 * scroll of the page is blocked (a non passive `touchmove`, which iOS needs).
 *
 * The pointer moves are listened on the window, because the row that started the drag can leave
 * the screen (and be removed) while the list scrolls.
 */
export default function useTrackDrag(options: Options) {
    const state = reactive({
        // the button went down on the handle, the drag starts when `before` is done (mouse) or
        // when the long press is done (touch)
        pending: false,
        active: false,
        from: -1,
        // where the row would be inserted (0 to the number of tracks), before the move
        slot: -1,
        pointerY: 0,
        // the box of the list, for the row that follows the pointer
        left: 0,
        width: 0,
        // where the line that shows the destination goes (screen coordinates)
        lineY: -1,
    })

    let released = false
    let frame = 0
    let holdTimer = 0
    let touching = false
    let startX = 0
    let startY = 0
    let previousSelect = ''
    let previousCursor = ''

    function rows() {
        const scroller = options.scroller()

        if (!scroller) return []

        return [...scroller.querySelectorAll<HTMLElement>('[data-index]')]
            .map(el => ({ index: Number(el.dataset.index) - options.rowsBefore, rect: el.getBoundingClientRect() }))
            .filter(row => row.index >= 0)
            .sort((a, b) => a.index - b.index)
    }

    // the slot under the pointer: before a row if the pointer is in its upper half, after it if not
    function update() {
        const visible = rows()

        if (!visible.length) return

        let slot = visible[0].index

        for (const row of visible) {
            slot = row.index + 1

            if (state.pointerY < row.rect.top + row.rect.height / 2) {
                slot = row.index
                break
            }
        }

        state.slot = slot

        const after = visible.find(row => row.index === slot)
        const before = visible.find(row => row.index === slot - 1)

        state.lineY = after ? after.rect.top : before ? before.rect.bottom : -1
    }

    function autoscroll() {
        const scroller = options.scroller()

        if (state.active && scroller) {
            const box = scroller.getBoundingClientRect()
            let speed = 0

            if (state.pointerY < box.top + EDGE) {
                speed = -MAX_SPEED * Math.min(1, (box.top + EDGE - state.pointerY) / EDGE)
            } else if (state.pointerY > box.bottom - EDGE) {
                speed = MAX_SPEED * Math.min(1, (state.pointerY - (box.bottom - EDGE)) / EDGE)
            }

            if (speed !== 0) scroller.scrollTop += speed

            update()
        }

        frame = requestAnimationFrame(autoscroll)
    }

    function onMove(e: PointerEvent) {
        state.pointerY = e.clientY

        if (state.active) {
            e.preventDefault()
            update()
            return
        }

        // touch, still waiting for the long press: a finger that moves is a scroll, not a drag
        if (touching && state.pending && Math.hypot(e.clientX - startX, e.clientY - startY) > HOLD_SLOP) {
            finish()
        }
    }

    // the page does not scroll while a row is dragged (iOS only looks at this event)
    function onTouchMove(e: TouchEvent) {
        if (state.active && e.cancelable) e.preventDefault()
    }

    function onUp() {
        released = true

        if (state.active && state.slot >= 0) {
            const to = state.slot > state.from ? state.slot - 1 : state.slot

            if (to !== state.from) options.onDrop(state.from, to)
        }

        finish()
    }

    function onKey(e: KeyboardEvent) {
        if (e.key === 'Escape') {
            e.preventDefault()
            finish()
        }
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

        touching = false
        state.pending = false
        state.active = false
        state.from = -1
        state.slot = -1
        state.lineY = -1
    }

    function listen() {
        window.addEventListener('pointermove', onMove, { passive: false })
        window.addEventListener('pointerup', onUp)
        window.addEventListener('pointercancel', finish)
        window.addEventListener('blur', finish)
        window.addEventListener('keydown', onKey)
    }

    function activate(index: number) {
        const box = options.scroller()?.getBoundingClientRect()

        state.left = box?.left ?? 0
        state.width = box?.width ?? 0
        state.from = index
        state.active = true

        previousSelect = document.body.style.userSelect
        previousCursor = document.body.style.cursor
        document.body.style.userSelect = 'none'
        document.body.style.cursor = 'grabbing'

        update()
        frame = requestAnimationFrame(autoscroll)
    }

    /**
     * Call it on `pointerdown` of the handle of the row at `index`. `before` runs first (it can load
     * the rest of the list): with a mouse the drag waits for it, with a finger it runs while the
     * finger is held. If the button is up when everything is ready, there is no drag.
     */
    async function begin(e: PointerEvent, index: number, before?: () => Promise<void>) {
        if (e.button !== undefined && e.button !== 0) return
        if (state.pending || state.active) return

        released = false
        state.pending = true
        state.pointerY = e.clientY

        if (e.pointerType === 'touch' || e.pointerType === 'pen') {
            touching = true
            startX = e.clientX
            startY = e.clientY

            listen()
            // not passive: it is how iOS lets a page stop the scroll
            document.addEventListener('touchmove', onTouchMove, { passive: false })

            const loading = before ? before() : Promise.resolve()

            holdTimer = window.setTimeout(async () => {
                await loading

                if (released || !state.pending) return

                activate(index)
                navigator.vibrate?.(10)
            }, HOLD_MS)

            return
        }

        e.preventDefault()
        listen()

        if (before) await before()

        if (released || !state.pending) {
            finish()
            return
        }

        activate(index)
    }

    onBeforeUnmount(finish)

    return { state, begin, cancel: finish }
}
