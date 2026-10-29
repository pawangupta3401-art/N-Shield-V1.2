import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["react-map-gl", "@vis.gl/react-google-maps"],
  env: {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY:
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
      "AIzaSyBHiUmVRMd_mJioAiHvijqx93Fm9d83P4g",
  },
};

export default nextConfig;
