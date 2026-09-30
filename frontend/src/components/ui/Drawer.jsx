import React, { useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  position = "right", // right, left, bottom
  width = "24rem",
  showClose = true,
  className = "",
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const slideVariants = {
    right: {
      initial: { x: "100%" },
      animate: { x: 0 },
      exit: { x: "100%" },
    },
    left: {
      initial: { x: "-100%" },
      animate: { x: 0 },
      exit: { x: "-100%" },
    },
    bottom: {
      initial: { y: "100%" },
      animate: { y: 0 },
      exit: { y: "100%" },
    },
  };

  const panelPositionClasses = {
    right: "top-0 right-0 bottom-0 border-l border-[var(--color-border)]",
    left: "top-0 left-0 bottom-0 border-r border-[var(--color-border)]",
    bottom: "left-0 right-0 bottom-0 max-h-[80vh] border-t border-[var(--color-border)] rounded-t-3xl",
  }[position] || "top-0 right-0 bottom-0 border-l border-[var(--color-border)]";

  const selected = slideVariants[position] || slideVariants.right;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex" onClick={onClose}>
          <motion.div
            className={`fixed bg-[var(--color-surface)] shadow-2xl flex flex-col z-50 max-w-full ${panelPositionClasses} ${className}`.trim()}
            style={{ width: position === "bottom" ? "100%" : width }}
            onClick={(e) => e.stopPropagation()}
            initial={selected.initial}
            animate={selected.animate}
            exit={selected.exit}
            transition={{ duration: 0.25, ease: "easeOut" }}
            role="dialog"
            aria-modal="true"
          >
            {(title || showClose) && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-subtle)] shrink-0">
                {title && <h3 className="font-[var(--font-heading)] text-lg font-bold text-[var(--color-espresso)]">{title}</h3>}
                {showClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-[var(--color-muted-grey)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-espresso)] transition-colors cursor-pointer"
                    aria-label="Close panel"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            )}

            <div className="p-6 flex-1 overflow-y-auto">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default Drawer;
