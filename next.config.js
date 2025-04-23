/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['your-image-host.com'], // 🔄 Replace with your actual image host if needed
  },
  eslint: {
    ignoreDuringBuilds: true, // ✅ Skip linting during Netlify or CI builds
  },
};

module.exports = nextConfig;
