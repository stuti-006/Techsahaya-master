import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUp } from "lucide-react";
import { useAppContext } from "../context/AppContext";

export function ScrollToTopButton() {
  const { language } = useAppContext();
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 250) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility, { passive: true });
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const label =
    language === "hi"
      ? "शीर्ष पर जाएँ"
      : language === "kn"
      ? "ಮೇಲಕ್ಕೆ ಹೋಗಿ"
      : "Go to top";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 30, x: "-50%" }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
            x: "-50%",
          }}
          exit={{ opacity: 0, scale: 0.8, y: 20, x: "-50%" }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="fixed bottom-7 left-1/2 z-40"
        >
          <motion.button
            onClick={scrollToTop}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileHover={{ scale: 1.05, y: -3 }}
            whileTap={{ scale: 0.94 }}
            aria-label={label}
            className="group relative flex items-center gap-2.5 rounded-full border-2 border-white/20 bg-[#1A3D2E] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-2xl shadow-[#1A3D2E]/35 backdrop-blur-md transition-all hover:bg-[#133826] hover:shadow-[#1A3D2E]/50 focus:outline-none select-none"
          >
            {/* Animated pulsing glow backdrop */}
            <span className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-[#1A3D2E]/30 blur-md transition-opacity group-hover:opacity-100 opacity-60" />

            {/* Animated bouncing arrow icon */}
            <motion.span
              animate={isHovered ? { y: [-2, -6, -2] } : { y: 0 }}
              transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-white"
            >
              <ArrowUp size={14} strokeWidth={3} />
            </motion.span>

            {/* Label text */}
            <span className="font-serif tracking-wide">{label}</span>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
