import React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

// Subtle 3D tilt wrapper — used on the dashboard hero cards.
//
// The card rotates a few degrees in response to pointer motion, like a piece
// of stiff card stock catching the light. Spring-back on release.
//
// Implementation notes:
//   • Uses pointermove/leave on the wrapper itself so the card only tilts when
//     the cursor is over the card. No global listeners, no touchmove
//     hijacking — vertical scrolling still works on touch.
//   • Springs are tuned soft (~stiffness 220, damping 28) so quick movements
//     don't make the card "snap" — it follows the finger smoothly.
//   • `max` caps the rotation in degrees. Default 6° — enough to feel premium
//     without making the typography hard to read.
export default function Tilt3D({
  children,
  max = 6,
  className,
  style,
  glare = true
}) {
  const rotateXRaw = useMotionValue(0);
  const rotateYRaw = useMotionValue(0);
  const rotateX = useSpring(rotateXRaw, { stiffness: 220, damping: 28, mass: 0.45 });
  const rotateY = useSpring(rotateYRaw, { stiffness: 220, damping: 28, mass: 0.45 });

  // Glare highlight that follows the pointer — subtle but adds the "real
  // material" feel that pure rotation alone doesn't give.
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);
  const glareBg = useTransform(
    [glareX, glareY],
    ([gx, gy]) => `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.10), transparent 55%)`
  );

  function handlePointerMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;   // 0..1
    const py = (event.clientY - rect.top)  / rect.height;  // 0..1
    rotateYRaw.set((px - 0.5) * 2 * max);                  // left/right → Y
    rotateXRaw.set((0.5 - py) * 2 * max);                  // up/down → X (inverted)
    glareX.set(px * 100);
    glareY.set(py * 100);
  }

  function reset() {
    rotateXRaw.set(0);
    rotateYRaw.set(0);
    glareX.set(50);
    glareY.set(50);
  }

  return (
    <motion.div
      className={className}
      onPointerMove={handlePointerMove}
      onPointerLeave={reset}
      onPointerCancel={reset}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        transformPerspective: 1100,
        position: "relative",
        ...style
      }}
    >
      {children}
      {glare && (
        <motion.div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            pointerEvents: "none",
            background: glareBg,
            mixBlendMode: "soft-light",
            zIndex: 2
          }}
        />
      )}
    </motion.div>
  );
}
