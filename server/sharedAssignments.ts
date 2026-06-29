import type admin from 'firebase-admin';
import type { AssignmentDoc } from './telegram/types.js';

type Firestore = admin.firestore.Firestore;
type DocumentReference = admin.firestore.DocumentReference;

type ShareTarget = 'subject' | 'assignment';
type SharedRole = 'owner' | 'editor' | 'viewer';

interface SharedSpaceDoc {
    activeInviteId?: string | null;
    color?: string;
    ownerId: string;
    targetType: ShareTarget;
    title: string;
}

interface SharedMemberDoc {
    role: SharedRole;
}

interface SubjectSnapshot {
    color: string;
    name: string;
}

interface SharedAssignmentBaseDoc {
    createdAt: string;
    dueDate: string;
    examType?: 'midterm' | 'final' | null;
    priority: AssignmentDoc['priority'];
    subjectSnapshot?: SubjectSnapshot | null;
    title: string;
}

interface SharedAssignmentStateDoc {
    description?: string;
    reminder?: AssignmentDoc['reminder'];
    status?: AssignmentDoc['status'];
}

interface SubjectDoc {
    color: string;
    name: string;
}

export interface UserAssignmentRecord extends AssignmentDoc {
    canDelete: boolean;
    canEditSharedFields: boolean;
    ref: DocumentReference;
    sharedAssignmentId?: string;
    sharedRole?: SharedRole;
    sharedSpaceId?: string;
    sharedTargetType?: ShareTarget;
    source: 'personal' | 'shared';
    stateRef?: DocumentReference;
    subjectColor?: string;
    subjectName?: string;
}

const SHARED_ASSIGNMENT_ID_PREFIX = 'shared';
const SHARED_ASSIGNMENT_ID_DELIMITER = '::';
const DELETE_BATCH_LIMIT = 400;

const createSharedAssignmentId = (spaceId: string, assignmentId: string): string => (
    `${SHARED_ASSIGNMENT_ID_PREFIX}${SHARED_ASSIGNMENT_ID_DELIMITER}${spaceId}${SHARED_ASSIGNMENT_ID_DELIMITER}${assignmentId}`
);

const parseSharedAssignmentId = (
    id: string
): { assignmentId: string; spaceId: string } | null => {
    const [prefix, spaceId, assignmentId] = id.split(SHARED_ASSIGNMENT_ID_DELIMITER);

    if (
        prefix !== SHARED_ASSIGNMENT_ID_PREFIX ||
        !spaceId ||
        !assignmentId
    ) {
        return null;
    }

    return { assignmentId, spaceId };
};

const sortByDueDate = (left: AssignmentDoc, right: AssignmentDoc): number => (
    new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime()
);

const chunkRefs = <T,>(items: T[], size: number): T[][] => {
    const chunks: T[][] = [];

    for (let index = 0; index < items.length; index += size) {
        chunks.push(items.slice(index, index + size));
    }

    return chunks;
};

const deleteRefsInBatches = async (
    db: Firestore,
    refs: DocumentReference[]
): Promise<void> => {
    for (const batchRefs of chunkRefs(refs, DELETE_BATCH_LIMIT)) {
        const batch = db.batch();

        batchRefs.forEach((ref) => {
            batch.delete(ref);
        });

        await batch.commit();
    }
};

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

const getParticipantIds = (
    ownerId: string,
    memberIds: string[]
): string[] => Array.from(new Set([...memberIds, ownerId]));

const getPersonalSubjectsById = async (
    db: Firestore,
    userUid: string
): Promise<Map<string, SubjectDoc>> => {
    const subjectsSnapshot = await db.collection(`users/${userUid}/subjects`).get();
    const subjectsById = new Map<string, SubjectDoc>();

    subjectsSnapshot.docs.forEach((subjectDoc) => {
        subjectsById.set(subjectDoc.id, subjectDoc.data() as SubjectDoc);
    });

    return subjectsById;
};

