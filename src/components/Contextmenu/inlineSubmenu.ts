// Only one submenu is open at a time in the compact mode (phones, landscape), where the
// submenus open inside the context menu. This lives in a module because every item of the
// menu is its own component instance.
let closeCurrent: (() => void) | null = null

/** Opens a submenu: the one that was open is closed. */
export function claimInlineSubmenu(close: () => void) {
    if (closeCurrent && closeCurrent !== close) closeCurrent()
    closeCurrent = close
}

/** The submenu was closed (or its item went away). */
export function releaseInlineSubmenu(close: () => void) {
    if (closeCurrent === close) closeCurrent = null
}
