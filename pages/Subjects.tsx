import React, { useState } from 'react';
import { useApp } from '../context';
import { motion, AnimatePresence } from 'framer-motion';
import CreateSubjectModal from '../components/CreateSubjectModal';
import EditSubjectModal from '../components/EditSubjectModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { Subject } from '../types';

const Subjects = () => {
  const { subjects, deleteSubject } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deletingSubject, setDeletingSubject] = useState<Subject | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDeleteSubject = async () => {
    if (!deletingSubject) return;
    setDeleteLoading(true);
    try {
      await deleteSubject(deletingSubject.id);
      setDeletingSubject(null);
    } catch (error) {
      console.error("Failed to delete subject:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto p-8">
      <CreateSubjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <EditSubjectModal
        isOpen={!!editingSubject}
        onClose={() => setEditingSubject(null)}
        subject={editingSubject}
      />
      <ConfirmDeleteModal
        isOpen={!!deletingSubject}
        onClose={() => setDeletingSubject(null)}
        onConfirm={handleDeleteSubject}
        title="Delete Subject"
        itemName={deletingSubject?.name || ''}
        itemType="subject"
        loading={deleteLoading}
      />

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Subject Management</h1>
          <p className="text-slate-500 dark:text-white/60 mt-1">Create, edit, and delete your course subjects.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg font-bold transition-all"
        >
          <span className="material-symbols-outlined">add</span>
          Add New Subject
        </button>
      </div>

      <div className="bg-white dark:bg-[#101622]/50 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 w-20">Color</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40">Subject Name</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40">Last Updated</th>
              <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-white/5">
            <AnimatePresence>
              {subjects.map((subject) => (
                <motion.tr
                  key={subject.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`h-4 w-4 rounded-full ${subject.color}`}></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-white">
                    {subject.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-white/60">
                    {subject.lastUpdated}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => setEditingSubject(subject)}
                        className="text-slate-400 hover:text-primary transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button
                        onClick={() => setDeletingSubject(subject)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>

        {subjects.length === 0 && (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-700 mb-4">folder_off</span>
            <p className="text-slate-900 dark:text-white font-bold">No Subjects Found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Subjects;