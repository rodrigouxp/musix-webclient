import { onBeforeUnmount, onMounted, ref } from 'vue'

// how far the sheet has to be pulled down to close, and the speed (px per ms) of a flick that closes it from any distance
const DISTANCE = 120
const FLICK = 0.5
// how far a gesture can move before we decide if it is ours (a vertical pull down) or the page's (a scroll, a swipe aside)
const SLOP = 8

interface Options {
    /** The sheet that follows the finger. */
    root: () => HTMLElement | null
    /** Called on release: `true` when it was pulled far or fast enough to close. */
    onRelease: (close: boolean) => void
    /** The gesture does not start on elements that match this selector (sliders, drag handles). */
    ignore?: string
}

/**
 * The swipe down that closes a full screen sheet (NowPlaying on the phone). It follows the finger with an offset
 * (`offset`, in px) that the sheet applies as `translateY`.
 *
 * The gesture only starts on something that is not scrolled: if the touch begins on (or inside) a list that has
 * its own vertical scroll, the list has to be at its top, and even then only a pull *down* is ours; a pull up or
 * a swipe aside is left to the page. Once it is ours the browser scroll is blocked (a non passive `touchmove`: a
 * pointer event cannot stop the scroll of a touch screen, and the browser cancels it as soon as the pan starts).
 * With a mouse it is the same gesture on pointer events (for a desktop browser narrowed to the phone width).
 */
export default function useSwipeDown(options: Options) {
    const offset = ref(0)
    const dragging = ref(false)

    let tracking = false
    let startX = 0
    let startY = 0
    let lastY = 0
    let lastT = 0
    let speed = 0

    function canStart(target: EventTarget | null) {
        const root = options.root()
        let node = target instanceof HTMLElement ? target : null

        while (node && node !== root) {
            if (options.ignore && node.matches(options.ignore)) return false

            if (node.scrollHeight > node.clientHeight + 1) {
                const overflow = getComputedStyle(node).overflowY

                if ((overflow === 'auto' || overflow === 'scroll') && node.scrollTop > 0) return false
            }

            node = node.parentElement
        }

        return true
    }

    function start(x: number, y: number, target: EventTarget | null) {
        tracking = canStart(target)
        dragging.value = false
        startX = x
        startY = y
        lastY = y
        lastT = performance.now()
        speed = 0
    }

    // returns true when the gesture is ours (the caller blocks the scroll)
    function move(x: number, y: number): boolean {
        if (!tracking) return false

        const dx = x - startX
        const dy = y - startY

        if (!dragging.value) {
            if (Math.abs(dx) < SLOP && Math.abs(dy) < SLOP) return false

            // up, or more aside than down: the page's
            if (dy <= 0 || Math.abs(dx) > Math.abs(dy)) {
                tracking = false
                return false
            }

            dragging.value = true
        }

        const now = performance.now()

        if (now > lastT) speed = (y - lastY) / (now - lastT)

        lastY = y
        lastT = now
        offset.value = Math.max(0, dy)

        return true
    }

    function end(cancelled = false) {
        if (!tracking) return

        tracking = false

        if (!dragging.value) return

        dragging.value = false
        options.onRelease(!cancelled && (offset.value > DISTANCE || speed > FLICK))
    }

    // ---- touch ----
    function onTouchStart(e: TouchEvent) {
        if (e.touches.length !== 1) {
            tracking = false
            return
        }

        start(e.touches[0].clientX, e.touches[0].clientY, e.target)
    }

    function onTouchMove(e: TouchEvent) {
        if (e.touches.length !== 1) return

        if (move(e.touches[0].clientX, e.touches[0].clientY) && e.cancelable) e.preventDefault()
    }

    const onTouchEnd = () => end()
    const onTouchCancel = () => end(true)

    // ---- mouse ----
    function onPointerDown(e: PointerEvent) {
        if (e.pointerType !== 'mouse' || e.button !== 0) return

        start(e.clientX, e.clientY, e.target)

        if (tracking) {
            window.addEventListener('pointermove', onPointerMove)
            window.addEventListener('pointerup', onPointerUp)
        }
    }

    function onPointerMove(e: PointerEvent) {
        if (e.pointerType === 'mouse') move(e.clientX, e.clientY)
    }

    function onPointerUp() {
        window.removeEventListener('pointermove', onPointerMove)
        window.removeEventListener('pointerup', onPointerUp)
        end()
    }

    onMounted(() => {
        const el = options.root()

        if (!el) return

        el.addEventListener('touchstart', onTouchStart, { passive: true })
        el.addEventListener('touchmove', onTouchMove, { passive: false })
        el.addEventListener('touchend', onTouchEnd)
        el.addEventListener('touchcancel', onTouchCancel)
        el.addEventListener('pointerdown', onPointerDown)
    })

    onBeforeUnmount(() => {
        const el = options.root()

        el?.removeEventListener('touchstart', onTouchStart)
        el?.removeEventListener('touchmove', onTouchMove)
        el?.removeEventListener('touchend', onTouchEnd)
        el?.removeEventListener('touchcancel', onTouchCancel)
        el?.removeEventListener('pointerdown', onPointerDown)
        window.removeEventListener('pointermove', onPointerMove)
        window.removeEventListener('pointerup', onPointerUp)
    })

    /** Puts the sheet back at rest (after a release that did not close). */
    function reset() {
        offset.value = 0
    }

    return { offset, dragging, reset }
}
