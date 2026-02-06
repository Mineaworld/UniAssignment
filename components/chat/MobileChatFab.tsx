import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import MobileChatOverlay from './MobileChatOverlay';

const fabVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      damping: 15,
      stiffness: 200,
      delay: 0.1,
    },
  },
  exit: {
    opacity: 0,
    scale: 0,
    transition: {
      duration: 0.2,
    },
  },
  tap: {
    scale: 0.92,
  },
};

interface MobileChatFabProps {
  onOverlayOpenChange?: (isOpen: boolean) => void;
}

const MobileChatFab = ({ onOverlayOpenChange }: MobileChatFabProps) => {
  const location = useLocation();
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  useEffect(() => {
    onOverlayOpenChange?.(isOverlayOpen);
    return () => {
      onOverlayOpenChange?.(false);
    };
  }, [isOverlayOpen, onOverlayOpenChange]);

  useEffect(() => {
    if (location.pathname === '/dashboard/chat' && isOverlayOpen) {
      setIsOverlayOpen(false);
    }
  }, [location.pathname, isOverlayOpen]);

  // Hide on desktop and when on the full chat page
  if (location.pathname === '/dashboard/chat') {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {!isOverlayOpen && (
          <motion.button
            key="chat-fab"
            variants={fabVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            whileTap="tap"
            onClick={() => setIsOverlayOpen(true)}
            aria-label="Open AI Chat"
            className="fixed bottom-24 left-4 z-50 md:hidden flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-lg shadow-zinc-900/20 dark:shadow-white/20 border border-zinc-800 dark:border-zinc-200"
          >
            <Sparkles className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>

      <MobileChatOverlay
        isOpen={isOverlayOpen}
        onClose={() => setIsOverlayOpen(false)}
      />
    </>
  );
};

export default MobileChatFab;
