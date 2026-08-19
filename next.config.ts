import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "1";
const repo = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "openinvest";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  ...(isGitHubPages ? { basePath: `/${repo}` } : {}),
};

export default nextConfig;
