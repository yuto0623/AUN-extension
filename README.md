# AUN Task Counter

AUN MyPage 上のタスク状況をリアルタイムで表示する Firefox ブラウザ拡張機能です。
フローティングウィジェットとして、タスクの対応状況・進捗率をページ上にオーバーレイ表示します。

## 機能

- **タスクステータス集計** — 未対応(OPEN)・作業済み(WIP)・確認済み(DONE)の件数を自動取得・表示
- **進捗バー** — 全タスクに対する完了率をビジュアル表示
- **コピー機能** — 完了率をワンクリックでクリップボードにコピー
- **ドラッグ移動** — ウィジェットをページ内の任意の位置に配置可能
- **折りたたみ** — コンパクト表示への切り替え
- **SPA 対応** — Inertia.js によるページ遷移を自動検知して更新

## 対応環境

- Firefox 109.0 以上
- 対象サイト: `https://aun-mypage.tools/*`

## セットアップ

```bash
# 依存パッケージのインストール
npm install
```

## ビルド

```bash
# .xpi ファイルを生成（web-ext-artifacts/ に出力）
npx web-ext build
```

## インストール

1. `npx web-ext build` でビルド
2. Firefox で `about:addons` を開く
3. 歯車アイコン → 「ファイルからアドオンをインストール」から生成された `.xpi` ファイルを選択

- それかドラッグ＆ドロップでもインストール可能です。

## プロジェクト構成

```
AUN-extension/
├── manifest.json      # 拡張機能の設定（Manifest v2）
├── content.js         # メインスクリプト（タスクデータ取得・オーバーレイ描画）
├── overlay.css        # ウィジェットのスタイル定義
├── icons/
│   └── icon-48.svg    # 拡張機能アイコン
└── package.json       # プロジェクト設定
```

## 使い方

1. AUN MyPage（`https://aun-mypage.tools/*`）にアクセス
2. 画面右下にオーバーレイウィジェットが自動表示
3. **▲/▼** で折りたたみ・展開を切り替え
4. **📋** ボタンで完了率をコピー
5. ヘッダー部分をドラッグしてウィジェットを移動

## 技術スタック

- WebExtension (Manifest v2)
- Vanilla JavaScript (ES6+)
- web-ext（ビルドツール）
