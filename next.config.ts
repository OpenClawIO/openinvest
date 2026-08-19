import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "1";
const repo = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "openinvest";
const basePath = isGitHubPages ? `/${repo}` : "";

process.env.NEXT_PUBLIC_BASE_PATH = basePath;

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  ...(basePath ? { basePath } : {}),
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
