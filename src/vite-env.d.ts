/// <reference types="vite/client" />

// 为自定义模板文件添加类型声明
declare module "*.xuan" {
  const content: {
    raw: string;
    processed: string;
    source: string;
  };
  export default content;
  export const rawTemplate: string;
  export const processedTemplate: string;
}

// 支持其他自定义扩展名
declare module "*.mytemplate" {
  const content: {
    raw: string;
    processed: string;
    source: string;
  };
  export default content;
  export const rawTemplate: string;
  export const processedTemplate: string;
}

declare module "*.custom" {
  const content: {
    raw: string;
    processed: string;
    source: string;
  };
  export default content;
  export const rawTemplate: string;
  export const processedTemplate: string;
}
