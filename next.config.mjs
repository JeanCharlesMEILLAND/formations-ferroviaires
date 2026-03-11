/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  webpack: (config) => {
    // Disable persistent cache (OneDrive compatibility)
    config.cache = false;
    return config;
  },
};

export default nextConfig;
