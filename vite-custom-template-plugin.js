// vite-custom-template-plugin.js
import fs from "fs";
import path from "path";
/**
 * 提取 template 内容的函数
 */
function extractTemplate(content) {
  console.error("extractTemplate", content);
  // 使用正则表达式提取 <template></template> 之间的内容
  const templateRegex = /<template[^>]*>([\s\S]*?)<\/template>/i;
  const match = content.trim().match(templateRegex);

  if (match && match[1]) {
    return match[1].trim();
  }

  return null;
}

/**
 * 将 template 内容转换为 JavaScript 模块
 */
function transformToModule(templateContent, filePath) {
  // 转义特殊字符
  const escapedContent = templateContent
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r");

  // 生成 JavaScript 模块代码
  const moduleCode = `
// Generated from: ${filePath}
const template = '${escapedContent}';

// 导出原始 template 字符串
export const rawTemplate = template;

// 导出处理过的 template（可以添加更多处理逻辑）
export const processedTemplate = template;

// 默认导出
export default {
  raw: template,
  processed: template,
  source: '${filePath}'
};

// 如果需要，可以在这里添加更多处理逻辑
console.log('📋 Template 载入完成:', '${path.basename(filePath)}');
      `;

  return moduleCode;
}

/**
 * Vite 插件：处理自定义副档名档案并提取 template 内容
 */
function customTemplatePlugin(options = {}) {
  const {
    extensions = [".mytemplate", ".custom", ".xuan"], // 支援的自定义副档名
    debug = true, // 是否打印调试信息
  } = options;

  return {
    name: "custom-template-plugin",

    // 配置解析器，告诉 Vite 如何处理自定义档案
    configResolved(config) {
      if (debug) {
        console.log("🔧 Custom Template Plugin 已启动");
        console.log("📁 支援的副档名:", extensions);
      }
    },

    // 解析模块 ID
    resolveId(id, importer) {
      // 检查是否为我们要处理的自定义档案
      const ext = path.extname(id);
      if (extensions.includes(ext)) {
        // 如果是相对路径，解析为绝对路径
        if (id.startsWith("./") || id.startsWith("../")) {
          const resolvedPath = path.resolve(path.dirname(importer || ""), id);
          return resolvedPath;
        }
        return id;
      }
      return null;
    },

    // 载入档案内容
    load(id) {
      const ext = path.extname(id);

      // 只处理我们关心的副档名
      if (!extensions.includes(ext)) {
        return null;
      }

      try {
        // 读取档案内容
        const content = fs.readFileSync(id, "utf-8");

        if (debug) {
          console.log("\n=================================");
          console.log(`📄 读取档案: ${id}`);
          console.log("📝 档案内容:");
          console.log(content);
        }

        // 提取 template 内容
        const templateContent = extractTemplate(content);

        if (templateContent) {
          if (debug) {
            console.log("🎯 提取的 Template 内容:");
            console.log(templateContent);
            console.log("=================================\n");
          }

          // 转换为可用的 JavaScript 模块
          return transformToModule(templateContent, id);
        } else {
          if (debug) {
            console.log("⚠️  未找到 <template> 标签");
            console.log("=================================\n");
          }
          return 'export default "";';
        }
      } catch (error) {
        console.error(`❌ 读取档案失败 ${id}:`, error.message, content);
        return 'export default "";';
      }
    },

    // 处理热更新
    handleHotUpdate(ctx) {
      const ext = path.extname(ctx.file);

      if (extensions.includes(ext)) {
        console.log(`🔥 热更新: ${ctx.file}`);

        // 重新读取并处理档案
        try {
          const content = fs.readFileSync(ctx.file, "utf-8");
          console.log("content", content);
          const templateContent = extractTemplate(content);

          if (templateContent) {
            console.log("🎯 更新的 Template 内容:");
            console.log(templateContent);

            // 向客户端发送自定义HMR事件
            ctx.server.ws.send({
              type: "custom",
              event: "template-update",
              data: {
                file: ctx.file,
                templateContent: templateContent,
              },
            });
            // 重要：通知Vite更新对应的模块
            const module = ctx.server.moduleGraph.getModuleById(ctx.file);
            if (module) {
              ctx.server.reloadModule(module);
            }
          }
        } catch (error) {
          console.error("❌ 热更新处理失败:", error.message);
        }

        // 返回空数组而不是 ctx.modules，避免默认的HMR行为
        return [];
      }
    },
  };
}

// 导出插件
export default customTemplatePlugin;