const buildPersonalAssignmentRecord = (
    assignmentRef: DocumentReference,
    assignmentId: string,
    assignmentData: FirebaseFirestore.DocumentData,
    subject?: SubjectDoc
): UserAssignmentRecord => ({
    canDelete: true,
    canEditSharedFields: true,
    createdAt: assignmentData.createdAt,
    description: assignmentData.description,
    dueDate: assignmentData.dueDate,
    id: assignmentId,
    priority: assignmentData.priority,
    ref: assignmentRef,
    reminder: assignmentData.reminder,
    source: 'personal',
    status: assignmentData.status,
    subjectColor: subject?.color,
    subjectId: assignmentData.subjectId,
    subjectName: subject?.name,
    title: assignmentData.title,
}) satisfies UserAssignmentRecord;

const buildSharedAssignmentRecord = (
    db: Firestore,
    userUid: string,
    spaceId: string,
    space: SharedSpaceDoc,
    role: SharedRole,
    assignmentRef: DocumentReference,
    assignmentId: string,
    baseAssignment: SharedAssignmentBaseDoc,
    privateState?: SharedAssignmentStateDoc
): UserAssignmentRecord => {
    const canEditSharedFields = role === 'owner' || role === 'editor';

    return {
        canDelete: space.targetType === 'assignment'
            ? role === 'owner'
            : canEditSharedFields,
        canEditSharedFields,
        createdAt: baseAssignment.createdAt,
        description: privateState?.description,
        dueDate: baseAssignment.dueDate,
        id: createSharedAssignmentId(spaceId, assignmentId),
        priority: baseAssignment.priority,
        ref: assignmentRef,
        reminder: privateState?.reminder,
        sharedAssignmentId: assignmentId,
        sharedRole: role,
        sharedSpaceId: spaceId,
        sharedTargetType: space.targetType,
        source: 'shared',
        stateRef: db.doc(`sharedSpaces/${spaceId}/members/${userUid}/assignmentState/${assignmentId}`),
        status: privateState?.status ?? 'Pending',
        subjectColor: space.targetType === 'subject'
            ? space.color
            : baseAssignment.subjectSnapshot?.color,
        subjectId: space.targetType === 'subject' ? spaceId : '',
        subjectName: space.targetType === 'subject'
            ? space.title
            : baseAssignment.subjectSnapshot?.name,
        title: baseAssignment.title,
    } satisfies UserAssignmentRecord;
};

