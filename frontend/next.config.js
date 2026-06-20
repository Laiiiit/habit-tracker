/** @type {import('next').NextConfig} */
const nextConfig = {
  // Проксируем API-запросы к Express бэкенду в dev режиме
  async rewrites() {
    return [
      {
        source: '/api/habits/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/habits/:path*`,
      },
      {
        source: '/api/shared/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/shared/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
