import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { useApp } from '../context';

interface CreateSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateSubjectModal: React.FC<CreateSubjectModalProps> = ({ isOpen, onClose }) => {
  const { addSubject } = useApp();
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState('bg-blue-500');
  const [loading, setLoading] = useState(false);

  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-red-500',
    'bg-yellow-500', 'bg-purple-500', 'bg-pink-500',
    'bg-indigo-500', 'bg-orange-500', 'bg-teal-500'
  ];

  // Reset form when modal closes
  const handleClose = () => {
    setName('');
    setSelectedColor('bg-blue-500');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setLoading(true);
    try {
      await addSubject({
        name,
        color: selectedColor
      });

      // Reset form and close modal on success
      setName('');
      setSelectedColor('bg-blue-500');
      onClose();
    } catch (error) {
      console.error("Failed to add subject:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm">
      <>
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-border/20 dark:border-white/10 bg-background dark:bg-[#101622]">
          <h2 className="text-xl font-bold text-foreground">Add New Subject</h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Subject Name</span>
            <input
              type="text"
              required
              placeholder="e.g., Advanced Calculus"
              className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:ring focus:ring-primary/20 focus:ring-opacity-50 h-12 px-4"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </label>

          <div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Color Code</span>
            <div className="mt-3 grid grid-cols-5 gap-3">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`
                    w-10 h-10 rounded-full ${color} transition-all transform hover:scale-110 flex items-center justify-center
                    ${selectedColor === color ? 'ring-2 ring-offset-2 ring-primary dark:ring-offset-[#101622] scale-110' : ''}
                  `}
                >
                  {selectedColor === color && <span className="material-symbols-outlined text-white text-sm">check</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-lg text-slate-700 dark:text-white bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-lg text-white bg-primary hover:bg-primary/90 font-bold shadow-lg shadow-primary/25 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Subject'}
            </button>
          </div>
        </form>
      </>
    </Modal>
  );
};

export default CreateSubjectModal;
