"use client"

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

export function AnimatedCard({ 
  children, 
  className, 
  delay = 0, 
  duration = 0.5 
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration, 
        delay,
        ease: "easeOut"
      }}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      className={cn(
        "rounded-2xl border border-white/10 bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/40",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
