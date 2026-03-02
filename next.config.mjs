/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  // Prevent bundling heavy server-only packages into serverless functions.
  // These run fine in Node.js runtime but shouldn't be inlined into bundles.
  serverExternalPackages: ['pg', 'redis', 'bcryptjs', 'jsonwebtoken', '@anthropic-ai/sdk'],

  // Explicitly set the @ alias to avoid Vercel webpack resolution edge cases
  // with serverExternalPackages and @-scoped package names.
  webpack: (config) => {
    config.resolve.alias['@'] = path.join(__dirname, 'src');
    return config;
  },
};

export default nextConfig;
