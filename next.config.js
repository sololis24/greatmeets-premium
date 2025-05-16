const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: '911296639750-v97gdc4cetc5uk05shartulo4ilfqs9r.apps.googleusercontent.com',
    NEXT_PUBLIC_GOOGLE_REDIRECT_URI: 'https://96bb-84-86-92-1.ngrok-free.app/api/google/callback',
  },
  webpack(config) {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@components': path.resolve(__dirname, 'components'),
      '@lib': path.resolve(__dirname, 'lib'),
    };
    return config;
  },
};

module.exports = nextConfig;
