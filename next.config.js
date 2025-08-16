/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
      },
    ],
    unoptimized: true, // Required for static export
  },
  output: 'export', // Enable static export
  trailingSlash: true, // Add trailing slashes for S3 compatibility
  distDir: 'out', // Output directory for static files
  

  
  // Development-friendly settings for easier debugging
  swcMinify: false, // Disable SWC minification
  compiler: {
    removeConsole: false, // Keep console.log statements
  },
  webpack: (config, { dev, isServer }) => {
    // Disable minification for easier debugging
    if (!dev) {
      config.optimization.minimize = false
    }
    
    // Keep readable variable names
    config.optimization.mangleExports = false
    
    return config
  },
}

module.exports = nextConfig