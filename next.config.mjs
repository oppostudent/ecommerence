/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        unoptimized: true
    },
    // Force webpack instead of Turbopack
    experimental: {
        turbo: false
    }
};

export default nextConfig;
