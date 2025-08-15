# Canvas App Base (TypeScript + Vite)

ブラウザの HTML5 Canvas 上で動作する最小構成のベース環境です。TypeScript 化し、DPR(デバイスピクセル比)対応のリサイズ、描画ループ、入力処理(ポインタ/キーボード)を備えています。開発には Vite を使用します。

## セットアップ / 起動

1) 依存インストール

```
npm install
```

2) 開発サーバ起動（ホットリロード）

```
npm run dev
# ブラウザで表示された URL を開く（例: http://localhost:5173）
```

3) ビルド（静的配信用）

```
npm run build
# dist フォルダが生成されます
```

dist を任意の静的サーバで配信できます（例: `python3 -m http.server`）。

## プロジェクト構成

- `index.html`: エントリ HTML。`<canvas id="app">` と `/src/main.ts` を読み込みます。
- `styles.css`: フルスクリーン Canvas のための最小スタイル。
- `src/main.ts`: アプリ本体。リサイズ、ループ、入力、デモ描画のセットアップ。
- `src/lib/canvas.ts`: DPR 対応のリサイズ、クリアなどのユーティリティ。
- `src/lib/loop.ts`: requestAnimationFrame ベースのゲームループ。
- `src/lib/input.ts`: ポインタとキーボード入力のヘルパ。

## 実装メモ

- 描画座標は CSS ピクセル基準です。`fitCanvasToWindow` が `ctx.setTransform(dpr,0,0,dpr,0,0)` を設定するため、DPR を意識せずウィンドウ座標で描けます。
- タブが非表示になると自動でループを停止し、復帰時に再開します。
- サンプル描画は回転する四角形と FPS オーバーレイ、ポインタインジケータです。

## 次の一歩

- シーン/状態管理を足して画面遷移を実装
- 画像・フォントのアセット読み込みユーティリティを追加
- 2D カメラ(平行移動/拡縮)ユーティリティを追加
- テストや ESLint/Prettier の導入

## VS Code で F5 実行（デバッグ）

- F5 はブラウザ（Chrome デバッガ）だけを起動します。
- 開発サーバは別途コマンドで起動してください: `npm run dev`
- 手順例:
  1) ターミナルで `npm run dev` を実行
  2) VS Code で F5（`http://localhost:5175` に接続）
- ポート変更時は `vite.config.ts` の `server.port` と `.vscode/launch.json` の `url` を同じ値に合わせてください。
