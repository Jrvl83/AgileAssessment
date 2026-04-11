// ── Helpers ──────────────────────────────────────────────────────

function calcDispersion(pctArr) {
  if (pctArr.length < 2) return null;
  const mean = pctArr.reduce((a,b) => a+b, 0) / pctArr.length;
  const sd = Math.round(Math.sqrt(pctArr.reduce((a,b) => a + Math.pow(b-mean, 2), 0) / pctArr.length));
  const min = Math.min(...pctArr);
  const max = Math.max(...pctArr);
  const align = sd < 15 ? { label:'Alta',  color:'#0d7a52', bg:'#d4f0e5' }
              : sd < 25 ? { label:'Media', color:'#a05c0a', bg:'#fdefd6' }
              :            { label:'Baja',  color:'#c0282a', bg:'#fce8e8' };
  return { sd, min, max, align };
}

// Detecta preguntas polarizadas: respuestas concentradas en ambos extremos (0 y 3)
// counts = [c0, c1, c2, c3] — frecuencia de cada valor de respuesta
function isPolarized(counts) {
  const total = counts.reduce((a, b) => a + b, 0);
  if (total < 3) return false;
  return counts[0] > 0 && counts[3] > 0 && (counts[0] + counts[3]) / total >= 0.5;
}

function computeGlobalDimAverages(cFilter, excludeOtro) {
  const teamsWithData = Object.values(state.teamStats).filter(s => s.count > 0);
  if (teamsWithData.length < 2) return null;
  const sums = {};
  DIMS.forEach(d => { sums[d.key] = 0; });
  let count = 0;
  teamsWithData.forEach(s => {
    const st = getTeamFilteredStats(s.id, 'Todos', cFilter, excludeOtro);
    if (!st) return;
    DIMS.forEach(d => { sums[d.key] += st.avgDims[d.key].pct; });
    count++;
  });
  if (count < 2) return null;
  const result = {};
  DIMS.forEach(d => { result[d.key] = Math.round(sums[d.key] / count); });
  return result;
}

function getMajorityRole(resps) {
  const counts = {};
  resps.forEach(r => {
    const rol = r.fields.Rol;
    if (rol && rol !== 'Otro') counts[rol] = (counts[rol] || 0) + 1;
  });
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (!entries.length || entries.length > 1 && entries[0][1] === entries[1][1]) return null;
  return entries[0][0];
}

