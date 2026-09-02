import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import { CheckCircle } from 'lucide-react';

type ButtonStatus = 'idle' | 'loading' | 'success' | 'saved';

interface SaveToggleProps {
  idleText?: string;
  savedText?: string;
  loadingDuration?: number;
  successDuration?: number;
  onSave?: () => Promise<void> | void;
  className?: string;
}

export const SaveToggle: React.FC<SaveToggleProps> = ({
  idleText = 'Save',
  savedText = 'Saved',
  loadingDuration = 900,
  successDuration = 700,
  onSave,
  className = '',
}) => {
  const [status, setStatus] = useState<ButtonStatus>('idle');

  useEffect(() => {
    return () => {
      // cleanup
    };
  }, []);

  const handleClick = async () => {
    if (status === 'idle') {
      setStatus('loading');
      try {
        await onSave?.();
      } catch {
        // still show success UI
      }
      setTimeout(() => {
        setStatus('success');
        setTimeout(() => setStatus('saved'), successDuration);
      }, loadingDuration);
    } else if (status === 'saved') {
      setStatus('idle');
    }
  };

  const isCircle = status === 'loading' || status === 'success';

  return (
    <MotionConfig transition={{ type: 'spring', stiffness: 400, damping: 30 }}>
      <motion.button
        onClick={handleClick}
        initial={false}
        animate={{
          width: isCircle ? 52 : status === 'saved' ? 130 : 110,
          height: 48,
          backgroundColor:
            isCircle
              ? '#1a3d2e'
              : status === 'saved'
              ? '#ffffff'
              : '#e8e7e0',
        }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 18,
          backgroundColor: { duration: 0.2 },
        }}
        style={{
          borderWidth: status === 'saved' ? '2px' : '0',
          borderColor: status === 'saved' ? '#1a3d2e40' : 'transparent',
          borderStyle: 'solid',
        }}
        className={`relative flex cursor-pointer items-center justify-center overflow-hidden rounded-full select-none focus:outline-none active:scale-[0.97] ${className}`}
      >
        <AnimatePresence mode="popLayout">
          {status === 'idle' && (
            <motion.span
              key="idle"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12, x: -16 }}
              className="absolute inset-0 flex items-center justify-center text-base font-bold tracking-tight text-slate-800"
            >
              {idleText}
            </motion.span>
          )}

          {status === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <motion.svg
                viewBox="0 0 26 26"
                className="h-7 w-7"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
              >
                <circle cx="13" cy="13" r="10" stroke="#ffffff40" strokeWidth="3" fill="none" />
                <path d="M13 3 A10 10 0 0 1 23 13" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
              </motion.svg>
            </motion.div>
          )}

          {(status === 'success' || status === 'saved') && (
            <motion.div
              key="check-state"
              layout
              initial={status === 'success' ? { opacity: 0, scale: 0.5 } : { opacity: 1 }}
              animate={status === 'success' ? { opacity: 1, scale: 1.1 } : { opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: 12 }}
              className={`absolute inset-0 flex items-center justify-center gap-2 ${status === 'saved' ? 'px-4' : ''}`}
            >
              <motion.div layout animate={{ color: status === 'success' ? '#ffffff' : '#1a3d2e' }}>
                <CheckCircle size={22} strokeWidth={2.5} />
              </motion.div>
              <AnimatePresence mode="popLayout">
                {status === 'saved' && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.1 }}
                    className="whitespace-nowrap text-base font-bold tracking-tight text-sahaya-green"
                  >
                    {savedText}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </MotionConfig>
  );
};
