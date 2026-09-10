/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig = {
  // Polices embarquées dans le PDF « liste à emporter » : à inclure dans le paquet de la fonction serverless.
  experimental: { outputFileTracingIncludes: { "/api/selection/pdf": ["./src/assets/fonts/*.woff"] } },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      // Données générées au build (réseau ferré) : un jour de cache, servies compressées par Vercel
      { source: "/data/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" }] },
    ];
  },
};

export default nextConfig;
