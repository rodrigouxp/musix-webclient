/* eslint-disable no-undef */

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import svgLoader from "vite-svg-loader";
import { VitePWA } from "vite-plugin-pwa";
import viteCompression from "vite-plugin-compression";
import { nodePolyfills } from 'vite-plugin-node-polyfills'

const path = require("path");

// svgo (inside vite-svg-loader) drops the viewBox of the svgs that have width and height, and without
// the viewBox an icon cannot scale with the CSS size. The icons of the Figma (assets/icons/figma) all
// have `viewBox="0 0 W H"` equal to their size: this plugin puts it back after the default plugins,
// only for that folder (the other icons keep the optimization they always had).
const keepFigmaViewBox = {
  name: "keepFigmaViewBox",
  fn: (_root, _params, info) => {
    if (!/[\\/]icons[\\/]figma[\\/]/.test(info.path || "")) return;
    return {
      element: {
        exit: (node) => {
          if (node.name !== "svg" || node.attributes.viewBox) return;
          const { width, height } = node.attributes;
          if (width && height) node.attributes.viewBox = `0 0 ${parseFloat(width)} ${parseFloat(height)}`;
        },
      },
    };
  },
};

export default defineConfig({
  define: {
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false'
  },
  base: "./",
  plugins: [
    vue(),
    svgLoader({ svgoConfig: { plugins: ["preset-default", keepFigmaViewBox] } }),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: true,
      },
      manifest: {
        name: "MUSIX",
        short_name: "MUSIX",
        description: "MUSIX",
        theme_color: "#111",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        shortcuts: [
          {
            name: "Playlists",
            description: "View your playlists",
            url: "/#/playlists",
            icons: [
              {
                src: "/icons/playlist.svg",
                type: "image/svg+xml",
              },
            ],
          },
          {
            name: "Favorites",
            description: "View your favorites",
            url: "/#/favorites",
            icons: [
              {
                src: "/icons/heart.svg",
                type: "image/svg+xml",
              },
            ],
          },
          {
            name: "Settings",
            description: "Modify settings",
            url: "/#/settings",
            icons: [
              {
                src: "/icons/settings.svg",
                type: "image/svg+xml",
              },
            ],
          },
        ],
        start_url: "/",
        display: "standalone",
        background_color: "rgba(0, 0, 0, 0.95)",
      },
    }),
    viteCompression({
      threshold: 150,
    }),
    nodePolyfills({
      include: ['crypto'],
    }),
  ],
  resolve: {
    alias: {
      util: "util/",
      stream: "stream-browserify",
      "@": path.resolve(__dirname, "src"),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/assets/scss/_variables.scss", "@/assets/scss/_mixins.scss";`,
      },
    },
  },
  build: {
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1500,
    emptyOutDir: true,
  },
});
