"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUserAssignments = listUserAssignments;
exports.markReminderSent = markReminderSent;
const SHARED_ASSIGNMENT_ID_PREFIX = "shared";
const SHARED_ASSIGNMENT_ID_DELIMITER = "::";
const createSharedAssignmentId = (spaceId, assignmentId) => (`${SHARED_ASSIGNMENT_ID_PREFIX}${SHARED_ASSIGNMENT_ID_DELIMITER}${spaceId}${SHARED_ASSIGNMENT_ID_DELIMITER}${assignmentId}`);
const parseSharedAssignmentId = (id) => {
    const [prefix, spaceId, assignmentId] = id.split(SHARED_ASSIGNMENT_ID_DELIMITER);
    if (prefix !== SHARED_ASSIGNMENT_ID_PREFIX ||
        !spaceId ||
        !assignmentId) {
        return null;
    }
    return { assignmentId, spaceId };
};
async function listUserAssignments(db, userUid) {
    const [personalAssignmentsSnapshot, sharedPointersSnapshot] = await Promise.all([
        db.collection(`users/${userUid}/assignments`).orderBy("dueDate", "asc").get(),
        db.collection(`users/${userUid}/sharedSpaces`).get(),
    ]);
    const personalAssignments = personalAssignmentsSnapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
    const sharedGroups = await Promise.all(sharedPointersSnapshot.docs.map(async (sharedPointerDoc) => {
        const spaceId = sharedPointerDoc.id;
        const [spaceSnapshot, memberSnapshot, assignmentsSnapshot, stateSnapshot] = await Promise.all([
            db.doc(`sharedSpaces/${spaceId}`).get(),
            db.doc(`sharedSpaces/${spaceId}/members/${userUid}`).get(),
            db.collection(`sharedSpaces/${spaceId}/assignments`).get(),
            db.collection(`sharedSpaces/${spaceId}/members/${userUid}/assignmentState`).get(),
        ]);
        if (!spaceSnapshot.exists) {
            return [];
        }
        const space = spaceSnapshot.data();
        const role = space.ownerId === userUid
            ? "owner"
            : memberSnapshot.exists
                ? memberSnapshot.data().role
                : undefined;
        if (!role) {
            return [];
        }
        const privateStateByAssignmentId = new Map();
        stateSnapshot.docs.forEach((stateDoc) => {
            privateStateByAssignmentId.set(stateDoc.id, stateDoc.data());
        });
        return assignmentsSnapshot.docs.map((assignmentDoc) => {
            var _a;
            const baseAssignment = assignmentDoc.data();
            const privateState = privateStateByAssignmentId.get(assignmentDoc.id);
            return {
                createdAt: baseAssignment.createdAt,
                dueDate: baseAssignment.dueDate,
                id: createSharedAssignmentId(spaceId, assignmentDoc.id),
                priority: baseAssignment.priority,
                reminder: privateState === null || privateState === void 0 ? void 0 : privateState.reminder,
                status: (_a = privateState === null || privateState === void 0 ? void 0 : privateState.status) !== null && _a !== void 0 ? _a : "Pending",
                title: baseAssignment.title,
            };
        });
    }));
    return [...personalAssignments, ...sharedGroups.flat()].sort((left, right) => new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime());
}
async function markReminderSent(db, userUid, assignmentId, sentAt) {
    const sharedAssignmentId = parseSharedAssignmentId(assignmentId);
    if (!sharedAssignmentId) {
        await db.doc(`users/${userUid}/assignments/${assignmentId}`).update({
            "reminder.sentAt": sentAt
        });
        return;
    }
    const assignment = (await listUserAssignments(db, userUid)).find((item) => item.id === assignmentId);
    if (!(assignment === null || assignment === void 0 ? void 0 : assignment.reminder)) {
        return;
    }
    await db.doc(`sharedSpaces/${sharedAssignmentId.spaceId}/members/${userUid}/assignmentState/${sharedAssignmentId.assignmentId}`).set({
        reminder: Object.assign(Object.assign({}, assignment.reminder), { sentAt })
    }, { merge: true });
}
//# sourceMappingURL=sharedAssignments.js.map