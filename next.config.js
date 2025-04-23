const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack(config) {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@components': path.resolve(__dirname, 'components'),
      '@firebase': path.resolve(__dirname, 'firebase'),
      '@lib': path.resolve(__dirname, 'lib'),
    };
    return config;
  },
};

const path = require('path');
module.exports = nextConfig;
