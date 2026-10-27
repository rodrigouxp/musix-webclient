<template>
    <div class="sidenav noSelect">
        <div class="sidenav_header">
            <a @click="closeSidenav" class="sidenav_logo" href="#">
                <div class="art"><LogoSvg /></div>
                <div class="title">{{ $t('Common.AppTitle') }}</div>
            </a>
        </div>
        <div class="sidenav_content scrollable">
            <RouterLink
                v-for="link in topnavitems"
                :key="link.name"
                class="link"
                :to="{ name: link.route_name, params: link.params }"
                :class="{ active: $route.name === link.route_name, 'icon-active': $route.name === link.route_name }"
                @click="closeSidenav"
            >
                <component :is="link.icon" :style="link.icon_pad ? { boxSizing: 'border-box', padding: link.icon_pad } : undefined" />
                <!-- Render the icon as a Vue component -->
                <span>{{ link.name }}</span>
            </RouterLink>
        </div>
        <div class="sidenav_footer">MUSIX - v{{ settings.version }}</div>
    </div>
</template>

<script setup lang="ts">
import LogoSvg from '@/assets/icons/logos/note.svg'
import { useNavItems } from "../LeftSidebar/navitems";
import useSettings from '@/stores/settings'
const { topnavitems } = useNavItems();
const settings = useSettings()

const emit = defineEmits(['close'])

function closeSidenav() {
    emit('close')
}
</script>

<style lang="scss">
.sidenav_toggle {
    display: none;

    @include allPhones {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        flex-shrink: 0;
        gap: 6px;
        width: 32px;
        height: 32px;
        padding: 2px;
        cursor: pointer;

        // the menu icon of the Figma: 16px (the glyph is 16 x 9.6px, like the two bars it replaced)
        > svg {
            height: 16px;
            width: 16px;
            color: $white;
            opacity: 0.75;
            transition: opacity 0.2s ease-out;
        }

        &:hover {
            > svg {
                opacity: 1;
            }
        }
    }
}

.sidenav {
    display: none;

    @include allPhones {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 1002;
        width: 240px;
        height: 100%;
        display: flex;
        flex-direction: column;
        background-color: $body;
        transform: translateX(-240px);
        transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);

        .sidenav_header {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: $large 24px;
            box-sizing: border-box;

            .sidenav_logo {
                display: flex;
                align-items: center;
                gap: 1rem;

                .art svg {
                    width: 2rem;
                    height: 2rem;
                }

                .title {
                    font-size: 1rem;
                    font-weight: 600;
                    line-height: 1.4;
                }
            }
        }

        .sidenav_content {
            display: flex;
            flex-direction: column;
            position: relative;
            height: 100%;
            margin-right: 2px;
            overflow: auto;
            overflow-x: hidden;
            overscroll-behavior: contain;
            -webkit-overflow-scrolling: touch;

            .link {
                font-size: 0.9rem;
                font-weight: 500;
                line-height: 1.2;
                text-transform: capitalize;
                position: relative;
                display: flex;
                align-items: center;
                gap: 1rem;
                margin: $smaller $medium;
                padding: $small $medium;
                cursor: pointer;
            }

            svg {
                height: 1.5rem;
                width: 1.5rem;
                flex-shrink: 0;
            }

            // INFO: svgo drops the viewBox of the 18x18 icons (Albums, Artists), so they cannot scale; padding keeps them centered in the same 1.5rem box
            svg[width="18"][height="18"] {
                box-sizing: border-box;
                padding: 3px;
            }
        }

        .sidenav_footer {
            font-size: $medium;
            margin: $large auto;
            opacity: 0.5;
        }
    }
}

.sidenav.active {
    transform: translateX(0);
}
</style>
