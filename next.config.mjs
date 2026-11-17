/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  // Old routes. The public site (/report, /report/track) was removed: the
  // platform is login-first and reports are handled inside it.
  redirects() {
    return [
      { source: "/communities", destination: "/settlements", permanent: false },
      { source: "/geography", destination: "/data-sources", permanent: false },
      { source: "/assessments", destination: "/field/assessments", permanent: false },
      { source: "/recommendations", destination: "/planning", permanent: false },
      { source: "/planning/reports", destination: "/planning-reports", permanent: false },
      { source: "/report", destination: "/reports", permanent: false },
      { source: "/report/track", destination: "/reports", permanent: false },
      { source: "/login", destination: "/", permanent: false },
    ];
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
