import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Evita que `next dev` regenere AGENTS.md / CLAUDE.md en la raíz del repo.
  agentRules: false,
};

export default nextConfig;
