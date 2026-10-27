import { createApp } from "vue";
import { createPinia } from "pinia";

import { MotionPlugin } from "@vueuse/motion";
import WrapBalancer from "vue-wrap-balancer";

import {
  RecycleScroller,
  DynamicScroller,
  DynamicScrollerItem,
  // @ts-ignore
} from "vue-virtual-scroller";
import VWave from "v-wave";
import { autoAnimatePlugin } from "@formkit/auto-animate/vue";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";

import App from "./App.vue";
import { router } from "./router";
import vTooltip from "./directives/vTooltip";

// Roboto, variable (weights 100 to 900: the 500 and 600 of the side panel), served by the app itself.
// By the path of the file: the Vite 3 of this project does not read the `exports` of the package.
import "../node_modules/@fontsource-variable/roboto/wght.css";
import "./assets/scss/index.scss";
import "vue-virtual-scroller/dist/vue-virtual-scroller.css";

import i18n from "./i18n";

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
const app = createApp(App);

app.use(pinia);
app.use(router);
app.use(autoAnimatePlugin);
app.use(VWave, {});
app.use(i18n);
app.use(MotionPlugin);

app.directive("tooltip", vTooltip);

app.component("WrapBalancer", WrapBalancer);
app.component("RecycleScroller", RecycleScroller);
app.component("DynamicScroller", DynamicScroller);
app.component("DynamicScrollerItem", DynamicScrollerItem);

app.mount("#app");