const functions = require('firebase-functions/v1');
const admin     = require('firebase-admin');

admin.initializeApp();

const db   = admin.firestore();
const auth = admin.auth();

// ── Configuración de dimensiones y secciones (espejo de assessment-config.js) ─
const DIMS_CFG = [
  { key:'eventos',       label:'Ceremonias',           max:12, storeKey:'scoreEventos' },
  { key:'backlog',       label:'Product Backlog',       max:9,  storeKey:'scoreBacklog' },
  { key:'devteam',       label:'Dev Team',              max:12, storeKey:'scoreDevTeam' },
  { key:'transparencia', label:'Transparencia',         max:9,  storeKey:'scoreTransparencia' },
  { key:'tecnico',       label:'Exc. Técnica',          max:9,  storeKey:'scoreTecnico' },
  { key:'cliente',       label:'Orient. Cliente',       max:9,  storeKey:'scoreCliente' },
];

const SECTIONS_CFG = [
  { id:'eventos',       title:'Ceremonias y ritmo del equipo' },
  { id:'backlog',       title:'Gestión del Product Backlog' },
  { id:'devteam',       title:'Autoorganización y entrega' },
  { id:'transparencia', title:'Transparencia, inspección y adaptación' },
  { id:'tecnico',       title:'Excelencia técnica' },
  { id:'cliente',       title:'Orientación al cliente' },
];

function getLevel(pct) {
  if (pct <= 40) return 'Inicial';
  if (pct <= 65) return 'En desarrollo';
  if (pct <= 82) return 'Maduro';
  return 'Avanzado';
}

// ── Guard: verifica que el llamador sea super_admin ───────────────
async function assertSuperAdmin(request) {
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'No autenticado.');
  }
  const doc = await db.collection('usuarios').doc(request.auth.uid).get();
  if (!doc.exists || doc.data().role !== 'super_admin') {
    throw new functions.https.HttpsError('permission-denied', 'Solo el super admin puede realizar esta acción.');
  }
}

