import { useState, type FC, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface ContinuousPaginationProps {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

interface PageButtonProps {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

const NavButton: FC<PageButtonProps> = ({ children, onClick, disabled }) => (
  <motion.button
    onClick={onClick}
    disabled={disabled}
    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
    whileHover={!disabled ? { scale: 1.06, y: -3, boxShadow: '0 6px 14px rgba(0,0,0,0.1)' } : {}}
    whileTap={!disabled ? { scale: 0.93 } : {}}
    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
  >
    {children}
  </motion.button>
);

export const ContinuousPagination: FC<ContinuousPaginationProps> = ({
  totalPages,
  currentPage,
  onPageChange,
}) => {
  const paginate = (page: number) => {
    if (page < 1 || page > totalPages) return;
    onPageChange(page);
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 py-2 text-sm">
      <NavButton onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>
        <ChevronLeft className="h-4 w-4" />
      </NavButton>

      <div className="relative flex gap-2">
        {Array.from({ length: totalPages }).map((_, i) => {
          const page = i + 1;
          const isActive = page === currentPage;

          return (
            <motion.button
              key={page}
              onClick={() => paginate(page)}
              className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-sm font-semibold shadow-sm transition-colors duration-200 ${
                isActive ? 'text-white' : 'bg-white text-slate-500 hover:text-slate-800'
              }`}
              whileHover={!isActive ? { y: -3, boxShadow: '0 8px 16px rgba(0,0,0,0.1)' } : {}}
              whileTap={{ scale: 0.93 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            >
              {/* Active background */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="active-page-bg"
                    className="absolute inset-0 rounded-xl overflow-hidden"
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.85, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                    style={{
                      background: 'linear-gradient(135deg, #1a3d2e 0%, #0f2119 100%)',
                      boxShadow: '0 6px 14px -4px rgba(26,61,46,0.55), inset 0 1px 0 rgba(255,255,255,0.12)',
                    }}
                  />
                )}
              </AnimatePresence>
              <span className="relative z-10 text-base font-bold">{page}</span>
            </motion.button>
          );
        })}
      </div>

      <NavButton onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}>
        <ChevronRight className="h-4 w-4" />
      </NavButton>
    </div>
  );
};
