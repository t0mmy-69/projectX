/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent bundling heavy server-only packages into serverless functions.
  // These run fine in Node.js runtime but shouldn't be inlined into bundles.
  serverExternalPackages: ['pg', 'redis', 'bcryptjs', 'jsonwebtoken', '@anthropic-ai/sdk'],
};

export default nextConfig;

