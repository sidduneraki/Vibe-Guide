"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles, Zap } from "lucide-react"

export default function SurpriseButton({
  onClick,
  loading,
}: {
  onClick: () => void
  loading: boolean
}) {
  const [particleEffect, setParticleEffect] = useState(false)

  const handleClick = () => {
    setParticleEffect(true)
    setTimeout(() => setParticleEffect(false), 600)
    onClick()
  }

  return (
    <div className="flex justify-center relative">
      {/* Animated background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>

      {/* Particle effect */}
      {particleEffect && (
        <>
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 animate-pulse"
              style={
                {
                  left: "50%",
                  top: "50%",
                  animation: `explode 0.6s ease-out forwards`,
                  animationDelay: `${i * 0.075}s`,
                  "--angle": `${(i / 8) * 360}deg`,
                } as any
              }
            ></div>
          ))}
        </>
      )}

      <Button
        onClick={handleClick}
        disabled={loading}
        size="lg"
        className="relative bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 hover:from-purple-500 hover:via-pink-600 hover:to-red-600 text-white px-12 py-8 text-lg font-bold gap-3 transform transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 shadow-2xl shadow-purple-500/50 hover:shadow-3xl hover:shadow-pink-500/50 z-10"
      >
        <div className={`flex items-center gap-2 ${loading ? "opacity-70" : ""}`}>
          <Sparkles className={`w-6 h-6 ${loading ? "animate-spin" : "animate-bounce"}`} />
          {loading ? (
            <>
              <span>Surprising You...</span>
              <Zap className="w-5 h-5 animate-pulse" />
            </>
          ) : (
            "Surprise Me 🎁"
          )}
        </div>
      </Button>

      <style>{`
        @keyframes explode {
          from {
            opacity: 1;
            transform: translate(0, 0) scale(1);
          }
          to {
            opacity: 0;
            transform: translate(
              calc(80px * cos(var(--angle))),
              calc(80px * sin(var(--angle)))
            ) scale(0);
          }
        }
      `}</style>
    </div>
  )
}
