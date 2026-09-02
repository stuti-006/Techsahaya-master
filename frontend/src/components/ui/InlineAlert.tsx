import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { MdOutlineInfo } from 'react-icons/md';
import type { ReactNode } from 'react';

interface InlineAlertProps {
  message: string;
  linkText?: string;
  onLinkClick?: () => void;
  icon?: ReactNode;
  variant?: 'teal' | 'amber' | 'green' | 'red';
}

const variantClasses = {
  teal: {
    border: 'border-teal-600/40',
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    link: 'text-teal-700 hover:bg-teal-100',
    icon: 'text-teal-600',
  },
  amber: {
    border: 'border-amber-500/40',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    link: 'text-amber-700 hover:bg-amber-100',
    icon: 'text-amber-500',
  },
  green: {
    border: 'border-sahaya-green/30',
    bg: 'bg-emerald-50',
    text: 'text-sahaya-green',
    link: 'text-sahaya-green hover:bg-emerald-100',
    icon: 'text-sahaya-green',
  },
  red: {
    border: 'border-red-400/40',
    bg: 'bg-red-50',
    text: 'text-red-700',
    link: 'text-red-700 hover:bg-red-100',
    icon: 'text-red-500',
  },
};

export function InlineAlert({ message, linkText, onLinkClick, icon, variant = 'teal' }: InlineAlertProps) {
  const v = variantClasses[variant];
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.22 }}
      className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${v.border} ${v.bg}`}
    >
      <span className={`flex-shrink-0 ${v.icon}`}>
        {icon ?? <MdOutlineInfo className="h-5 w-5" />}
      </span>
      <span className={`flex-1 text-sm font-medium ${v.text}`}>{message}</span>
      {linkText && onLinkClick && (
        <button
          onClick={onLinkClick}
          className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${v.link}`}
        >
          {linkText}
          <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
        </button>
      )}
    </motion.div>
  );
}