const listSharedAssignmentRecords = async (
    db: Firestore,
    userUid: string,
    options: { reminderEnabledOnly?: boolean } = {}
): Promise<UserAssignmentRecord[]> => {
    const sharedPointersSnapshot = await db.collection(`users/${userUid}/sharedSpaces`).get();

    if (sharedPointersSnapshot.empty) {
        return [];
    }

    const { reminderEnabledOnly = false } = options;
    const sharedGroups = await Promise.all(sharedPointersSnapshot.docs.map(async (sharedPointerDoc) => {
        const spaceId = sharedPointerDoc.id;
        const stateQuery = reminderEnabledOnly
            ? db.collection(`sharedSpaces/${spaceId}/members/${userUid}/assignmentState`).where('reminder.enabled', '==', true)
            : db.collection(`sharedSpaces/${spaceId}/members/${userUid}/assignmentState`);
        const [spaceSnapshot, memberSnapshot, stateSnapshot] = await Promise.all([
            db.doc(`sharedSpaces/${spaceId}`).get(),
            db.doc(`sharedSpaces/${spaceId}/members/${userUid}`).get(),
            stateQuery.get(),
        ]);

        if (!spaceSnapshot.exists) {
            return [] as UserAssignmentRecord[];
        }

        const space = spaceSnapshot.data() as SharedSpaceDoc;
        const role: SharedRole | undefined = space.ownerId === userUid
            ? 'owner'
            : memberSnapshot.exists
                ? (memberSnapshot.data() as SharedMemberDoc).role
                : undefined;

        if (!role) {
            return [] as UserAssignmentRecord[];
        }

        const privateStateByAssignmentId = new Map<string, SharedAssignmentStateDoc>();
        stateSnapshot.docs.forEach((stateDoc) => {
            privateStateByAssignmentId.set(stateDoc.id, stateDoc.data() as SharedAssignmentStateDoc);
        });

        if (reminderEnabledOnly && privateStateByAssignmentId.size === 0) {
            return [] as UserAssignmentRecord[];
        }

        if (reminderEnabledOnly) {
            const assignmentRefs = stateSnapshot.docs.map((stateDoc) => (
                db.doc(`sharedSpaces/${spaceId}/assignments/${stateDoc.id}`)
            ));

            const assignmentSnapshots = assignmentRefs.length > 0
                ? await db.getAll(...assignmentRefs)
                : [];

            return assignmentSnapshots
                .filter((assignmentDoc) => assignmentDoc.exists)
                .map((assignmentDoc) => buildSharedAssignmentRecord(
                    db,
                    userUid,
                    spaceId,
                    space,
                    role,
                    assignmentDoc.ref,
                    assignmentDoc.id,
                    assignmentDoc.data() as SharedAssignmentBaseDoc,
                    privateStateByAssignmentId.get(assignmentDoc.id)
                ));
        }

        const assignmentsSnapshot = await db.collection(`sharedSpaces/${spaceId}/assignments`).get();

        return assignmentsSnapshot.docs.map((assignmentDoc) => buildSharedAssignmentRecord(
            db,
            userUid,
            spaceId,
            space,
            role,
            assignmentDoc.ref,
            assignmentDoc.id,
            assignmentDoc.data() as SharedAssignmentBaseDoc,
            privateStateByAssignmentId.get(assignmentDoc.id)
        ));
    }));

    return sharedGroups.flat().sort(sortByDueDate);
};

export const listUserAssignmentRecords = async (
    db: Firestore,
    userUid: string
): Promise<UserAssignmentRecord[]> => {
    const [personalSubjectsById, personalAssignmentsSnapshot, sharedAssignments] = await Promise.all([
        getPersonalSubjectsById(db, userUid),
        db.collection(`users/${userUid}/assignments`).orderBy('dueDate', 'asc').get(),
        listSharedAssignmentRecords(db, userUid),
    ]);

    const personalAssignments = personalAssignmentsSnapshot.docs.map((assignmentDoc) => buildPersonalAssignmentRecord(
        assignmentDoc.ref,
        assignmentDoc.id,
        assignmentDoc.data(),
        personalSubjectsById.get(assignmentDoc.data().subjectId as string)
    ));

    return [...personalAssignments, ...sharedAssignments].sort(sortByDueDate);
};

export const listUserReminderRecords = async (
    db: Firestore,
    userUid: string
): Promise<UserAssignmentRecord[]> => {
    const [personalSubjectsById, personalAssignmentsSnapshot, sharedAssignments] = await Promise.all([
        getPersonalSubjectsById(db, userUid),
        db.collection(`users/${userUid}/assignments`)
            .where('reminder.enabled', '==', true)
            .get(),
        listSharedAssignmentRecords(db, userUid, { reminderEnabledOnly: true }),
    ]);

    const personalAssignments = personalAssignmentsSnapshot.docs.map((assignmentDoc) => buildPersonalAssignmentRecord(
        assignmentDoc.ref,
        assignmentDoc.id,
        assignmentDoc.data(),
        personalSubjectsById.get(assignmentDoc.data().subjectId as string)
    ));

    return [...personalAssignments, ...sharedAssignments].sort(sortByDueDate);
};

