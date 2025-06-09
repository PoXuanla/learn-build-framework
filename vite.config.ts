import customTemplatePlugin from "./vite-custom-template-plugin.js";

export default {
  plugins: [
    customTemplatePlugin({
      extensions: [".mytemplate", ".custom", ".xuan"],
      debug: true,
    }),
  ],
};
