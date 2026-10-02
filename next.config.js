/** @type {import('next').NextConfig} */

// Extra hardening for the private areas (client portal, admin, API).
const privateHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "same-origin" },
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

// Images uploaded through the admin media library are served from the
// public `site-media` bucket of the Supabase project.
let supabaseHost = "*.supabase.co";
try {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname;
} catch {
  // Keep the wildcard when the URL is missing or malformed.
}

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/site-media/**" },
    ],
  },
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
