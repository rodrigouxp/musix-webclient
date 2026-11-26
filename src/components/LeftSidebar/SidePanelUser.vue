<template>
  <!-- The user of the SidePanel (Penpot: SidePanel > content > user): the photo and the name. The pointer on it opens the same user
       menu the TopBar had (ProfileDropdown, untouched); a click or the keyboard open it too. -->
  <button
    ref="rowRef"
    v-wave
    class="footer-item footer-user"
    type="button"
    aria-haspopup="menu"
    :aria-expanded="open"
    :aria-label="settings.side_panel_collapsed ? name : undefined"
    :title="settings.side_panel_collapsed ? name : undefined"
    @pointerenter="onPointerEnter"
    @pointerleave="onPointerLeave"
    @click="onClick"
    @keydown="onRowKeydown"
  >
    <span class="user-photo"><Avatar :name="name" :size="36" /></span>
    <span class="footer-label user-name">{{ name }}</span>
  </button>

  <!-- the menu is outside the panel (the panel clips what overflows it) and over everything -->
  <Teleport to="body">
    <div
      ref="menuRef"
      class="sidepanel-user-menu"
      :class="{ open }"
      role="menu"
      :style="menuStyle"
      @pointerenter="onPointerEnter"
      @pointerleave="onPointerLeave"
      @focusout="onFocusOut"
      @keydown="onMenuKeydown"
      @click="close()"
    >
      <ProfileDropdown />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from "vue";

import Avatar from "@/components/shared/Avatar.vue";
import ProfileDropdown from "@/components/nav/ProfileDropdown.vue";
import useAuth from "@/stores/auth";
import useSettings from "@/stores/settings";

const auth = useAuth();
const settings = useSettings();

const name = computed(() => auth.user?.username || "");

const open = ref(false);
const rowRef = ref<HTMLElement | null>(null);
const menuRef = ref<HTMLElement | null>(null);
const menuStyle = ref<Record<string, string>>({});

// The menu opens to the right of the panel, with its bottom on the bottom of the user (the user is the last thing of
// the panel). The wrapper starts at the edge of the user and has a transparent left padding that reaches the menu, so the
// pointer never leaves the pair on its way from the user to the menu; the delay below covers the rest.
function place() {
  const row = rowRef.value;
  if (!row) return;

  const rect = row.getBoundingClientRect();
  const panel = row.closest(".l-sidebar")?.getBoundingClientRect() ?? rect;
  const bridge = panel.right - rect.right + parseFloat(getComputedStyle(row).getPropertyValue("--sidepanel-user-menu-gap") || "8");

  menuStyle.value = {
    left: `${rect.right}px`,
    bottom: `${window.innerHeight - rect.bottom}px`,
    paddingLeft: `${bridge}px`,
  };
}

let closeTimer: ReturnType<typeof setTimeout> | undefined;
const closeDelay = 150;

function show() {
  clearTimeout(closeTimer);
  if (open.value) return;

  place();
  open.value = true;
  document.addEventListener("pointerdown", onOutsidePointerDown, true);
}

function close(focusRow = false) {
  clearTimeout(closeTimer);
  if (!open.value) return;

  open.value = false;
  document.removeEventListener("pointerdown", onOutsidePointerDown, true);
  if (focusRow) rowRef.value?.focus();
}

// only a mouse hovers: a finger or a pen opens it with the click and closes it by touching elsewhere
function onPointerEnter(e: PointerEvent) {
  if (e.pointerType !== "mouse") return;
  show();
}

function onPointerLeave(e: PointerEvent) {
  if (e.pointerType !== "mouse") return;

  clearTimeout(closeTimer);
  closeTimer = setTimeout(() => close(), closeDelay);
}

function onOutsidePointerDown(e: PointerEvent) {
  const target = e.target as Node;
  if (rowRef.value?.contains(target) || menuRef.value?.contains(target)) return;
  close();
}

// the items of the menu are the ContextItem of the context menus (plain divs): they get a tab stop of their own here
// so the arrows can reach them
function items() {
  return Array.from(menuRef.value?.querySelectorAll<HTMLElement>(".profiledrop > .context-item") ?? []);
}

