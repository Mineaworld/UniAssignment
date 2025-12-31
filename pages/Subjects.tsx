import React, { useState } from 'react';
import { useApp } from '../context';
import CreateSubjectModal from '../components/CreateSubjectModal';
import EditSubjectModal from '../components/EditSubjectModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { Subject } from '../types';
import { GlassCard } from '../components/ui/GlassCard';
import { NeonButton } from '../components/ui/NeonButton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Plus, FolderIcon, Edit, Trash2 } from 'lucide-react';
import { cn } from '../utils/cn';

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
    <div className="flex-1 w-full max-w-4xl mx-auto p-8 space-y-8">
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

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/40">Subjects</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your course subjects.</p>
        </div>
        <NeonButton onClick={() => setIsModalOpen(true)} className="gap-2" variant="primary" glow>
          <Plus className="h-4 w-4" />
          Add Subject
        </NeonButton>
      </div>

      <GlassCard className="p-0 overflow-hidden rounded-2xl">
        <div className="rounded-md border-0">
          <Table>
            <TableHeader className="bg-muted/30 dark:bg-white/5">
              <TableRow className="border-border dark:border-white/5 hover:bg-transparent">
                <TableHead className="w-20 text-muted-foreground">Color</TableHead>
                <TableHead className="text-muted-foreground">Subject Name</TableHead>
                <TableHead className="text-muted-foreground">Last Updated</TableHead>
                <TableHead className="text-right text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((subject) => (
                <TableRow key={subject.id} className="group hover:bg-muted/30 dark:hover:bg-white/5 border-border dark:border-white/5 transition-colors">
                  <TableCell>
                    <div className={cn("h-4 w-4 rounded-full shadow-[0_0_10px_currentColor] opacity-90", subject.color)}></div>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {subject.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {subject.lastUpdated}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <NeonButton
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-white/10 text-muted-foreground hover:text-primary"
                        onClick={() => setEditingSubject(subject)}
                      >
                        <Edit className="h-4 w-4" />
                      </NeonButton>
                      <NeonButton
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeletingSubject(subject)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </NeonButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {subjects.length === 0 && (
                <TableRow className="hover:bg-transparent border-white/5">
                  <TableCell colSpan={4} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="h-12 w-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                        <FolderIcon className="h-6 w-6 text-white/20" />
                      </div>
                      <p className="text-muted-foreground text-sm font-medium">No subjects found</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </GlassCard>
    </div>
  );
};

export default Subjects;