export const getUserAssignmentRecord = async (
    db: Firestore,
    userUid: string,
    assignmentId: string
): Promise<UserAssignmentRecord | null> => {
    const sharedAssignmentId = parseSharedAssignmentId(assignmentId);

    if (!sharedAssignmentId) {
        const [assignmentSnapshot, personalSubjectsById] = await Promise.all([
            db.doc(`users/${userUid}/assignments/${assignmentId}`).get(),
            getPersonalSubjectsById(db, userUid),
        ]);

        if (!assignmentSnapshot.exists) {
            return null;
        }

        const assignmentData = assignmentSnapshot.data() as FirebaseFirestore.DocumentData;

        return buildPersonalAssignmentRecord(
            assignmentSnapshot.ref,
            assignmentSnapshot.id,
            assignmentData,
            personalSubjectsById.get(assignmentData.subjectId as string)
        );
    }

    const { assignmentId: baseAssignmentId, spaceId } = sharedAssignmentId;
    const [spaceSnapshot, memberSnapshot, assignmentSnapshot, stateSnapshot] = await Promise.all([
        db.doc(`sharedSpaces/${spaceId}`).get(),
        db.doc(`sharedSpaces/${spaceId}/members/${userUid}`).get(),
        db.doc(`sharedSpaces/${spaceId}/assignments/${baseAssignmentId}`).get(),
        db.doc(`sharedSpaces/${spaceId}/members/${userUid}/assignmentState/${baseAssignmentId}`).get(),
    ]);

    if (!spaceSnapshot.exists || !assignmentSnapshot.exists) {
        return null;
    }

    const space = spaceSnapshot.data() as SharedSpaceDoc;
    const role: SharedRole | undefined = space.ownerId === userUid
        ? 'owner'
        : memberSnapshot.exists
            ? (memberSnapshot.data() as SharedMemberDoc).role
            : undefined;

    if (!role) {
        return null;
    }

    return buildSharedAssignmentRecord(
        db,
        userUid,
        spaceId,
        space,
        role,
        assignmentSnapshot.ref,
        assignmentSnapshot.id,
        assignmentSnapshot.data() as SharedAssignmentBaseDoc,
        stateSnapshot.exists ? (stateSnapshot.data() as SharedAssignmentStateDoc) : undefined
    );
};

export const updateUserAssignmentRecord = async (
    db: Firestore,
    userUid: string,
    assignmentId: string,
    updates: Partial<Pick<AssignmentDoc, 'description' | 'dueDate' | 'priority' | 'reminder' | 'status' | 'title'>>
): Promise<void> => {
    const record = await getUserAssignmentRecord(db, userUid, assignmentId);

    if (!record) {
        throw new Error('Assignment not found.');
    }

    if (record.source === 'personal') {
        await record.ref.update(
            sanitizeForFirestore(updates) as FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData>
        );
        return;
    }

    const sharedUpdates: Record<string, unknown> = {};
    const personalUpdates: Record<string, unknown> = {};

    if (updates.title !== undefined) {
        sharedUpdates.title = updates.title;
    }
    if (updates.dueDate !== undefined) {
        sharedUpdates.dueDate = updates.dueDate;
    }
    if (updates.priority !== undefined) {
        sharedUpdates.priority = updates.priority;
    }

    if (updates.description !== undefined) {
        personalUpdates.description = updates.description;
    }
    if (updates.reminder !== undefined) {
        personalUpdates.reminder = updates.reminder;
    }
    if (updates.status !== undefined) {
        personalUpdates.status = updates.status;
    }

    if (Object.keys(sharedUpdates).length > 0) {
        if (!record.canEditSharedFields || !record.sharedSpaceId) {
            throw new Error('You do not have permission to edit shared assignment details.');
        }

        const batch = db.batch();
        batch.update(
            record.ref,
            sanitizeForFirestore(sharedUpdates) as FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData>
        );

        const sharedSpaceUpdates: Record<string, unknown> = {
            updatedAt: new Date().toISOString(),
        };

        if (record.sharedTargetType === 'assignment' && typeof updates.title === 'string') {
            sharedSpaceUpdates.title = updates.title;
        }

        batch.update(
            db.doc(`sharedSpaces/${record.sharedSpaceId}`),
            sanitizeForFirestore(sharedSpaceUpdates) as FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData>
        );
        await batch.commit();
    }

    if (Object.keys(personalUpdates).length > 0) {
        if (!record.stateRef) {
            throw new Error('Missing shared assignment state reference.');
        }

        const sanitizedPersonalUpdates = sanitizeForFirestore(personalUpdates);

        await record.stateRef.set(sanitizedPersonalUpdates, {
            mergeFields: Object.keys(sanitizedPersonalUpdates),
        });
    }
};

