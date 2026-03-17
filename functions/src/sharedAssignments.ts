import * as admin from "firebase-admin";

type Firestore = admin.firestore.Firestore;

type ShareTarget = "subject" | "assignment";
type SharedRole = "owner" | "editor" | "viewer";

interface Reminder {
    enabled: boolean;
    preset: string;
    customMinutes?: number;
    customTime?: string;
    sentAt?: string;
}

interface AssignmentRecord {
    createdAt: string;
    id: string;
    priority: string;
    title: string;
    dueDate: string;
    reminder?: Reminder;
    status: string;
}

interface SharedSpaceDoc {
    ownerId: string;
    targetType: ShareTarget;
}

interface SharedMemberDoc {
    role: SharedRole;
}

interface SharedAssignmentBaseDoc {
    createdAt: string;
    dueDate: string;
    priority: string;
    title: string;
}

interface SharedAssignmentStateDoc {
    reminder?: Reminder;
    status?: string;
}

const SHARED_ASSIGNMENT_ID_PREFIX = "shared";
const SHARED_ASSIGNMENT_ID_DELIMITER = "::";

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

export async function listUserAssignments(
    db: Firestore,
    userUid: string
): Promise<AssignmentRecord[]> {
    const [personalAssignmentsSnapshot, sharedPointersSnapshot] = await Promise.all([
        db.collection(`users/${userUid}/assignments`).orderBy("dueDate", "asc").get(),
        db.collection(`users/${userUid}/sharedSpaces`).get(),
    ]);

    const personalAssignments = personalAssignmentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<AssignmentRecord, "id">),
    }));

    const sharedGroups = await Promise.all(sharedPointersSnapshot.docs.map(async (sharedPointerDoc) => {
        const spaceId = sharedPointerDoc.id;
        const [spaceSnapshot, memberSnapshot, assignmentsSnapshot, stateSnapshot] = await Promise.all([
            db.doc(`sharedSpaces/${spaceId}`).get(),
            db.doc(`sharedSpaces/${spaceId}/members/${userUid}`).get(),
            db.collection(`sharedSpaces/${spaceId}/assignments`).get(),
            db.collection(`sharedSpaces/${spaceId}/members/${userUid}/assignmentState`).get(),
        ]);

        if (!spaceSnapshot.exists) {
            return [] as AssignmentRecord[];
        }

        const space = spaceSnapshot.data() as SharedSpaceDoc;
        const role: SharedRole | undefined = space.ownerId === userUid
            ? "owner"
            : memberSnapshot.exists
                ? (memberSnapshot.data() as SharedMemberDoc).role
                : undefined;

        if (!role) {
            return [] as AssignmentRecord[];
        }

        const privateStateByAssignmentId = new Map<string, SharedAssignmentStateDoc>();
        stateSnapshot.docs.forEach((stateDoc) => {
            privateStateByAssignmentId.set(stateDoc.id, stateDoc.data() as SharedAssignmentStateDoc);
        });

        return assignmentsSnapshot.docs.map((assignmentDoc) => {
            const baseAssignment = assignmentDoc.data() as SharedAssignmentBaseDoc;
            const privateState = privateStateByAssignmentId.get(assignmentDoc.id);

            return {
                createdAt: baseAssignment.createdAt,
                dueDate: baseAssignment.dueDate,
                id: createSharedAssignmentId(spaceId, assignmentDoc.id),
                priority: baseAssignment.priority,
                reminder: privateState?.reminder,
                status: privateState?.status ?? "Pending",
                title: baseAssignment.title,
            } satisfies AssignmentRecord;
        });
    }));

    return [...personalAssignments, ...sharedGroups.flat()].sort(
        (left, right) => new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime()
    );
}

export async function markReminderSent(
    db: Firestore,
    userUid: string,
    assignmentId: string,
    sentAt: string
): Promise<void> {
    const sharedAssignmentId = parseSharedAssignmentId(assignmentId);

    if (!sharedAssignmentId) {
        await db.doc(`users/${userUid}/assignments/${assignmentId}`).update({
            "reminder.sentAt": sentAt
        });
        return;
    }

    const assignment = (await listUserAssignments(db, userUid)).find((item) => item.id === assignmentId);
    if (!assignment?.reminder) {
        return;
    }

    await db.doc(
        `sharedSpaces/${sharedAssignmentId.spaceId}/members/${userUid}/assignmentState/${sharedAssignmentId.assignmentId}`
    ).set({
        reminder: {
            ...assignment.reminder,
            sentAt,
        }
    }, { merge: true });
}
