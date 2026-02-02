import React from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface TelegramPromptModalProps {
  isOpen: boolean;
  onClose: (action: 'link' | 'remind' | 'permanent') => void;
  userUid: string;
}

const TelegramPromptModal: React.FC<TelegramPromptModalProps> = ({ isOpen, onClose, userUid }) => {
  const handleLinkTelegram = () => {
    window.open(`https://t.me/UniAssignmentBot?start=${userUid}`, '_blank');
    onClose('link');
  };

  const handleBackdropClick = () => {
    onClose('remind'); // Backdrop click = remind me later
  };

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose('remind');
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return ReactDOM.createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClick}
            className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="pointer-events-auto relative w-full max-w-md bg-background dark:bg-[#101622] rounded-2xl shadow-2xl border border-border/20 overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              {/* Header with gradient background */}
              <div className="relative bg-gradient-to-br from-[#0088cc] to-[#006699] p-6 text-center">
                {/* Close button */}
                <button
                  onClick={() => onClose('remind')}
                  className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                  aria-label="Close"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>

                {/* Telegram Icon */}
                <div className="mx-auto mb-4 flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.751-.244-1.349-.374-1.297-.789.027-.216.324-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.121.1.155.231.17.325.015.093.035.305.019.47z" />
                  </svg>
                </div>

                <h2 className="text-2xl font-bold text-white mb-1">
                  Connect Your Telegram
                </h2>
                <p className="text-white/90 text-sm">
                  Never miss an assignment deadline again!
                </p>
              </div>

              {/* Content */}
              <div className="p-6 sticky top-0 z-10 bg-background dark:bg-[#101622]">
                {/* Benefits List */}
                <div className="space-y-3 mb-6">
                  <BenefitCard
                    icon="notifications"
                    title="Instant Notifications"
                    description="Get deadline reminders directly on Telegram"
                  />
                  <BenefitCard
                    icon="add_circle"
                    title="Quick Additions"
                    description="Create assignments via chat in seconds"
                  />
                  <BenefitCard
                    icon="list_alt"
                    title="On-the-Go Management"
                    description="View and manage tasks from anywhere"
                  />
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleLinkTelegram}
                    className="w-full flex items-center justify-center gap-2 bg-[#0088cc] hover:bg-[#0077b5] text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-[#0088cc]/20 hover:shadow-xl hover:-translate-y-0.5"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.751-.244-1.349-.374-1.297-.789.027-.216.324-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.121.1.155.231.17.325.015.093.035.305.019.47z" />
                    </svg>
                    Link Telegram Account
                  </button>

                  <div className="flex gap-3">
                    <button
                      onClick={() => onClose('remind')}
                      className="flex-1 px-4 py-3 bg-muted/50 dark:bg-white/10 hover:bg-muted/80 dark:hover:bg-white/20 text-foreground font-semibold rounded-xl transition-all"
                    >
                      Remind Me Later
                    </button>
                    <button
                      onClick={() => onClose('permanent')}
                      className="px-4 py-3 text-muted-foreground hover:text-foreground font-medium text-sm transition-colors"
                    >
                      Don't Ask Again
                    </button>
                  </div>
                </div>

                {/* Helper text */}
                <p className="mt-4 text-xs text-muted-foreground text-center">
                  After clicking "Link", press "Start" in Telegram to complete the connection.
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

interface BenefitCardProps {
  icon: string;
  title: string;
  description: string;
}

const BenefitCard: React.FC<BenefitCardProps> = ({ icon, title, description }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.1 }}
    className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 dark:bg-white/5 border-border/60 dark:border-white/10"
  >
    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#0088cc]/10 text-[#0088cc] shrink-0">
      <span className="material-symbols-outlined text-xl">{icon}</span>
    </div>
    <div>
      <p className="font-semibold text-foreground text-sm">{title}</p>
      <p className="text-muted-foreground text-xs">{description}</p>
    </div>
  </motion.div>
);

export default TelegramPromptModal;
