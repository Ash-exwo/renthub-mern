// components/AnimatedBackground.jsx
import { motion } from "motion/react";
import { Home, Key, Building2, MapPin, Bed, DollarSign, Search } from "lucide-react";

const backgroundIcons = [
  { Icon: Home, size: 34, top: "10%", left: "7%", delay: 0, duration: 6 },
  { Icon: Key, size: 26, top: "18%", right: "8%", delay: 1, duration: 7 },
  { Icon: Building2, size: 38, top: "75%", left: "8%", delay: 2, duration: 8 },
  { Icon: MapPin, size: 30, top: "82%", right: "10%", delay: 0.5, duration: 6.5 },
  { Icon: Bed, size: 28, top: "48%", left: "4%", delay: 1.5, duration: 7.5 },
  { Icon: DollarSign, size: 26, top: "50%", right: "5%", delay: 2.5, duration: 6 },
  { Icon: Search, size: 24, top: "12%", left: "45%", delay: 3, duration: 8 },
];

export function AnimatedBackground({ children }) {
  return (
    <div
      style={{
        position: "relative",
        flex: 1,
        width: "100%",
        minHeight: "calc(100vh - 120px)", // Adjusts dynamically between Navbar and Footer
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        backgroundColor: "var(--color-bg, #f9fafb)",
        boxSizing: "border-box",
      }}
    >
      {/* Background Floating Icons */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        {backgroundIcons.map(
          ({ Icon, size, top, left, right, delay, duration }, index) => (
            <motion.div
              key={index}
              style={{
                position: "absolute",
                top,
                left,
                right,
                color: "var(--color-terracotta, #e05638)",
                opacity: 0.12,
              }}
              animate={{
                y: [0, -16, 0],
                rotate: [0, 8, -8, 0],
              }}
              transition={{
                duration,
                repeat: Infinity,
                ease: "easeInOut",
                delay,
              }}
            >
              <Icon size={size} />
            </motion.div>
          )
        )}
      </div>

      {/* Form Container */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "1rem",
          boxSizing: "border-box",
        }}
      >
        {children}
      </div>
    </div>
  );
}