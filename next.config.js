/** @type {import('next').NextConfig} */

// Extra hardening for the private areas (client portal, admin, API).
const privateHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "same-origin" },
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

const nextConfig = {
  experimental: {
    // The PDF generator reads the logo from disk at runtime; make sure it
    // ships with the serverless bundle when deployed.
    outputFileTracingIncludes: {
      "/api/**/*": ["./src/assets/images/logo.jpeg"],
      "/forms/**/*": ["./src/assets/images/logo.jpeg"],
    },
  },
  async headers() {
    return ["/forms/:path*", "/admin/:path*", "/api/:path*"].map((source) => ({
      source,
      headers: privateHeaders,
    }));
  },
};

module.exports = nextConfig;
