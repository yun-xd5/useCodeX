// Vite 設定ファイル
// - GitHub Pages での配信パス（base）を CI 実行時に自動設定
//   - ユーザー/組織サイト:   <user>.github.io -> base: '/'
//   - プロジェクトサイト:     <user>/<repo>   -> base: '/<repo>/'
import { defineConfig } from "vite";

// GitHub Actions 上で動作しているか
const isCI = process.env.GITHUB_ACTIONS === "true";
// "owner/repo" 形式の環境変数からリポジトリ名を抽出
const repo = (process.env.GITHUB_REPOSITORY || "").split("/")[1] || "";
// <user>.github.io という命名のユーザー/組織サイトかどうか
const isUserSite = repo.endsWith(".github.io");

export default defineConfig({
  // GitHub Pages でのベースパス設定
  // - CI 上かつリポジトリ名が判明している場合のみ切替
  // - ユーザー/組織サイトはルート('/')、それ以外は '/<repo>/'
  base: isCI && repo ? (isUserSite ? "/" : `/${repo}/`) : "/",
  server: {
    // ローカル開発サーバー設定（ポート固定・自動オープン無効）
    port: 5175,
    open: false,
    strictPort: true,
  },
});
