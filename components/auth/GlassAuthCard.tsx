// GlassAuthCard — shared glassmorphism wrapper for auth pages.
// Handles background image, dark overlay, centered layout, and card entrance animation.

"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

const AUTH_BACKGROUND_IMAGE = "/auth-bg-2.jpg";

export function GlassAuthCard({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${AUTH_BACKGROUND_IMAGE})` }}
      />

      {/* Dark gradient overlay for text readability */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(160deg, rgba(20,10,40,0.35), rgba(5,5,15,0.55))",
        }}
      />

      {/* Glass card with entrance animation */}
      <motion.div
        className="auth-glass-card relative z-10 w-full max-w-[560px]"
        initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        style={{
          background: "rgba(255,255,255,0.10)",
          border: "1px solid rgba(255,255,255,0.25)",
          borderRadius: 20,
          WebkitBackdropFilter: "blur(22px) saturate(160%)",
          backdropFilter: "blur(22px) saturate(160%)",
          boxShadow:
            "0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.25)",
          padding: "28px 32px",
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
