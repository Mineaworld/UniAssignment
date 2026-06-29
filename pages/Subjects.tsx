import React, { useState } from 'react';
import { useApp } from '../context';
import CreateSubjectModal from '../components/CreateSubjectModal';
import EditSubjectModal from '../components/EditSubjectModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import ShareManagerModal from '../components/ShareManagerModal';
import { Subject } from '../types';
import { GlassCard } from '../components/ui/GlassCard';
import { NeonButton } from '../components/ui/NeonButton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Plus, FolderIcon, Edit, Trash2, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedThemeToggler } from '../components/ui/AnimatedThemeToggler';
import { SubjectBadge } from '../components/ui/SubjectBadge';
import { SharedPermissionBadge } from '../components/ui/SharedPermissionBadge';
import { formatSubjectLastUpdated } from '../utils/subjectPresentation';

const Subjects = () => {
  const { subjects, deleteSubject } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deletingSubject, setDeletingSubject] = useState<Subject | null>(null);
  const [sharingSubject, setSharingSubject] = useState<Subject | null>(null);
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
    <div className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-8 space-y-6 md:space-y-8">
      <CreateSubjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <EditSubjectModal
        isOpen={!!editingSubject}
        onClose={() => setEditingSubject(null)}
        subject={editingSubject}
      />
      <ShareManagerModal
        isOpen={!!sharingSubject}
        onClose={() => setSharingSubject(null)}
        subject={sharingSubject}
      />
      <ConfirmDeleteModal
        isOpen={!!deletingSubject}
        onClose={() => setDeletingSubject(null)}
        onConfirm={handleDeleteSubject}
        title={deletingSubject?.isShared ? 'Delete Shared Subject' : 'Delete Subject'}
        itemName={deletingSubject?.name || ''}
        itemType="subject"
        loading={deleteLoading}
        warningMessage={
          deletingSubject?.isShared
            ? 'This will remove the shared subject and its shared assignments for every member.'
            : undefined
        }
      />

      <div className="flex justify-between items-start pt-4 md:pt-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/40">Subjects</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your course subjects.</p>
        </div>
        <div className="flex items-center gap-3">
          <AnimatedThemeToggler className="md:hidden h-10 w-10 bg-white/80 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 rounded-xl shrink-0" />
          <NeonButton data-testid="add-subject-button" onClick={() => setIsModalOpen(true)} className="gap-2" variant="primary" glow>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Subject</span>
            <span className="sm:hidden">Add</span>
          </NeonButton>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {subjects.map((subject, index) => (
            <motion.div
              data-testid={`subject-mobile-card-${subject.id}`}
              key={subject.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="relative overflow-hidden rounded-2xl p-4 backdrop-blur-xl border bg-white/70 dark:bg-black/40 border-black/5 dark:border-white/10"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SubjectBadge name={subject.name} showName={false} size="lg" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{subject.name}</h3>
                      {subject.isShared && (
                        <SharedPermissionBadge role={subject.sharedRole} />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Updated {formatSubjectLastUpdated(subject.lastUpdated, subject.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {(!subject.isShared || subject.canManageShare) && (
                    <button
                      data-testid={`subject-share-${subject.id}`}
                      aria-label={`Share subject ${subject.name}`}
                      onClick={() => setSharingSubject(subject)}
                      className="h-11 w-11 flex items-center justify-center rounded-xl hover:bg-muted/50 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Share2 className="h-5 w-5" />
                    </button>
                  )}
                  {subject.canEdit !== false && (
                    <button
                      aria-label={`Edit subject ${subject.name}`}
                      onClick={() => setEditingSubject(subject)}
                      className="h-11 w-11 flex items-center justify-center rounded-xl hover:bg-muted/50 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                  )}
                  {subject.canDelete && (
                    <button
                      aria-label={`Delete subject ${subject.name}`}
                      onClick={() => setDeletingSubject(subject)}
                      className="h-11 w-11 flex items-center justify-center rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {subjects.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <div className="h-12 w-12 bg-muted/30 rounded-full flex items-center justify-center border border-border/50 mb-3">
              <FolderIcon className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground text-sm font-medium">No subjects found</p>
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <GlassCard className="hidden md:block p-0 overflow-hidden rounded-2xl">
        <div className="rounded-md border-0">
          <Table>
            <TableHeader className="bg-muted/30 dark:bg-white/5">
              <TableRow className="border-border dark:border-white/5 hover:bg-transparent">
                <TableHead className="text-muted-foreground">Subject</TableHead>
                <TableHead className="text-muted-foreground">Last Updated</TableHead>
                <TableHead className="text-right text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((subject) => (
                <TableRow data-testid={`subject-row-${subject.id}`} key={subject.id} className="group hover:bg-muted/30 dark:hover:bg-white/5 border-border dark:border-white/5 transition-colors">
                  <TableCell className="font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <SubjectBadge name={subject.name} size="md" />
                      {subject.isShared && (
                        <SharedPermissionBadge role={subject.sharedRole} />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatSubjectLastUpdated(subject.lastUpdated, subject.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {(!subject.isShared || subject.canManageShare) && (
                        <NeonButton
                          data-testid={`subject-share-${subject.id}`}
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 hover:bg-white/10 text-muted-foreground hover:text-primary"
                          onClick={() => setSharingSubject(subject)}
                        >
                          <Share2 className="h-4 w-4" />
                        </NeonButton>
                      )}
                      {subject.canEdit !== false && (
                        <NeonButton
                          data-testid={`subject-edit-${subject.id}`}
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 hover:bg-white/10 text-muted-foreground hover:text-primary"
                          onClick={() => setEditingSubject(subject)}
                        >
                          <Edit className="h-4 w-4" />
                        </NeonButton>
                      )}
                      {subject.canDelete && (
                        <NeonButton
                          data-testid={`subject-delete-${subject.id}`}
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeletingSubject(subject)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </NeonButton>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {subjects.length === 0 && (
                <TableRow className="hover:bg-transparent border-white/5">
                  <TableCell colSpan={3} className="h-48 text-center">
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
