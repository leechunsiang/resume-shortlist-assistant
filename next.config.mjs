/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['openai'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude openai from client bundle
      config.resolve.alias = {
        ...config.resolve.alias,
        'openai': false,
      };
    }
    return config;
  },
};

export default nextConfig;
