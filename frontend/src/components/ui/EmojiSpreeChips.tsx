import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface InterestItem {
  id: string;
  label: string;
  emoji: string;
}

interface Particle {
  id: string;
  emoji: string;
  xOffset: number;
  rotate: number;
}

interface EmojiSpreeChipsProps {
  interests: InterestItem[];
  selected: string[];
  onChange: (ids: string[]) => void;
  title?: string;
}

function FloatingEmoji({ emoji, delay, xOffset, rotate }: { emoji: string; delay: number; xOffset: number; rotate: number }) {
  return (
    <motion.div
      initial={{ y: 0, x: 0, opacity: 0, scale: 0.6, rotate: 0 }}
      animate={{
        y: [0, -200, -200, 30],
        x: [0, xOffset, xOffset * 0.8],
        opacity: [0, 1, 1, 0],
        scale: [0.6, 2.5, 2.5, 0.6],
        rotate: [0, rotate, rotate * 0.5],
      }}
      transition={{ duration: 1, ease: 'easeInOut', delay }}
      className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 text-5xl z-30"
    >
      {emoji}
    </motion.div>
  );
}

export const EmojiSpreeChips: React.FC<EmojiSpreeChipsProps> = ({
  interests,
  selected,
  onChange,
  title,
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);

  const spawnParticles = (emoji: string) => {
    const newParticles: Particle[] = Array.from({ length: 3 }).map(() => ({
      id: crypto.randomUUID(),
      emoji,
      xOffset: (Math.random() - 0.5) * 160,
      rotate: (Math.random() - 0.5) * 40,
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 1600);
  };

  const toggleInterest = (id: string, emoji: string) => {
    const exists = selected.includes(id);
    const updated = exists ? selected.filter((i) => i !== id) : [...selected, id];
    onChange(updated);
    if (!exists) spawnParticles(emoji);
  };

  const rows = useMemo(() => {
    const result: InterestItem[][] = [[], [], []];
    interests.forEach((item, index) => result[index % 3].push(item));
    return result;
  }, [interests]);

  return (
    <div className="relative isolate w-full overflow-hidden py-2">
      {title && <p className="mb-3 text-sm font-semibold text-slate-700">{title}</p>}

      {/* Draggable chip rows */}
      <motion.div
        ref={containerRef}
        className={`relative w-full overflow-hidden ${isPanning ? 'touch-none' : 'touch-pan-y'}`}
        style={{ maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)' }}
      >
        <motion.div
          drag="x"
          dragConstraints={containerRef}
          onPanStart={() => setIsPanning(true)}
          onPanEnd={() => setIsPanning(false)}
          className="flex w-max cursor-grab flex-col gap-3 pr-10 active:cursor-grabbing"
        >
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex w-max gap-3">
              {row.map((item) => {
                const isSelected = selected.includes(item.id);
                return (
                  <motion.button
                    key={item.id}
                    whileTap={{ scale: 0.93 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                    onClick={() => toggleInterest(item.id, item.emoji)}
                    className={`flex w-max items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors ${
                      isSelected
                        ? 'border-sahaya-green bg-sahaya-green/10 text-sahaya-green'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-sahaya-green/50'
                    }`}
                  >
                    <span>{item.emoji}</span>
                    <span>{item.label}</span>
                  </motion.button>
                );
              })}
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Particles */}
      <div className="pointer-events-none absolute inset-0">
        <AnimatePresence>
          {particles.map((p, i) => (
            <FloatingEmoji key={p.id} emoji={p.emoji} delay={i * 0.08} xOffset={p.xOffset} rotate={p.rotate} />
          ))}
        </AnimatePresence>
      </div>

      {/* Selected count pill */}
      <div className="mt-3 flex justify-end">
        <AnimatePresence>
          {selected.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className="rounded-full bg-sahaya-green px-4 py-1.5 text-sm font-semibold text-white shadow"
            >
              {selected.length} selected
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
