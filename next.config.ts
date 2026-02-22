import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    // ngrok header alleen in development
    if (process.env.NODE_ENV !== "production") {
      return [
        {
          source: "/:path*",
          headers: [
            {
              key: "ngrok-skip-browser-warning",
              value: "true",
            },
          ],
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
