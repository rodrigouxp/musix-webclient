import { onBeforeUnmount, onMounted } from 'vue'

// The scrollbars of the panels show while their list is scrolling and fade out after it. Every element that scrolls gets
// `data-scrolling="true"` while it scrolls and `"false"` a moment after the last scroll event; the CSS does the rest
// (assets/scss/Global/scrollbars.scss). An attribute and not a class: Vue rewrites the classes of its elements.
const HIDE_AFTER = 800

export default function useAutoHideScrollbars() {
    const timers = new WeakMap<HTMLElement, number>()

    function onScroll(e: Event) {
        const el = e.target
        if (!(el instanceof HTMLElement)) return

        if (el.dataset.scrolling !== 'true') el.dataset.scrolling = 'true'

        window.clearTimeout(timers.get(el))
        timers.set(
            el,
            window.setTimeout(() => {
                el.dataset.scrolling = 'false'
            }, HIDE_AFTER)
        )
    }

    // the scroll event does not bubble: it is caught on the way down
    onMounted(() => document.addEventListener('scroll', onScroll, { capture: true, passive: true }))
    onBeforeUnmount(() => document.removeEventListener('scroll', onScroll, { capture: true }))
}
