import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/spinner",
        destination: "https://decision-maker-five.vercel.app/spinner",
      },
      {
        source: "/spinner/:path+",
        destination:
          "https://decision-maker-five.vercel.app/spinner/:path+",
      },
    ];
  },
};

export default nextConfig;
