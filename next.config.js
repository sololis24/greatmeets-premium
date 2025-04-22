// next.config.js
module.exports = {
    reactStrictMode: true, // Keeps React in strict mode for better debugging and performance
    images: {
      domains: ['your-image-host.com'], // Replace with actual domains if you're using external images
    },
  };
  
  const nextConfig = {
    eslint: {
      ignoreDuringBuilds: true,
    },
  };
  
  module.exports = nextConfig;