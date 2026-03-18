import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Copy, Link2, Share2, Shield, Trash2, Users } from 'lucide-react';
import { useApp } from '../context';
import { Assignment, ShareLinkResult, SharedRole, Subject } from '../types';
import { buildShareLink } from '../utils/sharedSpaces';
import { Button } from './ui/Button';
import { NeonButton } from './ui/NeonButton';

interface ShareManagerModalProps {
  assignment?: Assignment | null;
  isOpen: boolean;
  onClose: () => void;
  resetKey?: string;
  subject?: Subject | null;
}

const ROLE_LABELS: Record<SharedRole, string> = {
  editor: 'Editor',
  owner: 'Owner',
  viewer: 'Viewer',
};

const SHARE_ROLE_OPTIONS = ['viewer', 'editor'] as const satisfies SharedRole[];

const ShareManagerModal = ({
  assignment = null,
  isOpen,
  onClose,
  resetKey,
  subject = null,
}: ShareManagerModalProps) => {
  const {
    assignments: allAssignments,
    getSharedMembers,
    removeSharedMember,
    setSharedInviteState,
    shareAssignment,
    shareSubject,
    subjects: allSubjects,
    updateSharedMemberRole,
  } = useApp();
  const liveSubject = subject
    ? allSubjects.find((item) => item.id === subject.id) ?? subject
    : null;
  const liveAssignment = assignment
    ? allAssignments.find((item) => item.id === assignment.id || item.sharedAssignmentId === assignment.id) ?? assignment
    : null;
  const target = liveSubject ?? liveAssignment;
  const modalTargetKey = resetKey ?? (subject
    ? `subject:${subject.id}`
    : assignment
      ? `assignment:${assignment.id}`
      : '');
  const [defaultRole, setDefaultRole] = useState<SharedRole>('viewer');
  const [copyStatus, setCopyStatus] = useState('');
  const [createdShareResult, setCreatedShareResult] = useState<ShareLinkResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !target) return;
    setDefaultRole(target.inviteDefaultRole ?? 'viewer');
    setCopyStatus('');
    setCreatedShareResult(null);
    setError('');
  }, [isOpen, modalTargetKey]);

  const activeLink = useMemo(() => {
    if (createdShareResult?.url) {
      return createdShareResult.url;
    }

    if (!target?.activeInviteId) {
      return '';
    }

    return buildShareLink(target.activeInviteId);
  }, [createdShareResult?.url, target?.activeInviteId]);

  const members = useMemo(
    () => (target?.sharedSpaceId ? getSharedMembers(target.sharedSpaceId) : []),
    [getSharedMembers, target?.sharedSpaceId]
  );

  if (!target) {
    return null;
  }

  const isSubjectTarget = Boolean(liveSubject);
  const isSingleSharedAssignment = liveAssignment?.isShared && liveAssignment.sharedTargetType === 'assignment';
  const isSharedViaSubject = liveAssignment?.isShared && liveAssignment.sharedTargetType === 'subject';
  const canCreateShare = !target.isShared;
  const canManageShare = Boolean(target.canManageShare);
  const canChangeInvite = canManageShare && Boolean(target.sharedSpaceId);
  const showCreateCard = canCreateShare && !createdShareResult;
  const showCreatedLink = Boolean(createdShareResult);

  const handleCopy = async () => {
    if (!activeLink) return;

    try {
      await navigator.clipboard.writeText(activeLink);
      setCopyStatus('Link copied');
    } catch (copyError) {
      console.error('Failed to copy share link:', copyError);
      setCopyStatus('Copy failed');
    }
  };

  const handleCreate = async () => {
    setError('');
    setLoading(true);

    try {
      const result = isSubjectTarget
        ? await shareSubject(target.id, defaultRole)
        : await shareAssignment(target.id, defaultRole);

      setCreatedShareResult(result);
      setCopyStatus('Link created.');

      if (navigator.clipboard) {
        void navigator.clipboard.writeText(result.url).then(() => {
          setCopyStatus('Link copied');
        }).catch((copyError) => {
          console.error('Failed to copy share link after creation:', copyError);
          setCopyStatus('Copy failed. Copy the link below.');
        });
      }
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : 'Failed to create share link.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInviteSettings = async () => {
    if (!target.sharedSpaceId) return;

    setError('');
    setLoading(true);

    try {
      await setSharedInviteState(target.sharedSpaceId, true, defaultRole);
    } catch (inviteError) {
      const message = inviteError instanceof Error ? inviteError.message : 'Failed to update the invite link.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleInvite = async (enabled: boolean) => {
    if (!target.sharedSpaceId) return;

    setError('');
    setLoading(true);

    try {
      await setSharedInviteState(target.sharedSpaceId, enabled, defaultRole);
    } catch (toggleError) {
      const message = toggleError instanceof Error ? toggleError.message : 'Failed to update the invite link.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleMemberRoleChange = async (memberUid: string, role: SharedRole) => {
    if (!target.sharedSpaceId) return;

    setError('');
    try {
      await updateSharedMemberRole(target.sharedSpaceId, memberUid, role);
    } catch (memberError) {
      const message = memberError instanceof Error ? memberError.message : 'Failed to update the member role.';
      setError(message);
    }
  };

  const handleMemberRemove = async (memberUid: string) => {
    if (!target.sharedSpaceId) return;

    setError('');
    try {
      await removeSharedMember(target.sharedSpaceId, memberUid);
    } catch (memberError) {
      const message = memberError instanceof Error ? memberError.message : 'Failed to remove the member.';
      setError(message);
    }
  };

  const titleText = isSubjectTarget ? liveSubject?.name ?? '' : liveAssignment?.title ?? '';
  const modalTitle = isSubjectTarget ? 'Share Subject' : 'Share Assignment';

  return ReactDOM.createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="pointer-events-auto relative w-full max-w-2xl rounded-2xl border border-border/20 bg-background shadow-2xl overflow-hidden"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/20 bg-background px-6 py-5">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{modalTitle}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{titleText}</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="space-y-6 px-6 py-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                {error && (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                {isSharedViaSubject && !canManageShare && (
                  <div className="rounded-2xl border border-border/60 bg-muted/20 px-5 py-4 text-sm text-muted-foreground">
                    This assignment is already part of a shared subject. Manage access from the subject instead.
                  </div>
                )}

                {showCreateCard && (
                  <div className="rounded-2xl border border-border/60 bg-muted/20 p-5">
                    <div className="flex items-start gap-3">
                      <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                        <Share2 className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-foreground">Create invite link</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Anyone with the link can join after signing in. New members start with the role you pick here.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end">
                      <label className="flex-1">
                        <span className="text-sm font-medium text-foreground/80">Default role</span>
                        <select
                          data-testid="share-default-role-select"
                          value={defaultRole}
                          onChange={(event) => setDefaultRole(event.target.value as SharedRole)}
                          className="mt-2 h-11 w-full rounded-xl border border-border/60 bg-background px-4 text-sm text-foreground"
                        >
                          {SHARE_ROLE_OPTIONS.map((role) => (
                            <option key={role} value={role}>
                              {ROLE_LABELS[role]}
                            </option>
                          ))}
                        </select>
                      </label>

                      <NeonButton
                        data-testid="share-create-link-button"
                        type="button"
                        onClick={handleCreate}
                        isLoading={loading}
                        className="sm:min-w-[180px]"
                        glow
                      >
                        Create link
                      </NeonButton>
                    </div>
                  </div>
                )}

                {showCreatedLink && (
                  <div className="rounded-2xl border border-border/60 bg-muted/20 p-5">
                    <div className="flex items-start gap-3">
                      <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                        <Link2 className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-foreground">Invite link ready</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Share this link now. After you close this modal, reopen the shared item from the list if you want to manage members or link settings.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-border/60 bg-background/80 p-4">
                      <div data-testid="share-active-link" className="break-all text-sm text-foreground">{activeLink}</div>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Button data-testid="share-copy-link-button" type="button" variant="outline" onClick={handleCopy}>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy link
                        </Button>
                      </div>
                      {copyStatus && (
                        <p className="mt-3 text-sm text-muted-foreground">{copyStatus}</p>
                      )}
                    </div>
                  </div>
                )}

                {canChangeInvite && !createdShareResult && (
                  <>
                    <div className="rounded-2xl border border-border/60 bg-muted/20 p-5">
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                          <Link2 className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-foreground">Invite link</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Keep the link active for new members, or turn it off when you want to stop new joins.
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-col gap-4">
                        <label>
                          <span className="text-sm font-medium text-foreground/80">Default role</span>
                          <select
                            data-testid="share-default-role-select"
                            value={defaultRole}
                            onChange={(event) => setDefaultRole(event.target.value as SharedRole)}
                            className="mt-2 h-11 w-full rounded-xl border border-border/60 bg-background px-4 text-sm text-foreground"
                          >
                            {SHARE_ROLE_OPTIONS.map((role) => (
                              <option key={role} value={role}>
                                {ROLE_LABELS[role]}
                              </option>
                            ))}
                          </select>
                        </label>

                        {target.activeInviteId ? (
                          <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                            <div data-testid="share-active-link" className="break-all text-sm text-foreground">{activeLink}</div>
                            <div className="mt-4 flex flex-wrap gap-3">
                              <Button data-testid="share-copy-link-button" type="button" variant="outline" onClick={handleCopy}>
                                <Copy className="mr-2 h-4 w-4" />
                                Copy link
                              </Button>
                              <Button data-testid="share-save-settings-button" type="button" variant="outline" onClick={handleSaveInviteSettings} disabled={loading}>
                                Save settings
                              </Button>
                              <Button data-testid="share-disable-link-button" type="button" variant="destructive" onClick={() => handleToggleInvite(false)} disabled={loading}>
                                Disable link
                              </Button>
                            </div>
                            {copyStatus && (
                              <p className="mt-3 text-sm text-muted-foreground">{copyStatus}</p>
                            )}
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-dashed border-border/60 bg-background/60 p-4 text-sm text-muted-foreground">
                            The invite link is off right now.
                          </div>
                        )}

                        {!target.activeInviteId && (
                          <div>
                            <NeonButton data-testid="share-enable-link-button" type="button" onClick={() => handleToggleInvite(true)} isLoading={loading} glow>
                              Enable link
                            </NeonButton>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-muted/20 p-5">
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                          <Users className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-foreground">Members</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Change access for existing members or remove them from this shared item.
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 space-y-3">
                        {members.map((member) => {
                          const isOwner = member.role === 'owner';

                          return (
                            <div
                              key={member.uid}
                              className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div>
                                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                  <span>{member.name}</span>
                                  {isOwner && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                                      <Shield className="h-3 w-3" />
                                      Owner
                                    </span>
                                  )}
                                </div>
                                <p className="mt-1 text-sm text-muted-foreground">{member.email}</p>
                              </div>

                              {isOwner ? (
                                <div className="rounded-full border border-border/60 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                  Owner
                                </div>
                              ) : (
                                <div className="flex flex-wrap items-center gap-2">
                                  <select
                                    data-testid={`share-member-role-${member.uid}`}
                                    value={member.role}
                                    onChange={(event) => handleMemberRoleChange(member.uid, event.target.value as SharedRole)}
                                    className="h-10 rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground"
                                  >
                                    {SHARE_ROLE_OPTIONS.map((role) => (
                                      <option key={role} value={role}>
                                        {ROLE_LABELS[role]}
                                      </option>
                                    ))}
                                  </select>
                                  <Button data-testid={`share-member-remove-${member.uid}`} type="button" variant="ghost" onClick={() => handleMemberRemove(member.uid)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Remove
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                {target.isShared && !canManageShare && isSingleSharedAssignment && (
                  <div className="rounded-2xl border border-border/60 bg-muted/20 px-5 py-4 text-sm text-muted-foreground">
                    This assignment is already shared. Your role is <span className="font-semibold text-foreground">{ROLE_LABELS[target.sharedRole ?? 'viewer']}</span>.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ShareManagerModal;
