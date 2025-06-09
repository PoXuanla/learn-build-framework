// HMR处理器 - 监听自定义template更新事件
import { render } from "./demo01";

if (import.meta.hot) {
  // 监听自定义HMR事件
  import.meta.hot.on("template-update", (data) => {
    console.log("📨 收到模板更新事件:", data);

    if (data && data.templateContent) {
      console.log("🔄 更新DOM内容...");
      console.log("模板内容:", data.templateContent);

      // 在浏览器环境中安全地调用render函数
      try {
        render(data.templateContent);
        console.log("✅ 渲染完成");
      } catch (error) {
        console.error("❌ 渲染失败:", error);
      }
    } else {
      console.warn("⚠️ 未找到模板内容");
    }
  });

  // 监听Vite的内置hot update事件（作为备用）
  import.meta.hot.on("vite:beforeUpdate", () => {
    console.log("🔄 Vite即将更新模块");
  });

  console.log("🎯 HMR模板更新监听器已启动");
}