const deleteSharedSpace = async (
    db: Firestore,
    spaceId: string,
    userUid: string
): Promise<void> => {
    const spaceSnapshot = await db.doc(`sharedSpaces/${spaceId}`).get();

    if (!spaceSnapshot.exists) {
        return;
    }

    const space = spaceSnapshot.data() as SharedSpaceDoc;

    if (space.ownerId !== userUid) {
        throw new Error('Only the owner can delete this shared item.');
    }

    const assignmentsSnapshot = await db.collection(`sharedSpaces/${spaceId}/assignments`).get();
    const membersSnapshot = await db.collection(`sharedSpaces/${spaceId}/members`).get();
    const participantIds = getParticipantIds(
        space.ownerId,
        membersSnapshot.docs.map((memberDoc) => memberDoc.id)
    );
    const refsToDelete: DocumentReference[] = [];

    assignmentsSnapshot.docs.forEach((assignmentDoc) => {
        refsToDelete.push(assignmentDoc.ref);

        participantIds.forEach((participantId) => {
            refsToDelete.push(db.doc(
                `sharedSpaces/${spaceId}/members/${participantId}/assignmentState/${assignmentDoc.id}`
            ));
        });
    });

    membersSnapshot.docs.forEach((memberDoc) => {
        refsToDelete.push(memberDoc.ref);
    });
    participantIds.forEach((participantId) => {
        refsToDelete.push(db.doc(`users/${participantId}/sharedSpaces/${spaceId}`));
    });

    if (space.activeInviteId) {
        refsToDelete.push(db.doc(`sharedInvites/${space.activeInviteId}`));
    }

    refsToDelete.push(spaceSnapshot.ref);
    await deleteRefsInBatches(db, refsToDelete);
};

export const deleteUserAssignmentRecord = async (
    db: Firestore,
    userUid: string,
    assignmentId: string
): Promise<void> => {
    const record = await getUserAssignmentRecord(db, userUid, assignmentId);

    if (!record) {
        throw new Error('Assignment not found.');
    }

    if (record.source === 'personal') {
        await record.ref.delete();
        return;
    }

    if (!record.canDelete || !record.sharedSpaceId || !record.sharedAssignmentId) {
        throw new Error('You do not have permission to delete this shared assignment.');
    }

    if (record.sharedTargetType === 'assignment') {
        await deleteSharedSpace(db, record.sharedSpaceId, userUid);
        return;
    }

    const [spaceSnapshot, membersSnapshot] = await Promise.all([
        db.doc(`sharedSpaces/${record.sharedSpaceId}`).get(),
        db.collection(`sharedSpaces/${record.sharedSpaceId}/members`).get(),
    ]);
    const space = spaceSnapshot.data() as SharedSpaceDoc | undefined;
    const participantIds = getParticipantIds(
        space?.ownerId ?? userUid,
        membersSnapshot.docs.map((memberDoc) => memberDoc.id)
    );
    const refsToDelete: DocumentReference[] = [record.ref];

    participantIds.forEach((participantId) => {
        refsToDelete.push(db.doc(
            `sharedSpaces/${record.sharedSpaceId}/members/${participantId}/assignmentState/${record.sharedAssignmentId}`
        ));
    });

    await deleteRefsInBatches(db, refsToDelete);
    await db.doc(`sharedSpaces/${record.sharedSpaceId}`).update({
        updatedAt: new Date().toISOString(),
    });
};
