// GitHub Pages 対応: CI上は `/<repo>/` をbaseに使用
import { defineConfig } from "vite";

const isCI = process.env.GITHUB_ACTIONS === "true";
const repo = (process.env.GITHUB_REPOSITORY || "").split("/")[1] || "";
const isUserSite = repo.endsWith(".github.io");

export default defineConfig({
  // GitHub Pages: ユーザー/組織サイト(<user>.github.io)はルート配信、それ以外は /<repo>/
  base: isCI && repo ? (isUserSite ? "/" : `/${repo}/`) : "/",
  server: {
    port: 5175,
    open: false,
    strictPort: true,
  },
});
