import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FaBell } from 'react-icons/fa6';

interface MorphingNotifyButtonProps {
  buttonText?: string;
  placeholder?: string;
  onSubmit?: (email: string) => void;
}

export const MorphingNotifyButton: React.FC<MorphingNotifyButtonProps> = ({
  buttonText = 'Notify Me',
  placeholder = 'Enter your email',
  onSubmit,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const springConfig = {
    type: 'spring',
    stiffness: 240,
    damping: 18,
    mass: 1.1,
  } as const;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isExpanded && inputRef.current) inputRef.current.focus();
  }, [isExpanded]);

  const handleToggle = (e: React.MouseEvent) => {
    if (!isExpanded) {
      e.stopPropagation();
      setIsExpanded(true);
    } else if (email) {
      onSubmit?.(email);
      setSubmitted(true);
      setIsExpanded(false);
      setEmail('');
      setTimeout(() => setSubmitted(false), 3000);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="inline-flex items-center gap-2 rounded-full border border-sahaya-green/30 bg-sahaya-green/10 px-6 py-3 text-sm font-semibold text-sahaya-green"
      >
        ✓ You'll be notified about new schemes!
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={containerRef}
      layout
      transition={springConfig}
      style={{ borderRadius: 32 }}
      className={`relative flex items-center overflow-hidden border border-slate-200 transition-colors duration-300 ${
        isExpanded
          ? 'w-80 bg-stone-50 p-1 shadow-sm'
          : 'w-auto bg-stone-100 p-0'
      }`}
    >
      <AnimatePresence mode="popLayout">
        {isExpanded && (
          <motion.div
            key="input-container"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={springConfig}
            className="flex flex-1 items-center px-4"
          >
            <input
              ref={inputRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-transparent text-base font-semibold text-slate-800 placeholder-slate-400 outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && email) {
                  onSubmit?.(email);
                  setSubmitted(true);
                  setIsExpanded(false);
                  setEmail('');
                  setTimeout(() => setSubmitted(false), 3000);
                }
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        layout
        onClick={handleToggle}
        transition={springConfig}
        className={`relative flex items-center justify-center gap-2.5 rounded-full font-bold whitespace-nowrap transition-colors duration-300 ${
          isExpanded
            ? 'bg-sahaya-green px-5 py-3 text-white hover:bg-sahaya-green/90'
            : 'bg-stone-100 px-5 py-3 text-slate-800 hover:bg-stone-200'
        }`}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {!isExpanded && (
            <motion.span
              key="bell-icon"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={springConfig}
            >
              <FaBell className="h-4 w-4" />
            </motion.span>
          )}
        </AnimatePresence>
        <motion.span layout="position" className="text-sm tracking-tight">
          {isExpanded ? 'Notify me' : buttonText}
        </motion.span>
      </motion.button>
    </motion.div>
  );
};
