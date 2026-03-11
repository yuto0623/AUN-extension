# AUN Task Counter

AUN MyPage 上のタスク状況をリアルタイムで表示するブラウザ拡張機能です。
フローティングウィジェットとして、タスクの対応状況・進捗率をページ上にオーバーレイ表示します。

## 機能

- **タスクステータス集計** — 未対応(OPEN)・作業済み(WIP)・確認済み(DONE)の件数を自動取得・表示
- **進捗バー** — 全タスクに対する完了率をビジュアル表示
- **コピー機能** — 完了率をワンクリックでクリップボードにコピー
- **ドラッグ移動** — ウィジェットをページ内の任意の位置に配置可能
- **折りたたみ** — コンパクト表示への切り替え
- **SPA 対応** — Inertia.js によるページ遷移を自動検知して更新

## 対応環境

- Google Chrome
- Firefox 109.0 以上
- 対象サイト: `https://aun-mypage.tools/*`

## セットアップ

```bash
# 依存パッケージのインストール
npm install
```

## ビルド

```bash
# Chrome 用 .zip と Firefox 用 .xpi を出力
npm run build
```

生成物は `web-ext-artifacts/` に出力されます。

- `aun-task-counter-chrome.zip`
- `aun-task-counter-firefox.xpi`

## インストール

### Chrome

1. `npm run build` を実行
2. Chrome で `chrome://extensions` を開く
3. 「デベロッパー モード」を有効化
4. `dist/chrome/` を「パッケージ化されていない拡張機能を読み込む」から選択

`.zip` 配布物が必要な場合は `web-ext-artifacts/aun-task-counter-chrome.zip` を利用できます。

### Firefox

1. `npm run build` を実行
2. Firefox で `about:debugging#/runtime/this-firefox` を開く
3. 「一時的なアドオンを読み込む」から `dist/firefox/manifest.json` を選択

配布用アーカイブは `web-ext-artifacts/aun-task-counter-firefox.xpi` に出力されます。

## プロジェクト構成

```
AUN-extension/
├── manifest.json      # 共通の拡張機能設定（Manifest v3）
├── content.js         # メインスクリプト（タスクデータ取得・オーバーレイ描画）
├── overlay.css        # ウィジェットのスタイル定義
├── dist/              # ブラウザ別のビルド出力
├── icons/
│   └── icon-48.svg    # 拡張機能アイコン
├── scripts/
│   └── build.js       # Chrome/Firefox 向け成果物の生成
└── package.json       # プロジェクト設定
```

## 使い方

1. AUN MyPage（`https://aun-mypage.tools/*`）にアクセス
2. 画面右下にオーバーレイウィジェットが自動表示
3. **▲/▼** で折りたたみ・展開を切り替え
4. **📋** ボタンで完了率をコピー
5. ヘッダー部分をドラッグしてウィジェットを移動

## 技術スタック

- WebExtension (Manifest v3)
- Vanilla JavaScript (ES6+)
- Node.js スクリプトによるブラウザ別ビルド
