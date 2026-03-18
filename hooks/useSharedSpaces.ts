import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  DocumentReference,
  FieldValue,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { DEFAULT_SUBJECT_COLOR } from '../constants/colors';
import {
  Assignment,
  AssignmentReminder,
  JoinedSharedSpaceResult,
  NotesContent,
  Priority,
  ShareLinkResult,
  SharedMember,
  SharedRole,
  ShareTarget,
  Status,
  Subject,
  SubjectSnapshot,
  User,
} from '../types';
import { prepareAssignmentUpdates } from '../utils/assignmentUpdate';
import { buildShareLink, createSharedAssignmentId, parseSharedAssignmentId } from '../utils/sharedSpaces';

interface SharedSpaceDoc {
  activeInviteId?: string | null;
  color?: string;
  createdAt: string;
  inviteDefaultRole?: SharedRole;
  inviteEnabled: boolean;
  ownerId: string;
  targetType: ShareTarget;
  title: string;
  updatedAt: string;
}

interface SharedInviteDoc {
  createdAt: string;
  createdBy: string;
  defaultRole: SharedRole;
  spaceId: string;
  targetType: ShareTarget;
}

interface SharedSpacePointerDoc {
  joinedAt: string;
  targetType: ShareTarget;
}

interface SharedMemberDoc extends SharedMember {
  joinedViaInviteId?: string;
  lastUpdated?: string;
}

interface SharedAssignmentBaseDoc {
  createdAt: string;
  dueDate: string;
  examType?: 'midterm' | 'final' | null;
  priority: Priority;
  subjectSnapshot?: SubjectSnapshot | null;
  title: string;
}

interface SharedAssignmentStateDoc {
  description?: string;
  notes?: NotesContent;
  reminder?: AssignmentReminder;
  status?: Status;
}

interface UseSharedSpacesOptions {
  personalAssignments: Assignment[];
  personalSubjects: Subject[];
  user: User | null;
}

interface UseSharedSpacesResult {
  assignments: Assignment[];
  subjects: Subject[];
  addAssignment: (assignment: Omit<Assignment, 'id' | 'createdAt'>) => Promise<void>;
  updateAssignment: (id: string, updates: Partial<Assignment>) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
  updateSubject: (id: string, updates: Partial<Subject>) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  shareSubject: (subjectId: string, defaultRole: SharedRole) => Promise<ShareLinkResult>;
  shareAssignment: (assignmentId: string, defaultRole: SharedRole) => Promise<ShareLinkResult>;
  joinSharedSpace: (inviteId: string) => Promise<JoinedSharedSpaceResult>;
  updateSharedMemberRole: (spaceId: string, memberUid: string, role: SharedRole) => Promise<void>;
  removeSharedMember: (spaceId: string, memberUid: string) => Promise<void>;
  setSharedInviteState: (spaceId: string, enabled: boolean, defaultRole?: SharedRole) => Promise<ShareLinkResult | null>;
  getSharedMembers: (spaceId: string) => SharedMember[];
}

interface FirestoreErrorLike {
  code?: string;
}

const SHARED_BASE_FIELD_KEYS = ['title', 'dueDate', 'priority', 'examType'] as const;
const SHARED_PERSONAL_FIELD_KEYS = ['status', 'reminder', 'notes', 'description'] as const;

const sanitizeForFirestore = <T extends Record<string, unknown>>(obj: T): Partial<T> => {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      continue;
    }

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const nestedSanitized = sanitizeForFirestore(value as Record<string, unknown>);
      if (Object.keys(nestedSanitized).length > 0) {
        sanitized[key] = nestedSanitized;
      }
      continue;
    }

    if (Array.isArray(value)) {
      sanitized[key] = value
        .filter((item) => item !== undefined)
        .map((item) => (
          item !== null && typeof item === 'object' && !Array.isArray(item)
            ? sanitizeForFirestore(item as Record<string, unknown>)
            : item
        ));
      continue;
    }

    sanitized[key] = value;
  }

  return sanitized as Partial<T>;
};

const createSharedStateFromAssignment = (
  assignment: Pick<Assignment, 'description' | 'notes' | 'reminder' | 'status'>
): SharedAssignmentStateDoc => sanitizeForFirestore({
  description: assignment.description,
  notes: assignment.notes,
  reminder: assignment.reminder,
  status: assignment.status,
}) as SharedAssignmentStateDoc;

const sortMembers = (members: SharedMember[]): SharedMember[] => (
  [...members].sort((left, right) => left.name.localeCompare(right.name))
);

const isEditorOrOwner = (role: SharedRole | undefined): boolean => role === 'owner' || role === 'editor';

const DELETE_BATCH_LIMIT = 400;

