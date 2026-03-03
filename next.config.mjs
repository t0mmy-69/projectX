/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  // Prevent bundling heavy server-only packages into serverless functions.
  // These run fine in Node.js runtime but shouldn't be inlined into bundles.
  serverExternalPackages: ['pg', 'redis', 'bcryptjs', 'jsonwebtoken', '@anthropic-ai/sdk'],

  // Vercel's build doesn't reliably pick up tsconfig "paths" for webpack aliases.
  // Explicitly mirror every tsconfig path here so builds work on all environments.
  webpack: (config) => {
    config.resolve.alias['@'] = path.join(__dirname, 'src');
    config.resolve.alias['framer-motion'] = path.join(__dirname, 'src', 'shims', 'framer-motion');
    return config;
  },
};

export default nextConfig;
