import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite ships a WASM build of PostgreSQL and must stay outside the bundler.
  // nodemailer opens raw TCP sockets and should not be bundled either.
  serverExternalPackages: ["@electric-sql/pglite", "nodemailer"],
};

export default nextConfig;
