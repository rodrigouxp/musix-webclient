import { createPopper, Instance, Placement, VirtualElement } from "@popperjs/core";
import { defineStore } from "pinia";
import { ContextSrc } from "../enums";
import { Option } from "../interfaces";

function generateGetBoundingClientRect(x = 0, y = 0) {
  return () => ({
    width: 0,
    height: 0,
    top: y,
    right: x,
    bottom: y,
    left: x,
  });
}

// the popper of the open menu, kept to place it again when the menu changes size
let menuPopper: Instance | null = null;

export default defineStore("context-menu", {
  state: () => ({
    visible: false,
    options: [] as Option[],
    src: <null | ContextSrc>"",
    elem: <HTMLElement | null>null,
  }),
  actions: {
    showContextMenu(
      e: MouseEvent,
      getContextOptions: () => Promise<Option[]>,
      src: ContextSrc,
      // where the menu opens from the point (the right of the click by default)
      placement: Placement = "right-start",
      fallbackPlacements: Placement[] = ["left-start"]
    ) {
      if (this.visible) {
        this.hideContextMenu();
        return;
      }

      if (this.elem === null) {
        this.elem = document.getElementById("context-menu");
      }

      const virtualElement = {
        getBoundingClientRect: generateGetBoundingClientRect(e.x, e.y),
      } as VirtualElement;

      getContextOptions()
        .then((options) => {
          this.options = options;
        })
        .then(() => {
          menuPopper?.destroy();
          menuPopper = createPopper(virtualElement, this.elem as HTMLElement, {
            placement,
            modifiers: [
              {
                name: "flip",
                options: {
                  fallbackPlacements,
                  padding: 8,
                },
              },
              {
                // keeps the menu inside the screen on both axes, near any edge
                name: "preventOverflow",
                options: {
                  altAxis: true,
                  padding: 8,
                },
              },
            ],
            onFirstUpdate: () => {
              this.visible = true;
              this.src = src;
            },
          });
        });
    },
    // the menu grew or shrank (a submenu opened inside it): keep it inside the screen
    updatePosition() {
      menuPopper?.update();
    },
    hideContextMenu() {
      this.visible = false;
      this.src = null;
      this.options = [];
      this.elem ? (this.elem.style.transform = "scale(0)") : null;
    },
  },
});