async function openAndFocusFirst() {
  show();
  await nextTick();

  items().forEach((item) => {
    item.setAttribute("role", "menuitem");
    item.tabIndex = -1;
  });
  items()[0]?.focus();
}

// a click opens (it never closes: the pointer already opened it on the way in); Enter and Space come as a click without
// a pointer (detail 0): those also move the focus into the menu
function onClick(e: MouseEvent) {
  if (e.detail === 0) openAndFocusFirst();
  else show();
}

function onRowKeydown(e: KeyboardEvent) {
  if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    openAndFocusFirst();
  } else if (e.key === "Escape") {
    close();
  }
}

function onMenuKeydown(e: KeyboardEvent) {
  const list = items();
  const index = list.indexOf(document.activeElement as HTMLElement);

  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      list[(index + 1) % list.length]?.focus();
      break;
    case "ArrowUp":
      e.preventDefault();
      list[(index - 1 + list.length) % list.length]?.focus();
      break;
    case "Home":
      e.preventDefault();
      list[0]?.focus();
      break;
    case "End":
      e.preventDefault();
      list[list.length - 1]?.focus();
      break;
    case "Enter":
    case " ":
      e.preventDefault();
      (document.activeElement as HTMLElement | null)?.click();
      break;
    case "Escape":
    case "ArrowLeft":
      e.preventDefault();
      close(true);
      break;
  }
}

// the focus left the menu for somewhere else (a Tab): it closes. A click on a part of the menu that cannot take focus
// sends the focus to the page (no related target) and does not close it.
function onFocusOut(e: FocusEvent) {
  const next = e.relatedTarget as Node | null;
  if (next && !menuRef.value?.contains(next) && !rowRef.value?.contains(next)) close();
}

onBeforeUnmount(() => {
  clearTimeout(closeTimer);
  document.removeEventListener("pointerdown", onOutsidePointerDown, true);
});
</script>

<style lang="scss">
// The user of the Penpot SidePanel: open, a row of 40 with the photo of 24 and the name (paragraph-12px, neutral/300);
// closed, only the photo, 36 with no padding. The row shares the style of the other footer buttons (SidePanelFooter.vue).
.sidepanel-footer .footer-user {
  .user-photo {
    flex-shrink: 0;
    width: var(--sidepanel-footer-icon-slot);
    height: var(--sidepanel-footer-icon-slot);
    border-radius: 400px;
    overflow: hidden;
    transition:
      width var(--panel-toggle-transition),
      height var(--panel-toggle-transition);

    // the photo is the avatar of the user, drawn at the size of its box
    svg {
      display: block;
      width: 100%;
      height: 100%;
    }
  }

  .user-name {
    @include text('paragraph-12px');
    color: var(--sidepanel-user-name-color);
  }
}

.l-sidebar.collapsed .sidepanel-footer .footer-user {
  // no padding: the photo of 36 is the whole row
  padding: 0;

  .user-photo {
    width: var(--sidepanel-user-avatar-collapsed-size);
    height: var(--sidepanel-user-avatar-collapsed-size);
  }
}

// The menu: ProfileDropdown as it was in the TopBar (same items, same panel). Here only its place changes: next to the user and not
// under the avatar. It fades in like the old one did.
.sidepanel-user-menu {
  position: fixed;
  z-index: 9999;
  opacity: 0;
  visibility: hidden;
  transform: translateX(-0.5rem);
  transition:
    opacity 0.2s ease-out,
    visibility 0.2s ease-out,
    transform 0.2s ease-out;

  &.open {
    opacity: 1;
    visibility: visible;
    transform: translateX(0);
  }

  // the menu is placed by the wrapper
  .profiledrop {
    position: static;
  }

  // the keyboard selection looks like the hover of the items
  .context-item:focus-visible {
    outline: none;
    background-color: var(--menu-item-bg-hover);
  }

  .critical:focus-visible {
    background-color: var(--color-error-300);
    color: var(--color-neutral-white);
  }
}

@media (prefers-reduced-motion: reduce) {
  .sidepanel-footer .footer-user .user-photo,
  .sidepanel-user-menu {
    transition: none;
  }
}
</style>
