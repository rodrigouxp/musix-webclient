<template>
    <!-- The user menu: the rows are the ContextItem of the context menus (icon, then text) and the
         panel is made of the same --menu-* tokens. It opens on hover (see AvatarWithDropdown.vue). -->
    <div class="profiledrop noSelect">
        <div class="greeting">
            <div class="ellip">{{ $t('ProfileDropdown.HiUser', { user: auth.user.firstname || auth.user.username }) }}</div>
        </div>
        <div class="separator"></div>
        <ContextItem
            v-for="option in scanAndSettings"
            :key="option.label"
            class="context-item menu-icon"
            :option="option"
            :children-show-mode="settings.contextChildrenShowMode"
            @hideContextMenu="noop"
        />
        <div class="separator"></div>
        <ContextItem
            class="context-item menu-icon critical"
            :option="logout"
            :children-show-mode="settings.contextChildrenShowMode"
            @hideContextMenu="noop"
        />
    </div>
</template>

<script setup lang="ts">
import { LogoutIcon, RefreshIcon, SettingsIcon } from '@/icons'
import { Option } from '@/interfaces'
import { triggerScan } from '@/requests/settings/rootdirs'
import useAuth from '@/stores/auth'
import useModal from '@/stores/modal'
import useSettings from '@/stores/settings'
import { useT } from '@/i18n'

import ContextItem from '../Contextmenu/ContextItem.vue'

const { t } = useT()
const auth = useAuth()
const modal = useModal()
const settings = useSettings()

const scanAndSettings: Option[] = [
    { label: t('ProfileDropdown.QuickScan'), icon: RefreshIcon, action: () => triggerScan(false), menuIcon: true },
    { label: t('Common.Settings'), icon: SettingsIcon, action: () => modal.showSettingsModal(), menuIcon: true },
]

const logout: Option = { label: t('Common.LogOut'), icon: LogoutIcon, action: () => auth.logout(), menuIcon: true, critical: true }

// the menu closes when the pointer leaves the avatar: there is nothing to hide on click
const noop = () => {}
</script>

<style lang="scss">
.profiledrop {
    position: absolute;
    z-index: 9999;
    top: 2.25rem;
    right: 0;
    width: var(--menu-width);
    // never wider than the screen
    max-width: calc(100vw - 16px);
    padding: var(--menu-padding-y) var(--menu-padding-x);
    background: var(--menu-bg);
    border-radius: var(--menu-radius);
    box-shadow: var(--menu-shadow);
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--menu-item-text);
    cursor: default;

    // "Hi {name}": not a button, the same height and edges as the items
    .greeting {
        display: flex;
        align-items: center;
        min-height: var(--menu-item-height);
        padding: 0 var(--menu-item-padding-x);

        .ellip {
            min-width: 0;
        }
    }

    // the thin separator of the menus: the gap of the prototype above and below
    .separator {
        height: 0;
        margin: var(--menu-gap) 0;
        border-top: var(--menu-divider-width) solid var(--menu-divider);
    }

    // the red item (Log out): red text, red background while selected
    .critical {
        color: var(--color-error-300);
        transition: background-color 0.2s ease-out, color 0.2s ease-out;

        &:hover {
            background-color: var(--color-error-300);
            color: var(--color-neutral-white);
        }
    }
}
</style>
