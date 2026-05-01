type LockResult = { ok: boolean; message: string; lockedBy?: string; degradedToDemo?: boolean };

export async function acquireDocumentLock(_documentId: string, _userId: string): Promise<LockResult> {
  return { ok: true, message: 'Lock simulated in demo mode.', degradedToDemo: true };
}

export async function releaseDocumentLock(_documentId: string, _userId: string): Promise<LockResult> {
  return { ok: true, message: 'Unlock simulated in demo mode.', degradedToDemo: true };
}
