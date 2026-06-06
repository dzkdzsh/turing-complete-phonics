import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.NEXT_OUTPUT_MODE === "export" ? {
    output: "export" as const,
    distDir: "dist",
  } : {}),
};

export default nextConfig;
