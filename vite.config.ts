// GitHub Pages 対応: CI上は `/<repo>/` をbaseに使用
import { defineConfig } from "vite";

const isCI = process.env.GITHUB_ACTIONS === "true";
const repo = (process.env.GITHUB_REPOSITORY || "").split("/")[1] || "";

export default defineConfig({
  base: isCI && repo ? `/${repo}/` : "/",
  server: {
    port: 5175,
    open: false,
    strictPort: true,
  },
});
