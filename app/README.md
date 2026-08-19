# 修仙手札 Demo

手机网页优先的可玩 Demo，使用 React、TypeScript、Vite 与 Capacitor 构建。

## 在线试玩

[打开 GitHub Pages 在线版](https://ignory1021.github.io/xxsz-codex/)

推送到 `main` 分支后，GitHub Actions 会自动构建并更新在线版。

## 本地运行

```bash
npm install
npm run dev
```

开发服务器会监听局域网地址，可用同一网络下的手机直接访问终端显示的地址。

## 验证

```bash
npm run typecheck
npm test
npm run build
```

GitHub Pages 子路径构建可执行：

```bash
npm run build -- --base=/xxsz-codex/
```

## Android

安装兼容的 JDK 与 Android Studio 后执行：

```bash
npm run cap:add:android
npm run cap:sync
npm run cap:open:android
```

网页构建产物位于 `dist/`，Capacitor 会将其同步到 Android 原生工程。

## 目录

- `src/core/`：与 UI 无关的时间、境界、行为与转生规则。
- `src/data/`：境界、难度、地图等配置数据。
- `src/store/`：游戏状态与行为编排。
- `src/persistence/`：浏览器和 Android 共用的存档接口。
- `src/components/`：移动端页面与交互组件。
- `src/styles/`：水墨主题与响应式样式。
