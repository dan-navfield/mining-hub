/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@mining-hub/ui', '@mining-hub/types'],
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // Image optimization for production
  images: {
    domains: ['localhost', 'supabase.co', 'your-project.supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Webpack configuration for production
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    
    // Exclude NestJS API code from build
    config.externals = config.externals || [];
    config.externals.push({
      'apps/api': 'commonjs apps/api'
    });
    
    return config;
  },
  // Experimental features for better performance
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
};

module.exports = nextConfig;
