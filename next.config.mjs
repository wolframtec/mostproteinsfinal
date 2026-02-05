/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  distDir: 'dist',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  
  // SEO: Ensure proper trailing slashes for canonical URLs
  skipTrailingSlashRedirect: false,
  
  // Exclude browser-only packages from server bundle
  serverExternalPackages: ['three', '@react-three/fiber', '@react-three/drei', 'lenis', 'gsap'],
};

export default nextConfig;
