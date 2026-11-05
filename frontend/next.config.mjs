// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   /* config options here */
//   cacheComponents: true,
//   partialPrefetching: true,
//   reactCompiler: true,
// };

// export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Define la carpeta de build según la variable de entorno
  distDir: process.env.NEXT_DIST_DIR || '.next',
};

export default nextConfig;