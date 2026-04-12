const functions = require('firebase-functions');
const admin     = require('firebase-admin');

admin.initializeApp();

const db   = admin.firestore();
const auth = admin.auth();

// ── Guard: verifica que el llamador sea super_admin ───────────────
async function assertSuperAdmin(context) {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'No autenticado.');
  }
  const doc = await db.collection('usuarios').doc(context.auth.uid).get();
  if (!doc.exists || doc.data().role !== 'super_admin') {
    throw new functions.https.HttpsError('permission-denied', 'Solo el super admin puede realizar esta acción.');
  }
}

// ── createWorkspaceAdmin ──────────────────────────────────────────
// Crea la cuenta de Firebase Auth + documento en Firestore.
// El correo de invitación lo envía el cliente con sendPasswordResetEmail.
exports.createWorkspaceAdmin = functions.https.onCall(async (data, context) => {
  await assertSuperAdmin(context);

  const nombre = (data.nombre || '').trim();
  const email  = (data.email  || '').trim();

  if (!nombre || !email) {
    throw new functions.https.HttpsError('invalid-argument', 'Nombre y email son requeridos.');
  }

  // Crear cuenta en Firebase Auth
  let userRecord;
  try {
    userRecord = await auth.createUser({ email });
  } catch (e) {
    if (e.code === 'auth/email-already-exists') {
      throw new functions.https.HttpsError('already-exists', 'Ese email ya tiene una cuenta registrada.');
    }
    throw new functions.https.HttpsError('internal', 'Error al crear la cuenta: ' + e.message);
  }

  // Guardar documento en Firestore
  await db.collection('usuarios').doc(userRecord.uid).set({
    nombre,
    email,
    role:     'admin',
    activo:   true,
    creadoEn: admin.firestore.FieldValue.serverTimestamp()
  });

  return { uid: userRecord.uid, email };
});

// ── dispatchWebhook ───────────────────────────────────────────────
// Lee webhookUrl del workspace del llamador y hace POST con el payload.
exports.dispatchWebhook = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'No autenticado.');
  }
  const uid = context.auth.uid;
  const wsDoc = await db.collection('workspaces').doc(uid).get();
  const webhookUrl = wsDoc.exists ? wsDoc.data().webhookUrl : null;
  if (!webhookUrl) return { skipped: true };

  const payload = {
    event:       data.event,
    timestamp:   new Date().toISOString(),
    workspaceId: uid,
    data:        data.payload || {}
  };

  try {
    const res = await fetch(webhookUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    return { status: res.status };
  } catch (e) {
    throw new functions.https.HttpsError('internal', 'Error al enviar webhook: ' + e.message);
  }
});

// ── onPlanUpdatedByTeam ───────────────────────────────────────────
// Firestore trigger: dispara el webhook cuando el equipo actualiza un plan.
exports.onPlanUpdatedByTeam = functions.firestore
  .document('planes/{planId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after  = change.after.data();
    if (!after.updatedByTeam || before.updatedByTeam === after.updatedByTeam) return null;

    const ownerId = after.ownerId;
    if (!ownerId) return null;

    const wsDoc = await db.collection('workspaces').doc(ownerId).get();
    const webhookUrl = wsDoc.exists ? wsDoc.data().webhookUrl : null;
    if (!webhookUrl) return null;

    const payload = {
      event:       'plan.actualizado',
      timestamp:   new Date().toISOString(),
      workspaceId: ownerId,
      data: {
        planId:     context.params.planId,
        equipoId:   after.equipoId   || '',
        iniciativa: after.iniciativa || '',
        estado:     after.estado     || '',
        dimension:  after.dimension  || '',
        ciclo:      after.ciclo      || '',
      }
    };

    try {
      await fetch(webhookUrl, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
    } catch (e) {
      console.error('Webhook error (plan.actualizado):', e.message);
    }
    return null;
  });

// ── deleteWorkspaceAdmin ──────────────────────────────────────────
// Elimina la cuenta de Firebase Auth + el documento en Firestore.
exports.deleteWorkspaceAdmin = functions.https.onCall(async (data, context) => {
  await assertSuperAdmin(context);

  const uid = (data.uid || '').trim();
  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument', 'UID requerido.');
  }

  // Eliminar de Firebase Auth
  try {
    await auth.deleteUser(uid);
  } catch (e) {
    // Si la cuenta ya no existe en Auth, continuamos igual para limpiar Firestore
    if (e.code !== 'auth/user-not-found') {
      throw new functions.https.HttpsError('internal', 'Error al eliminar la cuenta: ' + e.message);
    }
  }

  // Eliminar documento de Firestore
  await db.collection('usuarios').doc(uid).delete();

  return { uid };
});