// ── createWorkspaceAdmin ──────────────────────────────────────────
// Crea la cuenta de Firebase Auth + documento en Firestore.
// El correo de invitación lo envía el cliente con sendPasswordResetEmail.
exports.createWorkspaceAdmin = functions.https.onCall(async (request) => {
  await assertSuperAdmin(request);

  const nombre = (request.data.nombre || '').trim();
  const email  = (request.data.email  || '').trim();

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

// ── deleteWorkspaceAdmin ──────────────────────────────────────────
// Elimina la cuenta de Firebase Auth + el documento en Firestore.
exports.deleteWorkspaceAdmin = functions.https.onCall(async (request) => {
  await assertSuperAdmin(request);

  const uid = (request.data.uid || '').trim();
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

// ── dispatchWebhook ───────────────────────────────────────────────
// Lee webhookUrl del workspace del llamador y hace POST con el payload.
exports.dispatchWebhook = functions.https.onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'No autenticado.');
  }
  const uid = request.auth.uid;
  const wsDoc = await db.collection('workspaces').doc(uid).get();
  const webhookUrl = wsDoc.exists ? wsDoc.data().webhookUrl : null;
  if (!webhookUrl) return { skipped: true };

  const payload = {
    event:       request.data.event,
    timestamp:   new Date().toISOString(),
    workspaceId: uid,
    data:        request.data.payload || {}
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

// ── buildTeamPrompt ───────────────────────────────────────────────
// Agrega los datos del equipo y construye el prompt para Claude.
// allResps: todos los documentos de la colección respuestas de este equipo.
function buildTeamPrompt(teamId, ciclo, allResps, contextoCoach, documentoContexto) {
  const isAllCycles = !ciclo || ciclo === 'Todos';
  const cycleResps  = isAllCycles ? allResps : allResps.filter(r => r.ciclo === ciclo);
  if (!cycleResps.length) return null;

  // Perfil del equipo (moda por campo)
  const modeOf = key => {
    const counts = {};
    cycleResps.forEach(r => { if (r[key]) counts[r[key]] = (counts[r[key]] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  };
  const profile = {
    teamAge:     modeOf('teamAge')    || 'No especificado',
    teamSize:    modeOf('teamSize')   || 'No especificado',
    dedicatedPO: modeOf('dedicatedPO')|| 'No especificado',
    workMode:    modeOf('workMode')   || 'No especificado',
    count:       cycleResps.length,
  };

  // Scores por dimensión
  const dimScores = {};
  DIMS_CFG.forEach(d => {
    const avg = cycleResps.reduce((s, r) => s + (r[d.storeKey] || 0), 0) / cycleResps.length;
    dimScores[d.key] = Math.round((avg / d.max) * 100);
  });
  const totalPct = Math.round(
    cycleResps.reduce((s, r) => s + (r.scoreTotalPct || 0), 0) / cycleResps.length
  );
  const level = getLevel(totalPct);

  // Brechas de percepción entre roles (umbral ≥ 25pp, mín 3 resp por rol)
  const MIN_ROLE = 3;
  const roleGroups = {};
  cycleResps.forEach(r => {
    if (r.rol) roleGroups[r.rol] = (roleGroups[r.rol] || []).concat(r);
  });
  const validRoles = Object.entries(roleGroups).filter(([, rs]) => rs.length >= MIN_ROLE);
  const roleGapsLines = [];
  if (validRoles.length >= 2) {
    const roleAvgs = {};
    validRoles.forEach(([role, rs]) => {
      roleAvgs[role] = {};
      DIMS_CFG.forEach(d => {
        const sum = rs.reduce((a, r) => a + (r[d.storeKey] || 0), 0);
        roleAvgs[role][d.key] = Math.round((sum / rs.length / d.max) * 100);
      });
    });
    DIMS_CFG.forEach(d => {
      const byRole = validRoles.map(([role]) => ({ role, pct: roleAvgs[role][d.key] }));
      const hi = byRole.reduce((a, b) => b.pct > a.pct ? b : a);
      const lo = byRole.reduce((a, b) => b.pct < a.pct ? b : a);
      if (hi.pct - lo.pct >= 25) {
        roleGapsLines.push(`${d.label}: ${hi.role} ${hi.pct}% vs ${lo.role} ${lo.pct}% (diferencia: ${hi.pct - lo.pct}pp)`);
      }
    });
  }

  // Momentum vs. ciclo anterior
  let momentumText = 'Sin datos de ciclos anteriores';
  if (!isAllCycles) {
    const prevResps = allResps.filter(r => r.ciclo && r.ciclo !== ciclo);
    if (prevResps.length) {
      const byCycle = {};
      prevResps.forEach(r => { if (r.ciclo) byCycle[r.ciclo] = (byCycle[r.ciclo] || []).concat(r); });
      const prevCycles = Object.keys(byCycle);
      const lastPrev   = prevCycles[prevCycles.length - 1];
      const prevCycleR = byCycle[lastPrev];
      const prevAvg    = Math.round(prevCycleR.reduce((s, r) => s + (r.scoreTotalPct || 0), 0) / prevCycleR.length);
      const delta      = totalPct - prevAvg;
      const dir        = delta > 2 ? 'mejorando' : delta < -2 ? 'empeorando' : 'estable';
      const dimDeltas  = DIMS_CFG.map(d => {
        const prevDimAvg = prevCycleR.reduce((s, r) => s + (r[d.storeKey] || 0), 0) / prevCycleR.length;
        const prevPct    = Math.round((prevDimAvg / d.max) * 100);
        const diff       = dimScores[d.key] - prevPct;
        return Math.abs(diff) >= 8 ? `${d.label}: ${diff > 0 ? '+' : ''}${diff}pp` : null;
      }).filter(Boolean);
      momentumText = `${dir} (${delta >= 0 ? '+' : ''}${delta}pp vs ciclo ${lastPrev})`;
      if (dimDeltas.length) momentumText += `. Cambios notables: ${dimDeltas.join(', ')}`;
    }
  }

  // Comentarios por sección con etiqueta de rol
  const commentLines = [];
  SECTIONS_CFG.forEach(sec => {
    const items = cycleResps
      .map(r => ({ text: ((r.comments || {})[sec.id] || '').trim(), rol: r.rol || '' }))
      .filter(c => c.text.length > 0);
    if (items.length) {
      commentLines.push(`### ${sec.title}`);
      items.forEach(c => commentLines.push(`- [${c.rol}] "${c.text}"`));
    }
  });

  const dimScoresText = DIMS_CFG.map(d => `- ${d.label}: ${dimScores[d.key]}%`).join('\n');

  const contextoSection = contextoCoach && contextoCoach.trim()
    ? `\n## Contexto adicional del coach\n${contextoCoach.trim()}\n` : '';

  const documentoSection = documentoContexto && documentoContexto.trim()
    ? `\n## Documento adjunto (extracto del coach, máx. ~5 páginas)\n${documentoContexto.trim()}\n` : '';

  const prompt = `Eres un coach agile experto. Analiza los datos de assessment de madurez Scrum del siguiente equipo y devuelve un JSON estructurado.
${contextoSection}${documentoSection}
## Perfil del equipo
- Antigüedad con Scrum: ${profile.teamAge}
- Tamaño: ${profile.teamSize}
- PO dedicado: ${profile.dedicatedPO}
- Modalidad: ${profile.workMode}
- Respuestas en este ciclo: ${profile.count}

## Scores por dimensión
${dimScoresText}
- Score total: ${totalPct}% — Nivel: ${level}

## Brechas de percepción entre roles (diferencia ≥ 25pp, mínimo 3 resp/rol)
${roleGapsLines.length ? roleGapsLines.join('\n') : 'Sin brechas significativas o datos insuficientes por rol'}

## Momentum
${momentumText}

## Comentarios del equipo por sección
${commentLines.length ? commentLines.join('\n') : 'Sin comentarios en este ciclo'}

---

Devuelve ÚNICAMENTE un JSON válido con esta estructura exacta (sin texto antes ni después, sin bloque markdown):
{
  "narrativa": "2-3 párrafos de análisis integrado. Considera el perfil del equipo, los scores, las brechas y el momentum. Explica qué está pasando en este equipo y por qué.",
  "focusSesion": [
    {"dimension": "key_dimension", "razon": "Por qué esta dimensión es la prioridad", "prioridad": 1}
  ],
  "agendaSesion": "Borrador de agenda de 90 minutos con timing y actividades concretas para la sesión de debrief",
  "sintesisComentarios": {
    "id_seccion": "Síntesis de los comentarios de esa sección (solo incluir secciones con comentarios)"
  },
  "resumenEjecutivo": "1-2 párrafos en lenguaje de negocio para stakeholders, sin jerga técnica de Scrum",
  "alertas": ["Alerta concisa sobre riesgo o regresión importante"],
  "generadoEn": "${new Date().toISOString()}"
}

El campo "dimension" en focusSesion debe ser uno de: eventos, backlog, devteam, transparencia, tecnico, cliente.
Solo con el JSON. Sin explicaciones adicionales.`;

  return { prompt, cycleResps };
}

// ── analyzeTeamWithClaude ─────────────────────────────────────────
// CF callable. Analiza un equipo con Claude y cachea el resultado.
// Input: { teamId, ciclo }   ciclo puede ser null/'Todos' o un nombre de ciclo.
// Output: { data, fromCache, newResponsesCount }
exports.analyzeTeamWithClaude = functions
  .runWith({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 60 })
  .https.onCall(async (request) => {
    if (!request.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'No autenticado.');
    }

    const ownerId           = request.auth.uid;
    const teamId            = (request.data.teamId            || '').trim();
    const ciclo             = (request.data.ciclo             || '').trim() || null;
    const contextoCoach     = (request.data.contextoCoach     || '').trim() || null;
    const documentoContexto = (request.data.documentoContexto || '').trim() || null;

    if (!teamId) {
      throw new functions.https.HttpsError('invalid-argument', 'teamId es requerido.');
    }

    // Verificar pertenencia del equipo
    const teamDoc = await db.collection('equipos').doc(teamId).get();
    if (!teamDoc.exists || teamDoc.data().ownerId !== ownerId) {
      throw new functions.https.HttpsError('permission-denied', 'No tienes acceso a este equipo.');
    }

    // Verificar que la IA está activada
    const wsDoc = await db.collection('workspaces').doc(ownerId).get();
    if (!wsDoc.exists || !wsDoc.data().aiEnabled) {
      throw new functions.https.HttpsError('failed-precondition', 'La IA no está activada para este workspace.');
    }

    // Obtener todas las respuestas del equipo
    const respsSnap = await db.collection('respuestas').where('equipoId', '==', teamId).get();
    const allResps  = respsSnap.docs.map(d => d.data());
    const isAllCycles = !ciclo || ciclo === 'Todos';
    const cycleResps  = isAllCycles ? allResps : allResps.filter(r => r.ciclo === ciclo);

    if (cycleResps.length < 3) {
      throw new functions.https.HttpsError('failed-precondition', 'Se necesitan al menos 3 respuestas para el análisis.');
    }

    // Clave de caché: teamId + ciclo (sanitizado para Firestore)
    const cacheKey = `${teamId}_${(ciclo || 'Todos').replace(/[^a-zA-Z0-9\-]/g, '_')}`;

    // Verificar caché existente
    const cacheRef = db.collection('analisis_ia').doc(cacheKey);
    const cacheDoc = await cacheRef.get();

    if (cacheDoc.exists) {
      const cached    = cacheDoc.data();
      const cachedAt  = cached.generadoEn ? new Date(cached.generadoEn) : null;
      if (cachedAt) {
        const newResponsesCount = cycleResps.filter(r => {
          const fecha = r.fecha ? r.fecha.toDate() : null;
          return fecha && fecha > cachedAt;
        }).length;
        if (newResponsesCount === 0) {
          return { data: cached, fromCache: true, newResponsesCount: 0 };
        }
        // Hay respuestas nuevas: regenerar pero informar cuántas hay
      }
    }

    // Construir prompt con datos calculados
    const built = buildTeamPrompt(teamId, ciclo, allResps, contextoCoach, documentoContexto);
    if (!built) {
      throw new functions.https.HttpsError('not-found', 'Sin datos para analizar.');
    }

    // Llamar a Claude
    const { Anthropic } = require('@anthropic-ai/sdk');
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new functions.https.HttpsError('internal', 'API key no configurada. Configura ANTHROPIC_API_KEY en Secret Manager.');
    }

    const anthropic = new Anthropic({ apiKey });
    let parsed;
    try {
      const message = await anthropic.messages.create({
        model:      'claude-sonnet-4-6',
        max_tokens: 1024,
        messages:   [{ role: 'user', content: built.prompt }],
      });
      const rawText = message.content[0]?.type === 'text' ? message.content[0].text.trim() : '';
      // Extraer JSON aunque el modelo añada backticks
      const jsonStr = rawText.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
      parsed = JSON.parse(jsonStr);
      parsed.generadoEn = new Date().toISOString();
    } catch (e) {
      throw new functions.https.HttpsError('internal', 'Error al procesar la respuesta de IA: ' + e.message);
    }

    // Guardar en caché (admin SDK — sin pasar por reglas)
    if (contextoCoach) parsed.contextoCoach = contextoCoach;
    await cacheRef.set(parsed);

    return { data: parsed, fromCache: false, newResponsesCount: 0 };
  });
