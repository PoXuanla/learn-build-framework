import { h } from "snabbdom/build/h";
import { init } from "snabbdom/build/init";

import type { VNode } from "snabbdom/build/vnode";
import { eventListenersModule } from "snabbdom/build/modules/eventlisteners";
import "./hmr-handler.ts";

// 導入 meow.xuan 文件的內容
import meowTemplate from "./meow.xuan";

function createRenderElement(container: Element) {
  const patch = init([eventListenersModule]);

  let currentVNode: VNode | Element = container;

  return function renderVNode(newVNode: VNode) {
    currentVNode = patch(currentVNode, newVNode);
    return currentVNode;
  };
}

const app = document.querySelector("#app");
const renderVNode = createRenderElement(app!);

export const render = (value: string) => {
  const vnode1 = h("div#container.aa.vv", value);

  renderVNode(vnode1);
};

// 使用 meow.xuan 的內容渲染到 #app
console.log("📋 Meow Template 內容:", meowTemplate);
render(meowTemplate.raw || meowTemplate.processed || "");
