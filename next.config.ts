import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'covers.openlibrary.org',
        pathname: '/b/id/**',
      },
      {
        protocol: 'https',
        hostname: 'books.google.com',
      },
      // Returned by bookcover.longitood.com (Goodreads, Amazon, CloudFront CDNs)
      {
        protocol: 'https',
        hostname: '**.gr-assets.com',
      },
      {
        protocol: 'https',
        hostname: '**.goodreads.com',
      },
      {
        protocol: 'https',
        hostname: '**.ssl-images-amazon.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudfront.net',
      },
    ],
  },
};

export default nextConfig;
