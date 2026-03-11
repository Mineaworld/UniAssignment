import { AnimatePresence, motion } from 'framer-motion';

interface SubjectQuickCreatePanelProps {
  loading: boolean;
  name: string;
  onChangeName: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => Promise<void> | void;
  open: boolean;
  successMessage: string;
}

export const SubjectQuickCreatePanel = ({
  loading,
  name,
  onChangeName,
  onClose,
  onSubmit,
  open,
  successMessage,
}: SubjectQuickCreatePanelProps) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <span className="material-symbols-outlined text-lg text-primary">add_circle</span>
                Quick Add Subject
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-white/50 dark:hover:bg-black/20"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <AnimatePresence>
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-3 flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-2"
                >
                  <span className="material-symbols-outlined text-sm text-green-600 dark:text-green-400">check_circle</span>
                  <span className="text-xs font-medium text-green-700 dark:text-green-300">{successMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form className="space-y-3" onSubmit={onSubmit}>
              <input
                type="text"
                placeholder="Subject name (e.g., Mathematics)"
                className="block h-10 w-full rounded-lg border border-border/60 bg-background/80 px-3 text-sm text-foreground shadow-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-slate-800/80"
                value={name}
                onChange={(event) => onChangeName(event.target.value)}
              />

              <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground dark:border-white/10 dark:bg-white/5">
                Subject badges are generated automatically from the subject name.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg bg-muted/50 px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted dark:bg-black/20 dark:hover:bg-black/30"
                >
                  Done
                </button>
                <button
                  type="submit"
                  disabled={!name || loading}
                  className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
