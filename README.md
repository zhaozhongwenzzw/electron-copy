# 剪贴板历史记录工具

一个基于 Electron + Vue3 + TypeScript 开发的剪贴板历史记录工具。

## 功能特点

### 基础功能
- 自动记录剪贴板历史
- 快捷键呼出搜索窗口
- 支持搜索历史记录
- 一键复制历史内容
- 系统托盘快速访问

### 个性化设置
- 自定义快捷键
- 调整最大记录数
- 开机自启动选项
- 主题切换（亮色/暗色/跟随系统）

### 数据管理
- 一键清空历史记录
- 恢复默认设置
- 自动保存配置

## 快速开始

### 安装依赖
```bash
npm install
```

### 开发调试
```bash
npm run dev
```

### 打包应用
```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

## 使用说明

1. 默认快捷键：`Ctrl+Shift+I`（可在设置中修改）
2. 系统托盘：
   - 左键点击：显示/隐藏主窗口
   - 右键菜单：快速操作选项
3. 搜索窗口：
   - 支持模糊搜索
   - 上下键选择
   - Enter 键复制
   - ESC 键关闭

## 开发环境

- Node.js >= 16
- npm >= 8
- Electron 31.0.2
- Vue 3.4
- TypeScript 5.5

## 推荐开发工具

- VSCode
- ESLint
- Prettier
- Volar
- TypeScript Vue Plugin

## 项目结构

```
src/
├── main/           # Electron 主进程
├── preload/        # 预加载脚本
└── renderer/       # Vue 渲染进程
    ├── src/
    │   ├── assets/    # 静态资源
    │   ├── components/# Vue 组件
    │   ├── view/      # 页面视图
    │   └── hooks/     # 功能钩子
    └── index.html
```

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 发起 Pull Request

## 许可证

[MIT License](LICENSE)