const filterRecordByKeys = <T extends Record<string, unknown>>(
  input: T,
  keys: Set<string>
): T => {
  const nextEntries = Object.entries(input).filter(([key]) => keys.has(key));
  return Object.fromEntries(nextEntries) as T;
};

const chunkRefs = <T,>(items: T[], size: number): T[][] => {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
};

const deleteRefsInBatches = async (
  refs: DocumentReference[]
): Promise<void> => {
  for (const batchRefs of chunkRefs(refs, DELETE_BATCH_LIMIT)) {
    const batch = writeBatch(db);

    batchRefs.forEach((ref) => {
      batch.delete(ref);
    });

    await batch.commit();
  }
};

export const useSharedSpaces = ({
  personalAssignments,
  personalSubjects,
  user,
}: UseSharedSpacesOptions): UseSharedSpacesResult => {
  const [sharedMembershipsBySpace, setSharedMembershipsBySpace] = useState<Record<string, SharedSpacePointerDoc>>({});
  const [sharedSpacesById, setSharedSpacesById] = useState<Record<string, SharedSpaceDoc>>({});
  const [sharedAssignmentsBySpace, setSharedAssignmentsBySpace] = useState<Record<string, Record<string, SharedAssignmentBaseDoc>>>({});
  const [sharedAssignmentStateBySpace, setSharedAssignmentStateBySpace] = useState<Record<string, Record<string, SharedAssignmentStateDoc>>>({});
  const [sharedMembersBySpace, setSharedMembersBySpace] = useState<Record<string, SharedMember[]>>({});

  useEffect(() => {
    if (!user?.uid) {
      setSharedMembershipsBySpace({});
      return undefined;
    }

    return onSnapshot(
      collection(db, `users/${user.uid}/sharedSpaces`),
      { includeMetadataChanges: true },
      (snapshot) => {
        const nextMemberships: Record<string, SharedSpacePointerDoc> = {};

        snapshot.docs.forEach((pointerDoc) => {
          // Wait for the server-backed write so downstream shared-space listeners
          // do not start before membership exists in Firestore rules.
          if (pointerDoc.metadata.hasPendingWrites) {
            return;
          }

          nextMemberships[pointerDoc.id] = pointerDoc.data() as SharedSpacePointerDoc;
        });

        setSharedMembershipsBySpace(nextMemberships);
      },
      (error) => {
        console.error('Error fetching shared memberships:', error);
      }
    );
  }, [user?.uid]);

  const sharedSpaceIds = useMemo(
    () => Object.keys(sharedMembershipsBySpace).sort(),
    [sharedMembershipsBySpace]
  );

  useEffect(() => {
    const allowedSpaceIds = new Set(sharedSpaceIds);

    setSharedSpacesById((current) => filterRecordByKeys(current, allowedSpaceIds));
    setSharedAssignmentsBySpace((current) => filterRecordByKeys(current, allowedSpaceIds));
    setSharedAssignmentStateBySpace((current) => filterRecordByKeys(current, allowedSpaceIds));
    setSharedMembersBySpace((current) => filterRecordByKeys(current, allowedSpaceIds));

    if (!user?.uid || sharedSpaceIds.length === 0) {
      return undefined;
    }

    const unsubscribers = sharedSpaceIds.flatMap((spaceId) => {
      const sharedSpaceUnsubscribe = onSnapshot(
        doc(db, 'sharedSpaces', spaceId),
        (snapshot) => {
          setSharedSpacesById((current) => {
            if (!snapshot.exists()) {
              const { [spaceId]: _removed, ...rest } = current;
              return rest;
            }

            return {
              ...current,
              [spaceId]: snapshot.data() as SharedSpaceDoc,
            };
          });
        },
        (error) => {
          console.error(`Error fetching shared space ${spaceId}:`, error);
        }
      );

      const assignmentsUnsubscribe = onSnapshot(
        query(collection(db, `sharedSpaces/${spaceId}/assignments`), orderBy('dueDate', 'asc')),
        (snapshot) => {
          const nextAssignments: Record<string, SharedAssignmentBaseDoc> = {};
          snapshot.docs.forEach((assignmentDoc) => {
            nextAssignments[assignmentDoc.id] = assignmentDoc.data() as SharedAssignmentBaseDoc;
          });

          setSharedAssignmentsBySpace((current) => ({
            ...current,
            [spaceId]: nextAssignments,
          }));
        },
        (error) => {
          console.error(`Error fetching shared assignments for ${spaceId}:`, error);
        }
      );

      const membersUnsubscribe = onSnapshot(
        collection(db, `sharedSpaces/${spaceId}/members`),
        (snapshot) => {
          const nextMembers = sortMembers(
            snapshot.docs.map((memberDoc) => memberDoc.data() as SharedMember)
          );

          setSharedMembersBySpace((current) => ({
            ...current,
            [spaceId]: nextMembers,
          }));
        },
        (error) => {
          console.error(`Error fetching shared members for ${spaceId}:`, error);
        }
      );

      const privateStateUnsubscribe = onSnapshot(
        collection(db, `sharedSpaces/${spaceId}/members/${user.uid}/assignmentState`),
        (snapshot) => {
          const nextState: Record<string, SharedAssignmentStateDoc> = {};
          snapshot.docs.forEach((stateDoc) => {
            nextState[stateDoc.id] = stateDoc.data() as SharedAssignmentStateDoc;
          });

          setSharedAssignmentStateBySpace((current) => ({
            ...current,
            [spaceId]: nextState,
          }));
        },
        (error) => {
          console.error(`Error fetching private shared assignment state for ${spaceId}:`, error);
        }
      );

      return [
        sharedSpaceUnsubscribe,
        assignmentsUnsubscribe,
        membersUnsubscribe,
        privateStateUnsubscribe,
      ];
    });

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [sharedSpaceIds, user?.uid]);

  const subjects = useMemo(() => {
    const currentUid = user?.uid ?? auth.currentUser?.uid ?? null;

    const personal = personalSubjects.map((subject) => ({
      ...subject,
      kind: 'personal' as const,
      isShared: false,
      canCreateAssignments: true,
      canDelete: true,
      canEdit: true,
      canManageShare: true,
    }));

    const shared = sharedSpaceIds.flatMap((spaceId) => {
      const space = sharedSpacesById[spaceId];
      const pointerMembership = sharedMembershipsBySpace[spaceId];

      if (!space || !pointerMembership || space.targetType !== 'subject') {
        return [];
      }

      const resolvedRole: SharedRole | undefined = currentUid
        ? (space.ownerId === currentUid
          ? 'owner'
          : sharedMembersBySpace[spaceId]?.find((member) => member.uid === currentUid)?.role)
        : undefined;

      return [{
        activeInviteId: space.activeInviteId ?? null,
        canCreateAssignments: resolvedRole === 'owner' || resolvedRole === 'editor',
        canDelete: resolvedRole === 'owner',
        canEdit: resolvedRole === 'owner' || resolvedRole === 'editor',
        canManageShare: resolvedRole === 'owner',
        color: space.color ?? DEFAULT_SUBJECT_COLOR,
        createdAt: space.createdAt,
        id: spaceId,
        inviteDefaultRole: space.inviteDefaultRole,
        isShared: true,
        kind: 'shared' as const,
        lastUpdated: space.updatedAt,
        name: space.title,
        sharedRole: resolvedRole,
        sharedSpaceId: spaceId,
      }];
    });

    return [...personal, ...shared];
  }, [personalSubjects, sharedMembersBySpace, sharedMembershipsBySpace, sharedSpaceIds, sharedSpacesById, user?.uid]);

  const assignments = useMemo(() => {
    const currentUid = user?.uid ?? auth.currentUser?.uid ?? null;

    const getResolvedRole = (
      spaceId: string,
      space: SharedSpaceDoc
    ): SharedRole | undefined => {
      if (!currentUid) return undefined;
      if (space.ownerId === currentUid) return 'owner';

      return sharedMembersBySpace[spaceId]?.find((member) => member.uid === currentUid)?.role;
    };

    const personal = personalAssignments.map((assignment) => ({
      ...assignment,
      canChangeSubject: true,
      canDelete: true,
      canEditPersonalFields: true,
      canEditSharedFields: true,
      canManageShare: true,
      isShared: false,
      kind: 'personal' as const,
    }));

    const shared = sharedSpaceIds.flatMap((spaceId) => {
      const space = sharedSpacesById[spaceId];
      const pointerMembership = sharedMembershipsBySpace[spaceId];
      const baseAssignments = sharedAssignmentsBySpace[spaceId] ?? {};
      const privateState = sharedAssignmentStateBySpace[spaceId] ?? {};

      if (!space || !pointerMembership) {
        return [];
      }

      const resolvedRole = getResolvedRole(spaceId, space);
      const canEditSharedFields = resolvedRole === 'owner' || resolvedRole === 'editor';

      return Object.entries(baseAssignments).map(([assignmentId, baseAssignment]) => {
        const assignmentState = privateState[assignmentId];
        const isSingleSharedAssignment = space.targetType === 'assignment';

        return {
          activeInviteId: space.activeInviteId ?? null,
          canChangeSubject: false,
          canDelete: isSingleSharedAssignment
            ? resolvedRole === 'owner'
            : canEditSharedFields,
          canEditPersonalFields: true,
          canEditSharedFields,
          canManageShare: resolvedRole === 'owner' && isSingleSharedAssignment,
          createdAt: baseAssignment.createdAt,
          description: assignmentState?.description,
          dueDate: baseAssignment.dueDate,
          examType: baseAssignment.examType ?? null,
          id: createSharedAssignmentId(spaceId, assignmentId),
          inviteDefaultRole: space.inviteDefaultRole,
          isShared: true,
          kind: 'shared' as const,
          notes: assignmentState?.notes,
          priority: baseAssignment.priority,
          reminder: assignmentState?.reminder,
          sharedAssignmentId: assignmentId,
          sharedRole: resolvedRole,
          sharedSpaceId: spaceId,
          sharedTargetType: space.targetType,
          status: assignmentState?.status ?? Status.Pending,
          subjectId: space.targetType === 'subject' ? spaceId : '',
          subjectSnapshot: baseAssignment.subjectSnapshot ?? null,
          title: baseAssignment.title,
        } satisfies Assignment;
      });
    });

    return [...personal, ...shared];
  }, [
    personalAssignments,
    sharedAssignmentStateBySpace,
    sharedAssignmentsBySpace,
    sharedMembersBySpace,
    sharedMembershipsBySpace,
    sharedSpaceIds,
    sharedSpacesById,
    user?.uid,
  ]);

  const getAssignmentById = useCallback(
    (assignmentId: string): Assignment | undefined => assignments.find((assignment) => assignment.id === assignmentId),
    [assignments]
  );

  const getSubjectById = useCallback(
    (subjectId: string): Subject | undefined => subjects.find((subject) => subject.id === subjectId),
    [subjects]
  );

  const assertUser = useCallback((): User => {
    if (!user?.uid) {
      if (auth.currentUser?.uid) {
        return {
          avatar: auth.currentUser.photoURL || '',
          email: auth.currentUser.email || '',
          major: user?.major || 'Undeclared',
          name: auth.currentUser.displayName || user?.name || 'Student',
          telegramLinked: user?.telegramLinked ?? false,
          telegramLinkedAt: user?.telegramLinkedAt ?? null,
          telegramPromptDismissed: user?.telegramPromptDismissed ?? false,
          telegramPromptLastShown: user?.telegramPromptLastShown ?? null,
          uid: auth.currentUser.uid,
          ...(user?.dailyReminder ? { dailyReminder: user.dailyReminder } : {}),
          ...(user?.weeklyDigest ? { weeklyDigest: user.weeklyDigest } : {}),
          ...(user?.pomodoroStats ? { pomodoroStats: user.pomodoroStats } : {}),
        };
      }

      throw new Error('User not authenticated');
    }

    return user;
  }, [user]);

  const createOwnerMemberDoc = useCallback((currentUser: User, joinedViaInviteId: string): SharedMemberDoc => {
    const now = new Date().toISOString();

    return {
      email: currentUser.email,
      joinedAt: now,
      joinedViaInviteId,
      lastUpdated: now,
      name: currentUser.name,
      role: 'owner',
      uid: currentUser.uid,
    };
  }, []);

  const createSharedSpacePointerDoc = useCallback((
    targetType: ShareTarget,
    joinedAt: string
  ): SharedSpacePointerDoc => ({
    joinedAt,
    targetType,
  }), []);

  const createInviteResult = useCallback((spaceId: string, inviteId: string): ShareLinkResult => ({
    inviteId,
    spaceId,
    url: buildShareLink(inviteId),
  }), []);

  const setSharedInviteState = useCallback(async (
    spaceId: string,
    enabled: boolean,
    defaultRole?: SharedRole
  ): Promise<ShareLinkResult | null> => {
    const currentUser = assertUser();
    const space = sharedSpacesById[spaceId];

    if (!space || space.ownerId !== currentUser.uid) {
      throw new Error('Only the owner can manage the share link.');
    }

    const nextDefaultRole = defaultRole ?? space.inviteDefaultRole ?? 'viewer';

    if (!enabled) {
      const batch = writeBatch(db);

      if (space.activeInviteId) {
        batch.delete(doc(db, 'sharedInvites', space.activeInviteId));
      }

      batch.update(doc(db, 'sharedSpaces', spaceId), {
        activeInviteId: null,
        inviteDefaultRole: nextDefaultRole,
        inviteEnabled: false,
        updatedAt: new Date().toISOString(),
      });

      await batch.commit();
      return null;
    }

    if (space.activeInviteId && space.inviteEnabled) {
      const batch = writeBatch(db);

      batch.update(doc(db, 'sharedInvites', space.activeInviteId), {
        defaultRole: nextDefaultRole,
      });
      batch.update(doc(db, 'sharedSpaces', spaceId), {
        inviteDefaultRole: nextDefaultRole,
        updatedAt: new Date().toISOString(),
      });

      await batch.commit();

      return createInviteResult(spaceId, space.activeInviteId);
    }

    const inviteRef = doc(collection(db, 'sharedInvites'));
    const now = new Date().toISOString();

    const inviteDoc: SharedInviteDoc = {
      createdAt: now,
      createdBy: currentUser.uid,
      defaultRole: nextDefaultRole,
      spaceId,
      targetType: space.targetType,
    };

    const batch = writeBatch(db);
    batch.set(inviteRef, inviteDoc);
    batch.update(doc(db, 'sharedSpaces', spaceId), {
      activeInviteId: inviteRef.id,
      inviteDefaultRole: nextDefaultRole,
      inviteEnabled: true,
      updatedAt: now,
    });

    await batch.commit();

    return createInviteResult(spaceId, inviteRef.id);
  }, [assertUser, createInviteResult, sharedSpacesById]);

  const deleteSharedSpace = useCallback(async (spaceId: string): Promise<void> => {
    const currentUser = assertUser();
    const space = sharedSpacesById[spaceId];

    if (!space || space.ownerId !== currentUser.uid) {
      throw new Error('Only the owner can delete this shared item.');
    }

    const assignmentsSnapshot = await getDocs(collection(db, `sharedSpaces/${spaceId}/assignments`));
    const membersSnapshot = await getDocs(collection(db, `sharedSpaces/${spaceId}/members`));
    const refsToDelete: DocumentReference[] = [];

    assignmentsSnapshot.docs.forEach((assignmentDoc) => {
      refsToDelete.push(assignmentDoc.ref);

      membersSnapshot.docs.forEach((memberDoc) => {
        refsToDelete.push(doc(
          db,
          `sharedSpaces/${spaceId}/members/${memberDoc.id}/assignmentState`,
          assignmentDoc.id
        ));
      });
    });

    membersSnapshot.docs.forEach((memberDoc) => {
      refsToDelete.push(memberDoc.ref);
      refsToDelete.push(doc(db, `users/${memberDoc.id}/sharedSpaces`, spaceId));
    });

    if (space.activeInviteId) {
      refsToDelete.push(doc(db, 'sharedInvites', space.activeInviteId));
    }

    refsToDelete.push(doc(db, 'sharedSpaces', spaceId));

    await deleteRefsInBatches(refsToDelete);
  }, [assertUser, sharedSpacesById]);

  const addAssignment = useCallback(async (assignment: Omit<Assignment, 'id' | 'createdAt'>): Promise<void> => {
    const currentUser = assertUser();
    const subject = getSubjectById(assignment.subjectId);
    const now = new Date().toISOString();

    if (subject?.isShared && subject.sharedSpaceId) {
      if (!subject.canCreateAssignments) {
        throw new Error('You do not have permission to add assignments to this shared subject.');
      }

      const assignmentRef = doc(collection(db, `sharedSpaces/${subject.sharedSpaceId}/assignments`));
      const privateStateRef = doc(db, `sharedSpaces/${subject.sharedSpaceId}/members/${currentUser.uid}/assignmentState`, assignmentRef.id);
      const batch = writeBatch(db);

      batch.set(assignmentRef, {
        createdAt: now,
        dueDate: assignment.dueDate,
        examType: assignment.examType ?? null,
        priority: assignment.priority,
        title: assignment.title,
      } satisfies SharedAssignmentBaseDoc);

      batch.set(privateStateRef, createSharedStateFromAssignment(assignment));
      batch.update(doc(db, 'sharedSpaces', subject.sharedSpaceId), {
        updatedAt: now,
      });

      await batch.commit();
      return;
    }

    await addDoc(collection(db, `users/${currentUser.uid}/assignments`), sanitizeForFirestore({
      ...assignment,
      createdAt: now,
    }));
  }, [assertUser, getSubjectById]);

  const updateAssignment = useCallback(async (id: string, updates: Partial<Assignment>): Promise<void> => {
    const currentUser = assertUser();
    const existingAssignment = getAssignmentById(id);
    const sharedAssignmentId = parseSharedAssignmentId(id);

    if (sharedAssignmentId && existingAssignment?.sharedSpaceId && existingAssignment.sharedAssignmentId) {
      const { spaceId, assignmentId } = sharedAssignmentId;
      const sharedBaseUpdates = {} as Partial<SharedAssignmentBaseDoc>;
      const personalUpdates = {} as Partial<Assignment>;

      SHARED_BASE_FIELD_KEYS.forEach((fieldKey) => {
        const nextValue = updates[fieldKey];
        if (nextValue !== undefined) {
          sharedBaseUpdates[fieldKey] = nextValue as never;
        }
      });

      SHARED_PERSONAL_FIELD_KEYS.forEach((fieldKey) => {
        const nextValue = updates[fieldKey];
        if (nextValue !== undefined) {
          personalUpdates[fieldKey] = nextValue as never;
        }
      });

      if (Object.keys(sharedBaseUpdates).length > 0) {
        if (!existingAssignment.canEditSharedFields) {
          throw new Error('You do not have permission to edit shared assignment details.');
        }

        const sharedSpaceUpdates: Partial<SharedSpaceDoc> = {
          updatedAt: new Date().toISOString(),
        };

        if (existingAssignment.sharedTargetType === 'assignment' && sharedBaseUpdates.title) {
          sharedSpaceUpdates.title = sharedBaseUpdates.title;
        }

        const sanitizedSharedBaseUpdates = sanitizeForFirestore(sharedBaseUpdates);

        await Promise.all([
          updateDoc(doc(db, `sharedSpaces/${spaceId}/assignments`, assignmentId), sanitizedSharedBaseUpdates),
          updateDoc(doc(db, 'sharedSpaces', spaceId), sharedSpaceUpdates),
        ]);
      }

      if (Object.keys(personalUpdates).length > 0) {
        const stateDocRef = doc(db, `sharedSpaces/${spaceId}/members/${currentUser.uid}/assignmentState`, assignmentId);
        await setDoc(stateDocRef, {}, { merge: true });
        await updateDoc(
          stateDocRef,
          prepareAssignmentUpdates(
            personalUpdates,
            () => deleteField()
          ) as Record<string, FieldValue | Partial<unknown> | undefined>
        );
      }

      return;
    }

    await updateDoc(
      doc(db, `users/${currentUser.uid}/assignments`, id),
      prepareAssignmentUpdates(
        updates,
        () => deleteField()
      ) as Record<string, FieldValue | Partial<unknown> | undefined>
    );
  }, [assertUser, getAssignmentById]);

  const deleteAssignment = useCallback(async (id: string): Promise<void> => {
    const currentUser = assertUser();
    const assignment = getAssignmentById(id);
    const sharedAssignmentId = parseSharedAssignmentId(id);

    if (sharedAssignmentId && assignment?.sharedSpaceId && assignment.sharedAssignmentId) {
      if (!assignment.canDelete) {
        throw new Error('You do not have permission to delete this shared assignment.');
      }

      if (assignment.sharedTargetType === 'assignment') {
        await deleteSharedSpace(assignment.sharedSpaceId);
        return;
      }

      const membersSnapshot = await getDocs(collection(db, `sharedSpaces/${assignment.sharedSpaceId}/members`));
      const refsToDelete: DocumentReference[] = [
        doc(db, `sharedSpaces/${assignment.sharedSpaceId}/assignments`, sharedAssignmentId.assignmentId),
      ];

      membersSnapshot.docs.forEach((memberDoc) => {
        refsToDelete.push(doc(
          db,
          `sharedSpaces/${assignment.sharedSpaceId}/members/${memberDoc.id}/assignmentState`,
          sharedAssignmentId.assignmentId
        ));
      });

      await deleteRefsInBatches(refsToDelete);
      await updateDoc(doc(db, 'sharedSpaces', assignment.sharedSpaceId), {
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    await deleteDoc(doc(db, `users/${currentUser.uid}/assignments`, id));
  }, [assertUser, deleteSharedSpace, getAssignmentById]);

  const updateSubject = useCallback(async (id: string, updates: Partial<Subject>): Promise<void> => {
    const currentUser = assertUser();
    const subject = getSubjectById(id);

    if (subject?.isShared && subject.sharedSpaceId) {
      if (!subject.canEdit) {
        throw new Error('You do not have permission to edit this shared subject.');
      }

      await updateDoc(doc(db, 'sharedSpaces', subject.sharedSpaceId), {
        color: updates.color ?? subject.color,
        title: updates.name ?? subject.name,
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    await updateDoc(
      doc(db, `users/${currentUser.uid}/subjects`, id),
      sanitizeForFirestore({
        ...updates,
        lastUpdated: new Date().toISOString(),
      })
    );
  }, [assertUser, getSubjectById]);

  const deleteSubject = useCallback(async (id: string): Promise<void> => {
    const currentUser = assertUser();
    const subject = getSubjectById(id);

    if (subject?.isShared && subject.sharedSpaceId) {
      if (!subject.canDelete) {
        throw new Error('Only the owner can delete this shared subject.');
      }

      await deleteSharedSpace(subject.sharedSpaceId);
      return;
    }

    await deleteDoc(doc(db, `users/${currentUser.uid}/subjects`, id));
  }, [assertUser, deleteSharedSpace, getSubjectById]);

  const shareSubject = useCallback(async (
    subjectId: string,
    defaultRole: SharedRole
  ): Promise<ShareLinkResult> => {
    const currentUser = assertUser();
    const subject = personalSubjects.find((item) => item.id === subjectId);

    if (!subject) {
      throw new Error('Subject not found.');
    }

    const relatedAssignments = personalAssignments.filter((assignment) => assignment.subjectId === subjectId);
    const spaceRef = doc(collection(db, 'sharedSpaces'));
    const inviteRef = doc(collection(db, 'sharedInvites'));
    const ownerMemberRef = doc(db, `sharedSpaces/${spaceRef.id}/members`, currentUser.uid);
    const batch = writeBatch(db);
    const now = new Date().toISOString();

    batch.set(doc(db, 'sharedSpaces', spaceRef.id), {
      activeInviteId: inviteRef.id,
      color: subject.color,
      createdAt: subject.createdAt,
      inviteDefaultRole: defaultRole,
      inviteEnabled: true,
      ownerId: currentUser.uid,
      targetType: 'subject',
      title: subject.name,
      updatedAt: now,
    } satisfies SharedSpaceDoc);

    batch.set(inviteRef, {
      createdAt: now,
      createdBy: currentUser.uid,
      defaultRole,
      spaceId: spaceRef.id,
      targetType: 'subject',
    } satisfies SharedInviteDoc);

    batch.set(ownerMemberRef, createOwnerMemberDoc(currentUser, inviteRef.id));
    batch.set(
      doc(db, `users/${currentUser.uid}/sharedSpaces`, spaceRef.id),
      createSharedSpacePointerDoc('subject', now)
    );

    relatedAssignments.forEach((assignment) => {
      const sharedAssignmentRef = doc(db, `sharedSpaces/${spaceRef.id}/assignments`, assignment.id);
      const privateStateRef = doc(db, `sharedSpaces/${spaceRef.id}/members/${currentUser.uid}/assignmentState`, assignment.id);

      batch.set(sharedAssignmentRef, {
        createdAt: assignment.createdAt,
        dueDate: assignment.dueDate,
        examType: assignment.examType ?? null,
        priority: assignment.priority,
        title: assignment.title,
      } satisfies SharedAssignmentBaseDoc);

      batch.set(privateStateRef, createSharedStateFromAssignment(assignment));
      batch.delete(doc(db, `users/${currentUser.uid}/assignments`, assignment.id));
    });

    batch.delete(doc(db, `users/${currentUser.uid}/subjects`, subject.id));

    await batch.commit();

    return createInviteResult(spaceRef.id, inviteRef.id);
  }, [assertUser, createInviteResult, createOwnerMemberDoc, createSharedSpacePointerDoc, personalAssignments, personalSubjects]);

  const shareAssignment = useCallback(async (
    assignmentId: string,
    defaultRole: SharedRole
  ): Promise<ShareLinkResult> => {
    const currentUser = assertUser();
    const assignment = personalAssignments.find((item) => item.id === assignmentId);

    if (!assignment) {
      throw new Error('Assignment not found.');
    }

    const subject = personalSubjects.find((item) => item.id === assignment.subjectId);
    const subjectSnapshot: SubjectSnapshot = {
      color: subject?.color ?? DEFAULT_SUBJECT_COLOR,
      name: subject?.name ?? 'Shared task',
    };

    const spaceRef = doc(collection(db, 'sharedSpaces'));
    const inviteRef = doc(collection(db, 'sharedInvites'));
    const ownerMemberRef = doc(db, `sharedSpaces/${spaceRef.id}/members`, currentUser.uid);
    const privateStateRef = doc(db, `sharedSpaces/${spaceRef.id}/members/${currentUser.uid}/assignmentState`, assignment.id);
    const batch = writeBatch(db);
    const now = new Date().toISOString();

    batch.set(doc(db, 'sharedSpaces', spaceRef.id), {
      activeInviteId: inviteRef.id,
      createdAt: assignment.createdAt,
      inviteDefaultRole: defaultRole,
      inviteEnabled: true,
      ownerId: currentUser.uid,
      targetType: 'assignment',
      title: assignment.title,
      updatedAt: now,
    } satisfies SharedSpaceDoc);

    batch.set(inviteRef, {
      createdAt: now,
      createdBy: currentUser.uid,
      defaultRole,
      spaceId: spaceRef.id,
      targetType: 'assignment',
    } satisfies SharedInviteDoc);

    batch.set(ownerMemberRef, createOwnerMemberDoc(currentUser, inviteRef.id));
    batch.set(
      doc(db, `users/${currentUser.uid}/sharedSpaces`, spaceRef.id),
      createSharedSpacePointerDoc('assignment', now)
    );
    batch.set(doc(db, `sharedSpaces/${spaceRef.id}/assignments`, assignment.id), {
      createdAt: assignment.createdAt,
      dueDate: assignment.dueDate,
      examType: assignment.examType ?? null,
      priority: assignment.priority,
      subjectSnapshot,
      title: assignment.title,
    } satisfies SharedAssignmentBaseDoc);
    batch.set(privateStateRef, createSharedStateFromAssignment(assignment));
    batch.delete(doc(db, `users/${currentUser.uid}/assignments`, assignment.id));

    await batch.commit();

    return createInviteResult(spaceRef.id, inviteRef.id);
  }, [assertUser, createInviteResult, createOwnerMemberDoc, createSharedSpacePointerDoc, personalAssignments, personalSubjects]);

  const joinSharedSpace = useCallback(async (inviteId: string): Promise<JoinedSharedSpaceResult> => {
    const currentUser = assertUser();
    const inviteSnapshot = await getDoc(doc(db, 'sharedInvites', inviteId));

    if (!inviteSnapshot.exists()) {
      throw new Error('This invite link is no longer valid.');
    }

    const invite = inviteSnapshot.data() as SharedInviteDoc;
    const memberRef = doc(db, `sharedSpaces/${invite.spaceId}/members`, currentUser.uid);
    const pointerRef = doc(db, `users/${currentUser.uid}/sharedSpaces`, invite.spaceId);
    const existingPointer = await getDoc(pointerRef);
    const existingMembership = await getDoc(memberRef).catch(() => null);
    const now = new Date().toISOString();

    if (existingPointer.exists() && existingMembership?.exists()) {
      return {
        spaceId: invite.spaceId,
        targetType: invite.targetType,
      };
    }

    const batch = writeBatch(db);

    batch.set(memberRef, {
      email: currentUser.email,
      joinedAt: now,
      joinedViaInviteId: inviteId,
      lastUpdated: now,
      name: currentUser.name,
      role: invite.defaultRole,
      uid: currentUser.uid,
    } satisfies SharedMemberDoc);
    batch.set(
      pointerRef,
      createSharedSpacePointerDoc(invite.targetType, now)
    );

    try {
      await batch.commit();
      return {
        spaceId: invite.spaceId,
        targetType: invite.targetType,
      };
    } catch (joinError) {
      const existingMembershipAfterFailure = await getDoc(memberRef).catch(() => null);

      if (existingMembershipAfterFailure?.exists()) {
        const existingMember = existingMembershipAfterFailure.data() as SharedMemberDoc;

        await setDoc(
          pointerRef,
          createSharedSpacePointerDoc(invite.targetType, existingMember.joinedAt || now),
          { merge: true }
        );
        return {
          spaceId: invite.spaceId,
          targetType: invite.targetType,
        };
      }

      const errorCode = (joinError as FirestoreErrorLike)?.code;

      if (errorCode === 'permission-denied') {
        throw new Error('This invite link is no longer valid.');
      }

      throw joinError;
    }
  }, [assertUser, createSharedSpacePointerDoc]);

  const updateSharedMemberRole = useCallback(async (
    spaceId: string,
    memberUid: string,
    role: SharedRole
  ): Promise<void> => {
    const currentUser = assertUser();
    const space = sharedSpacesById[spaceId];

    if (!space || space.ownerId !== currentUser.uid) {
      throw new Error('Only the owner can update member roles.');
    }

    if (memberUid === currentUser.uid) {
      throw new Error('The owner role cannot be changed.');
    }

    const now = new Date().toISOString();
    const batch = writeBatch(db);

    batch.update(doc(db, `sharedSpaces/${spaceId}/members`, memberUid), {
      lastUpdated: now,
      role,
    });
    batch.set(
      doc(db, `users/${memberUid}/sharedSpaces`, spaceId),
      createSharedSpacePointerDoc(space.targetType, now),
      { merge: true }
    );

    await batch.commit();
  }, [assertUser, createSharedSpacePointerDoc, sharedSpacesById]);

  const removeSharedMember = useCallback(async (spaceId: string, memberUid: string): Promise<void> => {
    const currentUser = assertUser();
    const space = sharedSpacesById[spaceId];

    if (!space || space.ownerId !== currentUser.uid) {
      throw new Error('Only the owner can remove members.');
    }

    if (memberUid === currentUser.uid) {
      throw new Error('The owner cannot remove themselves.');
    }

    const privateStateSnapshot = await getDocs(collection(db, `sharedSpaces/${spaceId}/members/${memberUid}/assignmentState`));
    const refsToDelete: DocumentReference[] = [
      ...privateStateSnapshot.docs.map((stateDoc) => stateDoc.ref),
      doc(db, `sharedSpaces/${spaceId}/members`, memberUid),
      doc(db, `users/${memberUid}/sharedSpaces`, spaceId),
    ];

    await deleteRefsInBatches(refsToDelete);
  }, [assertUser, sharedSpacesById]);

  const getSharedMembers = useCallback(
    (spaceId: string): SharedMember[] => sharedMembersBySpace[spaceId] ?? [],
    [sharedMembersBySpace]
  );

  return {
    assignments,
    subjects,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    updateSubject,
    deleteSubject,
    shareSubject,
    shareAssignment,
    joinSharedSpace,
    updateSharedMemberRole,
    removeSharedMember,
    setSharedInviteState,
    getSharedMembers,
  };
};
