import { useState, useEffect, type FC, type ReactNode } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import { Undo2 } from 'lucide-react';
import useMeasure from 'react-use-measure';

interface TimedUndoActionProps {
  initialSeconds?: number;
  deleteLabel?: string;
  undoLabel?: string;
  icon?: ReactNode;
  onConfirmedDelete?: () => void | Promise<void>;
}

function AnimatedText({ text, delayStep = 0.012 }: { text: string; delayStep?: number }) {
  const chars = text.split('');
  return (
    <span style={{ display: 'inline-flex' }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={text} style={{ display: 'inline-flex', willChange: 'transform' }}>
          {chars.map((char, i) => (
            <motion.span
              key={i}
              initial={{ y: 8, opacity: 0, scale: 0.6, filter: 'blur(2px)' }}
              animate={{ y: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ y: -8, opacity: 0, scale: 0.6, filter: 'blur(2px)' }}
              transition={{ type: 'spring', stiffness: 240, damping: 16, mass: 1.2, delay: i * delayStep }}
              style={{ display: 'inline-block', whiteSpace: char === ' ' ? 'pre' : undefined }}
            >
              {char}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export const TimedUndoAction: FC<TimedUndoActionProps> = ({
  initialSeconds = 8,
  deleteLabel = 'Delete All My Data',
  undoLabel = 'Cancel Delete',
  icon,
  onConfirmedDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [countDown, setCountDown] = useState(initialSeconds);
  const [ref, bounds] = useMeasure({ offsetSize: true });

  const handleClick = () => {
    setIsDeleting((prev) => {
      const next = !prev;
      if (next) setCountDown(initialSeconds);
      return next;
    });
  };

  useEffect(() => {
    if (!isDeleting) return;
    const interval = setInterval(() => {
      setCountDown((prev) => {
        if (prev <= 1) {
          setIsDeleting(false);
          onConfirmedDelete?.();
          return initialSeconds;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isDeleting, initialSeconds, onConfirmedDelete]);

  return (
    <div className="flex w-full items-center justify-start font-sans">
      <MotionConfig transition={{ type: 'spring', stiffness: 250, damping: 22 }}>
        <motion.div
          className={`relative flex cursor-pointer items-center justify-start overflow-hidden rounded-full transition-colors duration-300 ${
            isDeleting ? 'bg-red-500/10' : 'bg-red-600'
          }`}
          animate={{ width: bounds.width > 0 ? bounds.width : 'auto' }}
          onClick={handleClick}
        >
          <div
            className={`flex items-center justify-center gap-2 ${isDeleting ? 'px-3 py-2.5' : 'px-5 py-3'}`}
            ref={ref}
          >
            <AnimatePresence mode="popLayout">
              {isDeleting && (
                <motion.div
                  className="rounded-full bg-red-500 p-1.5"
                  initial={{ opacity: 0, filter: 'blur(2px)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, filter: 'blur(2px)' }}
                >
                  {icon ?? <Undo2 className="h-4 w-4 text-white" />}
                </motion.div>
              )}
            </AnimatePresence>

            <span className={`text-base font-semibold ${isDeleting ? 'text-red-500' : 'text-white'}`}>
              <AnimatedText text={isDeleting ? undoLabel : deleteLabel} />
            </span>

            <AnimatePresence mode="popLayout">
              {isDeleting && (
                <motion.div
                  className="flex items-center justify-center rounded-full bg-red-500 px-2.5 py-1 text-white tabular-nums"
                  initial={{ opacity: 0, filter: 'blur(2px)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, filter: 'blur(2px)' }}
                >
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={countDown}
                      className="text-sm font-bold"
                      initial={{ opacity: 0, y: -14, scale: 0.5 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 14, scale: 0.5 }}
                      transition={{ type: 'spring', stiffness: 240, damping: 20 }}
                    >
                      {countDown}
                    </motion.span>
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </MotionConfig>
    </div>
  );
};