function getTeamFilteredStats(tid, roleFilter, cFilter, excludeOtro) {
  const cf = cFilter || 'Todos';
  const filtered = state.responses.filter(r =>
    (r.fields.Equipo || []).includes(tid) &&
    (roleFilter === 'Todos' || r.fields.Rol === roleFilter) &&
    (roleFilter !== 'Todos' || !excludeOtro || r.fields.Rol !== 'Otro') &&
    (cf === 'Todos' || r.fields.Ciclo === cf)
  );
  if (!filtered.length) return null;
  const dimSums = {};
  DIMS.forEach(d => { dimSums[d.key] = 0; });
  let totalPct = 0;
  filtered.forEach(r => {
    DIMS.forEach(d => { dimSums[d.key] += r.fields[d.field] || 0; });
    totalPct += r.fields['Score Total %'] || 0;
  });
  const avgTotal = Math.round(totalPct / filtered.length);
  const avgDims = {};
  DIMS.forEach(d => {
    const avg = dimSums[d.key] / filtered.length;
    avgDims[d.key] = { score: +avg.toFixed(1), pct: Math.round((avg / d.max) * 100) };
  });
  const dispersion = {};
  DIMS.forEach(d => {
    const pcts = filtered.map(r => Math.round(((r.fields[d.field] || 0) / d.max) * 100));
    dispersion[d.key] = calcDispersion(pcts);
  });
  dispersion.overall = calcDispersion(filtered.map(r => r.fields['Score Total %'] || 0));
  const tamanoCount = {}, scrumTimeCount = {};
  filtered.forEach(r => {
    const t = r.fields['Tamaño Equipo'], s = r.fields['Tiempo Scrum'];
    if (t) tamanoCount[t] = (tamanoCount[t] || 0) + 1;
    if (s) scrumTimeCount[s] = (scrumTimeCount[s] || 0) + 1;
  });
  const tamano = Object.entries(tamanoCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const tiempoScrum = Object.entries(scrumTimeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  return { count: filtered.length, avgTotal, avgDims, level: getLevel(avgTotal), dispersion, tamano, tiempoScrum };
}

function computeStats() {
  const stats = {};
  state.teams.forEach(t => {
    stats[t.id] = { id: t.id, name: t.name, active: t.active, count: 0, dimSums: {}, totalPct: 0 };
    DIMS.forEach(d => { stats[t.id].dimSums[d.key] = 0; });
  });
  state.responses.forEach(r => {
    (r.fields.Equipo || []).forEach(tid => {
      if (!stats[tid]) return;
      const s = stats[tid];
      s.count++;
      DIMS.forEach(d => { s.dimSums[d.key] += r.fields[d.field] || 0; });
      s.totalPct += r.fields['Score Total %'] || 0;
    });
  });
  Object.values(stats).forEach(s => {
    if (s.count > 0) {
      s.avgTotal = Math.round(s.totalPct / s.count);
      s.avgDims = {};
      DIMS.forEach(d => {
        const avg = s.dimSums[d.key] / s.count;
        s.avgDims[d.key] = { score: +avg.toFixed(1), pct: Math.round((avg / d.max) * 100) };
      });
      s.level = getLevel(s.avgTotal);
    }
  });
  state.teamStats = stats;
}

// ── Evolution ────────────────────────────────────────────────────
function getEvolutionData(tid, role) {
  const resps = state.responses.filter(r =>
    (r.fields.Equipo || []).includes(tid) &&
    (role === 'Todos' || r.fields.Rol === role)
  );
  const byCycle = {};
  resps.forEach(r => {
    const cn = r.fields.Ciclo || 'Sin ciclo';
    if (!byCycle[cn]) byCycle[cn] = [];
    byCycle[cn].push(r);
  });
  return Object.entries(byCycle).map(([cycleName, rs]) => {
    const dimSums = {};
    DIMS.forEach(d => { dimSums[d.key] = 0; });
    let totalPct = 0;
    rs.forEach(r => {
      DIMS.forEach(d => { dimSums[d.key] += r.fields[d.field] || 0; });
      totalPct += r.fields['Score Total %'] || 0;
    });
    const avgTotal = Math.round(totalPct / rs.length);
    const avgDims = {};
    DIMS.forEach(d => {
      const avg = dimSums[d.key] / rs.length;
      avgDims[d.key] = { pct: Math.round((avg / d.max) * 100) };
    });
    const qSums = {};
    let qCount = 0;
    rs.forEach(r => {
      if (r.fields.Answers && Object.keys(r.fields.Answers).length > 0) {
        qCount++;
        Object.entries(r.fields.Answers).forEach(([k, v]) => { qSums[k] = (qSums[k] || 0) + Number(v); });
      }
    });
    const avgQuestions = qCount > 0
      ? Object.fromEntries(Object.entries(qSums).map(([k, sum]) => [k, +(sum / qCount).toFixed(2)]))
      : null;
    return { cycleName, count: rs.length, avgTotal, avgDims, level: getLevel(avgTotal), avgQuestions };
  }).sort((a, b) => {
    const ia = state.cycles.findIndex(c => c.name === a.cycleName);
    const ib = state.cycles.findIndex(c => c.name === b.cycleName);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.cycleName.localeCompare(b.cycleName);
  });
}

// ── API ──────────────────────────────────────────────────────────
async function fetchAllData() {
  setState({ loading: true });
  try {
    let tQuery = db.collection('equipos');
    if (state.currentRole === 'admin') tQuery = tQuery.where('ownerId', '==', state.currentUser.uid);
    const tSnap = await tQuery.get();
    state.teams = tSnap.docs.map(d => ({
      id: d.id, name: d.data().nombre, active: !!d.data().activo,
      ownerId: d.data().ownerId || null,
      notas: d.data().notas || {}
    })).sort((a, b) => a.name.localeCompare(b.name));

    const teamIds = new Set(state.teams.map(t => t.id));
    const rSnap = await db.collection('respuestas').get();
    state.responses = rSnap.docs
      .map(d => {
        const r = d.data();
        return {
          id: d.id,
          fields: {
            Equipo: [r.equipoId],
            Participante: r.participante,
            Rol: r.rol,
            Ciclo: r.ciclo || '',
            ...Object.fromEntries(DIMS.map(d => [d.field, r[d.storeKey] || 0])),
            'Score Total %': r.scoreTotalPct || 0,
            Nivel: r.nivel || '',
            Fecha: r.fecha ? r.fecha.toDate().toISOString() : '',
            'Tamaño Equipo': r.tamanoEquipo || '',
            'Tiempo Scrum': r.tiempoScrum || '',
            Answers: r.answers || {},
            Comments: r.comments || {}
          }
        };
      })
      .filter(r => teamIds.has(r.fields.Equipo[0]))
      .sort((a, b) => (b.fields.Fecha || '').localeCompare(a.fields.Fecha || ''));

    let cQuery = db.collection('ciclos');
    if (state.currentRole === 'admin') cQuery = cQuery.where('ownerId', '==', state.currentUser.uid);
    const cSnap = await cQuery.get();
    state.cycles = cSnap.docs.map(d => ({ id: d.id, name: d.data().nombre, active: !!d.data().activo }))
      .sort((a, b) => a.name.localeCompare(b.name));

    await fetchPlans();
    computeStats();
    startLiveResponseCount();

    try {
      const wsSnap = await db.collection('workspaces').doc(state.currentUser.uid).get();
      state.briefingTexto = wsSnap.exists ? (wsSnap.data().briefingTexto || '') : '';
    } catch(e) { state.briefingTexto = ''; }

    let rptQuery = db.collection('reportes');
    if (state.currentRole === 'admin') rptQuery = rptQuery.where('ownerId', '==', state.currentUser.uid);
    const rptSnap = await rptQuery.get();
    state.reports = rptSnap.docs.map(d => {
      const r = d.data();
      return {
        id: d.id,
        equipoNombre: r.equipoNombre || '',
        ciclo: r.ciclo || 'Todos',
        ownerId: r.ownerId || '',
        generatedAt: r.generatedAt ? r.generatedAt.toDate() : null,
        expiresAt:   r.expiresAt   ? r.expiresAt.toDate()   : null,
      };
    }).sort((a, b) => (b.generatedAt || 0) - (a.generatedAt || 0));
  } catch(e) { toast('Error al conectar con Firebase'); }
  setState({ loading: false });
}

async function addTeam() {
  const name = state.newTeamName.trim();
  if (!name) return;
  try {
    await db.collection('equipos').add({ nombre: name, activo: true, ownerId: state.currentUser.uid });
    state.newTeamName = '';
    toast(`Equipo "${name}" creado`);
    await fetchAllData();
  } catch(e) { toast('Error al crear equipo'); }
}

async function toggleActive(id, name, current) {
  try {
    await db.collection('equipos').doc(id).update({ activo: !current });
    toast(current ? `"${name}" desactivado` : `"${name}" activado`);
    await fetchAllData();
  } catch(e) { toast('Error de conexión'); }
}

async function deleteTeam(id, name) {
  if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
  try {
    await db.collection('equipos').doc(id).delete();
    toast(`Equipo "${name}" eliminado`);
    await fetchAllData();
  } catch(e) { toast('Error de conexión'); }
}

// ── Cycle management ─────────────────────────────────────────────
async function addCycle() {
  const name = state.newCycleName.trim();
  if (!name) return;
  try {
    await db.collection('ciclos').add({ nombre: name, activo: false, ownerId: state.currentUser.uid });
    state.newCycleName = '';
    toast(`Ciclo "${name}" creado`);
    await fetchAllData();
  } catch(e) { toast('Error al crear ciclo'); }
}

async function toggleCycle(id, name, current) {
  try {
    if (!current) {
      const batch = db.batch();
      state.cycles.filter(c => c.active && c.id !== id).forEach(c => {
        batch.update(db.collection('ciclos').doc(c.id), { activo: false });
      });
      await batch.commit();
    }
    await db.collection('ciclos').doc(id).update({ activo: !current });
    toast(current ? `"${name}" cerrado` : `"${name}" activado`);
    await fetchAllData();
  } catch(e) { toast('Error de conexión'); }
}

async function deleteCycle(id, name) {
  if (!confirm(`¿Eliminar ciclo "${name}"? Las respuestas asociadas no se borrarán.`)) return;
  try {
    await db.collection('ciclos').doc(id).delete();
    toast(`Ciclo "${name}" eliminado`);
    await fetchAllData();
  } catch(e) { toast('Error de conexión'); }
}

// ── Plan de Acción ───────────────────────────────────────────────
async function fetchPlans() {
  try {
    const teamIds = new Set(state.teams.map(t => t.id));
    const snap = await db.collection('planes').get();
    state.plans = snap.docs
      .map(d => ({ id: d.id, ...d.data(), _ms: d.data().fechaCreacion ? d.data().fechaCreacion.toMillis() : 0 }))
      .filter(p => teamIds.has(p.equipoId))
      .sort((a, b) => b._ms - a._ms);
  } catch(e) { state.plans = []; }
}

async function addPlan() {
  if (!state.newPlanTeamId || !state.newPlanIniciativa.trim()) return;
  const team = state.teams.find(t => t.id === state.newPlanTeamId);
  const cicloFinal = state.newPlanCiclo || (state.cycles.find(c => c.active) || {}).name || '';
  try {
    await db.collection('planes').add({
      equipoId: state.newPlanTeamId,
      equipoNombre: team ? team.name : '',
      iniciativa: state.newPlanIniciativa.trim(),
      responsable: state.newPlanResponsable.trim(),
      fechaObjetivo: state.newPlanFecha,
      estado: 'pendiente',
      ciclo: cicloFinal,
      dimension: state.newPlanDimension || '',
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
    });
    state.newPlanIniciativa = ''; state.newPlanResponsable = ''; state.newPlanFecha = '';
    state.newPlanDimension = '';
    toast('Acción agregada');
    await fetchPlans();
    setState({});
  } catch(e) { toast('Error al guardar'); }
}

async function updatePlanStatus(id, status) {
  try {
    await db.collection('planes').doc(id).update({ estado: status });
    await fetchPlans();
    setState({});
  } catch(e) { toast('Error de conexión'); }
}

async function deletePlan(id) {
  if (!confirm('¿Eliminar esta acción?')) return;
  try {
    await db.collection('planes').doc(id).delete();
    toast('Acción eliminada');
    await fetchPlans();
    setState({});
  } catch(e) { toast('Error de conexión'); }
}

// ── User management ──────────────────────────────────────────────
async function fetchUsers() {
  try {
    const snap = await db.collection('usuarios').get();
    state.users = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .filter(u => u.role !== 'super_admin')
      .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
  } catch(e) { state.users = []; }
}

async function createUser() {
  const nombre = state.newUserNombre.trim();
  const email  = state.newUserEmail.trim();
  if (!nombre || !email) { toast('Completa nombre y email'); return; }
  try {
    await fns.httpsCallable('createWorkspaceAdmin')({ nombre, email });
    await auth.sendPasswordResetEmail(email);
    state.newUserNombre = ''; state.newUserEmail = '';
    toast(`Usuario ${nombre} creado — se envió invitación a ${email}`);
    await fetchUsers();
    setState({});
  } catch(e) {
    if (e.code === 'already-exists') {
      toast('Ese email ya tiene una cuenta registrada');
    } else {
      toast('Error al crear usuario: ' + (e.message || e.code));
    }
  }
}

async function suspendUser(uid, nombre) {
  try {
    await db.collection('usuarios').doc(uid).update({ activo: false });
    toast(`"${nombre}" suspendido`);
    await fetchUsers();
    setState({});
  } catch(e) { toast('Error de conexión'); }
}

async function reactivateUser(uid, nombre) {
  try {
    await db.collection('usuarios').doc(uid).update({ activo: true });
    toast(`"${nombre}" reactivado`);
    await fetchUsers();
    setState({});
  } catch(e) { toast('Error de conexión'); }
}

async function deleteUser(uid, nombre) {
  if (!confirm(`¿Eliminar la cuenta de "${nombre}"?\n\nEsta acción bloqueará el acceso permanentemente. Sus datos (equipos, respuestas, ciclos) se conservan.`)) return;
  try {
    await fns.httpsCallable('deleteWorkspaceAdmin')({ uid });
    toast(`Cuenta de "${nombre}" eliminada`);
    await fetchUsers();
    setState({});
  } catch(e) { toast('Error al eliminar: ' + (e.message || e.code)); }
}

async function resendInvite(email, nombre) {
  try {
    await auth.sendPasswordResetEmail(email);
    toast(`Invitación reenviada a ${email}`);
  } catch(e) { toast('Error al enviar correo'); }
}

// ── Reportes compartibles ─────────────────────────────────────────
async function generateReport(teamId, cycleFilter) {
  const team = state.teams.find(t => t.id === teamId);
  if (!team) return;

  const cf = cycleFilter || 'Todos';
  const ds = getTeamFilteredStats(teamId, 'Todos', cf);
  if (!ds) { toast('Sin respuestas para generar el reporte'); return; }

  const teamResps = state.responses
    .filter(r => (r.fields.Equipo || []).includes(teamId))
    .filter(r => cf === 'Todos' || r.fields.Ciclo === cf);

  const availRoles = [...new Set(teamResps.map(r => r.fields.Rol).filter(Boolean))].sort();
  const roleStats = availRoles.map(role => {
    const rr = teamResps.filter(r => r.fields.Rol === role);
    const avg = Math.round(rr.reduce((sum, r) => sum + (r.fields['Score Total %'] || 0), 0) / rr.length);
    return { role, count: rr.length, avg, level: getLevel(avg) };
  }).sort((a, b) => b.avg - a.avg);

  const majorityRole = getMajorityRole(teamResps);
  const below80 = DIMS.filter(d => ds.avgDims[d.key].pct < 80)
    .sort((a, b) => ds.avgDims[a.key].pct - ds.avgDims[b.key].pct);
  const recDims = below80.length > 0
    ? below80
    : DIMS.slice().sort((a, b) => ds.avgDims[a.key].pct - ds.avgDims[b.key].pct).slice(0, 4);
  const recommendations = recDims.map(d => ({
    dimKey: d.key,
    dimLabel: d.label,
    dimColor: d.color,
    pct: ds.avgDims[d.key].pct,
    text: getRec(d.key, ds.avgDims[d.key].pct, majorityRole)
  }));

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const snapshot = {
    equipoId: teamId,
    equipoNombre: team.name,
    ciclo: cf,
    ownerId: state.currentUser.uid,
    generatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    expiresAt: firebase.firestore.Timestamp.fromDate(expiresAt),
    data: {
      avgTotal: ds.avgTotal,
      count: ds.count,
      level: ds.level,
      avgDims: ds.avgDims,
      dims: DIMS.map(d => ({ key: d.key, label: d.label, color: d.color, max: d.max })),
      radarValues: DIMS.map(d => ds.avgDims[d.key].pct),
      radarLabels: DIMS.map(d => d.label),
      radarColors: DIMS.map(d => d.color),
      roleStats,
      dispersion: ds.dispersion || {},
      recommendations
    }
  };

  try {
    const ref = await db.collection('reportes').add(snapshot);
    const url = window.location.origin + '/reporte.html?t=' + ref.id;
    showReportLink(url, team.name, cf);
    toast('Reporte generado');
  } catch(e) { toast('Error al generar el reporte'); }
}

// ── Reportes compartibles — gestión ──────────────────────────────
async function revokeReport(token, label) {
  if (!confirm(`¿Revocar el reporte "${label}"?\n\nEl link dejará de funcionar inmediatamente.`)) return;
  try {
    await db.collection('reportes').doc(token).delete();
    toast('Reporte revocado');
    await fetchAllData();
  } catch(e) { toast('Error al revocar el reporte'); }
}

// ── Briefing pre-assessment ──────────────────────────────────────
const _briefingTimer = {};
function saveBriefing(text) {
  state.briefingTexto = text;
  clearTimeout(_briefingTimer.t);
  _briefingTimer.t = setTimeout(async () => {
    try {
      await db.collection('workspaces').doc(state.currentUser.uid).set(
        { briefingTexto: text }, { merge: true }
      );
    } catch(e) { toast('Error al guardar el briefing'); }
  }, 800);
}

// ── Contador en tiempo real ──────────────────────────────────────
let _liveCountUnsub = null;
function startLiveResponseCount() {
  if (_liveCountUnsub) { _liveCountUnsub(); _liveCountUnsub = null; }
  const teamIds = new Set(state.teams.map(t => t.id));
  if (!teamIds.size) return;
  _liveCountUnsub = db.collection('respuestas').onSnapshot(snap => {
    const updated = snap.docs
      .map(d => {
        const r = d.data();
        return {
          id: d.id,
          fields: {
            Equipo: [r.equipoId],
            Participante: r.participante,
            Rol: r.rol,
            Ciclo: r.ciclo || '',
            ...Object.fromEntries(DIMS.map(d => [d.field, r[d.storeKey] || 0])),
            'Score Total %': r.scoreTotalPct || 0,
            Nivel: r.nivel || '',
            Fecha: r.fecha ? r.fecha.toDate().toISOString() : '',
            'Tamaño Equipo': r.tamanoEquipo || '',
            'Tiempo Scrum': r.tiempoScrum || '',
            Answers: r.answers || {},
            Comments: r.comments || {}
          }
        };
      })
      .filter(r => teamIds.has(r.fields.Equipo[0]))
      .sort((a, b) => (b.fields.Fecha || '').localeCompare(a.fields.Fecha || ''));
    if (updated.length !== state.responses.length) {
      state.responses = updated;
      computeStats();
      setState({});
    }
  });
}

// ── Notas del coach ──────────────────────────────────────────────
const _noteTimers = {};
const _noteDrafts = {};
function saveCoachNote(teamId, ciclo, text) {
  const key = ciclo === 'Todos' ? '_general' : ciclo.replace(/[^a-zA-Z0-9]/g, '_');
  _noteDrafts[teamId + '_' + key] = text;
  clearTimeout(_noteTimers[teamId]);
  _noteTimers[teamId] = setTimeout(async () => {
    try {
      await db.collection('equipos').doc(teamId).update({ [`notas.${key}`]: text });
      const team = state.teams.find(t => t.id === teamId);
      if (team) { team.notas = team.notas || {}; team.notas[key] = text; }
      delete _noteDrafts[teamId + '_' + key];
    } catch(e) { toast('Error al guardar nota'); }
  }, 800);
}

// CommonJS exports para tests (no-op en el browser)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calcDispersion, isPolarized, getMajorityRole, computeGlobalDimAverages, getTeamFilteredStats, computeStats, getEvolutionData };
}
