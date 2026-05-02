<template>
  <div class="fac-root">
    <!-- Loading -->
    <div v-if="screen === 'loading'" class="loading-screen">
      <p>Cargando sesión…</p>
    </div>

    <!-- Login -->
    <div v-else-if="screen === 'login'" class="login-wrap">
      <div class="login-card">
        <h2>Modo facilitación</h2>
        <p>Inicia sesión con tu cuenta de coach para acceder.</p>
        <div class="fg">
          <label>Email</label>
          <input class="fi" type="email" v-model="loginEmail" placeholder="tu@email.com"
            @keydown.enter="passwordRef && passwordRef.focus()" autocomplete="email" />
        </div>
        <div class="fg">
          <label>Contraseña</label>
          <input class="fi" type="password" ref="passwordRef" v-model="loginPw" placeholder="••••••••"
            @keydown.enter="doLogin" autocomplete="current-password" />
        </div>
        <div class="lerr">{{ loginErr }}</div>
        <button class="btn-p" :disabled="loginLoading" @click="doLogin">
          {{ loginLoading ? 'Ingresando…' : 'Ingresar →' }}
        </button>
      </div>
    </div>

    <!-- Sin equipo -->
    <div v-else-if="screen === 'no-team'" class="loading-screen">
      <p>Sin equipo seleccionado.</p>
      <p class="sub">Abre esta página desde el panel de administración usando el botón <strong>Facilitar →</strong>.</p>
    </div>

    <!-- Sin datos -->
    <div v-else-if="screen === 'no-data'" class="loading-screen">
      <p>Sin datos para esta sesión.</p>
      <p class="sub">Verifica que el equipo y ciclo tengan respuestas registradas.</p>
    </div>

    <!-- Presenter -->
    <div v-else class="presenter">
      <div class="stage">
        <div class="slide-card" ref="slideCardRef">

          <!-- Cover -->
          <template v-if="slide.type === 'cover'">
            <div class="s-eyebrow">Sesión de facilitación</div>
            <h1 class="s-h1">{{ teamName || 'Equipo' }}</h1>
            <p class="s-meta">{{ cicloNombre }}{{ cicloNombre ? ' · ' : '' }}{{ today }}</p>
            <template v-if="globalPct !== null">
              <div class="score-row">
                <span class="score-num">{{ globalPct }}%</span>
                <span v-if="globalLevel" class="level-tag" :style="{ background: globalLevel.bg, color: globalLevel.color }">
                  {{ globalLevel.label }}
                </span>
              </div>
              <p class="s-caption">{{ responseCount }} respuesta{{ responseCount !== 1 ? 's' : '' }} · {{ cicloNombre || 'Ciclo activo' }}</p>
            </template>
            <p v-else class="s-caption" style="margin-top:18px">Sin datos del ciclo</p>
            <div v-if="hasDimScores" class="dim-grid">
              <div v-for="d in DIMS" :key="d.key" class="dim-chip">
                <div class="dim-chip-label">{{ d.label }}</div>
                <div v-if="dimScores[d.key]" class="dim-chip-pct" :style="{ color: d.color }">{{ dimScores[d.key].pct }}%</div>
              </div>
            </div>
          </template>

          <!-- Dimension -->
          <template v-else-if="slide.type === 'dimension' && slideDim">
            <div class="s-eyebrow" :style="{ color: slideDim.dim.color }">{{ slideDim.sec.title }}</div>
            <h2 class="s-h2">{{ slideDim.sec.desc }}</h2>
            <template v-if="slideDim.scores">
              <div class="score-row">
                <span class="score-num" :style="{ color: slideDim.dim.color }">{{ slideDim.scores.pct }}%</span>
                <span v-if="slideDimLevel" class="level-tag" :style="{ background: slideDimLevel.bg, color: slideDimLevel.color }">
                  {{ slideDimLevel.label }}
                </span>
              </div>
            </template>
            <ul class="q-list">
              <li v-for="(q, i) in slideCoachingQs" :key="i">
                <span class="q-num">{{ i + 1 }}</span>
                <span>{{ q }}</span>
              </li>
            </ul>
          </template>

          <!-- AI Narrativa -->
          <template v-else-if="slide.type === 'ai_narrativa'">
            <div class="s-eyebrow">Análisis con IA</div>
            <h2 class="s-h2">Contexto del equipo</h2>
            <p class="s-text">{{ aiData?.narrativa || '' }}</p>
          </template>

          <!-- AI Foco -->
          <template v-else-if="slide.type === 'ai_foco'">
            <div class="s-eyebrow">Análisis con IA</div>
            <h2 class="s-h2">Foco recomendado</h2>
            <p class="s-text">{{ aiData?.focusSesion || '' }}</p>
          </template>

          <!-- Cierre -->
          <template v-else-if="slide.type === 'cierre'">
            <div class="s-eyebrow">Cierre de sesión</div>
            <h2 class="s-h2">Compromisos del equipo</h2>
            <div class="cierre-q">¿Cuál es la acción más importante que el equipo puede comprometerse a hacer antes del próximo Sprint?</div>
            <p style="font-size:14px;color:var(--ink-faint);margin-top:18px;line-height:1.7">
              Cada persona nombra un compromiso concreto. Captúralos directamente en el Plan de Acción.
            </p>
            <div class="action-section">
              <button class="action-toggle" @click="toggleActionForm">
                {{ showActionForm ? '✕ Cancelar' : '+ Nueva acción' }}
              </button>
              <div v-if="showActionForm" class="action-form">
                <div class="af-field">
                  <label>Iniciativa / acción</label>
                  <input ref="afIniciativaRef" type="text" v-model="afIniciativa"
                    placeholder="Ej: Definir Sprint Goal con el equipo el próximo lunes" maxlength="200" />
                </div>
                <div class="af-row">
                  <div class="af-field">
                    <label>Responsable</label>
                    <input type="text" v-model="afResponsable" placeholder="Nombre o rol" />
                  </div>
                  <div class="af-field">
                    <label>Fecha objetivo</label>
                    <input type="date" v-model="afFecha" />
                  </div>
                </div>
                <div class="af-row">
                  <div class="af-field">
                    <label>Dimensión</label>
                    <select v-model="afDimension">
                      <option value="">— Sin dimensión —</option>
                      <option v-for="d in DIMS" :key="d.key" :value="d.key">{{ d.label }}</option>
                    </select>
                  </div>
                  <div class="af-field" style="justify-content:flex-end">
                    <button class="af-save" :disabled="actionSaving" @click="saveAction">
                      {{ actionSaving ? 'Guardando…' : '✓ Guardar acción' }}
                    </button>
                  </div>
                </div>
              </div>
              <div v-if="sessionActions.length" class="action-list">
                <div v-for="(a, i) in sessionActions" :key="i" class="action-item">
                  <span class="action-check">✓</span>
                  <div class="action-text">
                    <strong>{{ a.iniciativa }}</strong>
                    <span>
                      {{ a.responsable || 'Sin responsable' }}{{ a.fechaObjetivo ? ' · ' + a.fechaObjetivo : '' }}{{ a.dimLabel ? ' · ' + a.dimLabel : '' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </template>

        </div>
      </div>

      <!-- Control bar -->
      <div class="ctrlbar">
        <div class="progress-rail">
          <div class="progress-bar" :style="{ width: progressPct + '%' }"></div>
        </div>
        <button class="cb-btn" @click="navigate(-1)" :disabled="isFirst">← Anterior</button>
        <div class="cb-center">
          <span class="cb-title">{{ slideTitleLabel }}</span>
          <span class="cb-counter">
            {{ currentSlide + 1 }} / {{ slides.length }} &nbsp;·&nbsp;
            <span class="kbd">←</span> <span class="kbd">→</span> &nbsp;·&nbsp;
            <span class="kbd">N</span> notas
          </span>
        </div>
        <button class="cb-btn" :class="{ on: coachMode }" @click="coachMode = !coachMode">
          {{ coachMode ? 'Notas ▲' : 'Notas ▼' }}
        </button>
        <button class="cb-btn" @click="exportSession" title="Exportar resumen de la sesión para imprimir">↓ Exportar</button>
        <button class="cb-btn" @click="navigate(1)" :disabled="isLast">Siguiente →</button>
      </div>

      <!-- Notes panel -->
      <div v-if="coachMode" class="notes-panel">
        <!-- Cover notes -->
        <template v-if="slide.type === 'cover'">
          <template v-if="aiData?.resumenEjecutivo">
            <div class="n-header">Resumen ejecutivo (IA)</div>
            <p class="n-ai">{{ aiData.resumenEjecutivo }}</p>
          </template>
          <div class="n-header">Apertura sugerida</div>
          <p class="n-item"><strong>Encuadre:</strong> "Este assessment es un espejo colectivo, no una evaluación individual. Vamos a usarlo para decidir dónde enfocar nuestra energía."</p>
          <p class="n-item"><strong>Confidencialidad:</strong> Confirma que los resultados son del equipo y no se comparten hacia arriba sin su consentimiento.</p>
          <p class="n-item"><strong>Duración:</strong> 90 minutos. Puedes ajustar cuánto tiempo dedicas a cada dimensión.</p>
        </template>

        <!-- Dimension notes -->
        <template v-else-if="slide.type === 'dimension'">
          <template v-if="dimAlerts.length">
            <div class="n-header">Alertas IA</div>
            <p v-for="(a, i) in dimAlerts" :key="i" class="n-item n-warn">⚠ {{ a }}</p>
          </template>
          <div class="n-header">Preguntas de coaching{{ slideDim?.scores ? ' · ' + slideDim.scores.pct + '%' : '' }}</div>
          <p v-for="(q, i) in slideCoachingQs" :key="i" class="n-item"><strong>P{{ i + 1 }}</strong> {{ q }}</p>
          <p class="n-item" style="color:rgba(255,255,255,.2);font-size:11px;margin-top:4px">→ Elige 1–2 preguntas según la energía del equipo.</p>
        </template>

        <!-- AI Narrativa notes -->
        <template v-else-if="slide.type === 'ai_narrativa'">
          <div class="n-header">Nota del coach</div>
          <p class="n-item">Comparte la narrativa en voz alta. Pregunta: <strong>¿Esto resuena con el equipo? ¿Hay algo que matizarías?</strong></p>
        </template>

        <!-- AI Foco notes -->
        <template v-else-if="slide.type === 'ai_foco'">
          <div class="n-header">Nota del coach</div>
          <p class="n-item">Usa el foco para enfocar el debate. Invita al equipo a validar o cuestionar la recomendación de IA.</p>
        </template>

        <!-- Cierre notes -->
        <template v-else-if="slide.type === 'cierre'">
          <template v-if="aiData?.focusSesion">
            <div class="n-header">Foco recomendado (IA)</div>
            <p class="n-ai">{{ aiData.focusSesion }}</p>
          </template>
          <template v-if="aiData?.agendaSesion">
            <div class="n-header">Agenda sugerida (IA)</div>
            <p class="n-ai">{{ aiData.agendaSesion }}</p>
          </template>
          <template v-if="aiData?.sintesisComentarios">
            <div class="n-header">Síntesis de comentarios (IA)</div>
            <p class="n-ai">{{ aiData.sintesisComentarios }}</p>
          </template>
          <template v-if="!aiData?.focusSesion && !aiData?.agendaSesion">
            <div class="n-header">Cierre sugerido</div>
            <p class="n-item"><strong>Compromisos:</strong> Recoge uno por persona, concreto y con fecha. Vincúlalos al Plan de Acción.</p>
            <p class="n-item"><strong>Seguimiento:</strong> Agenda revisión en la próxima Retro.</p>
          </template>
        </template>

        <p v-else class="n-empty">Sin notas para este slide.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { collection, query, where, getDocs, getDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase.js';
import { SECTIONS, DIMS, COACHING_QUESTIONS, getLevel } from '../../assessment-config.js';

// ── State ──────────────────────────────────────────────────────────────
const screen = ref('loading');
const loginEmail = ref('');
const loginPw = ref('');
const loginErr = ref('');
const loginLoading = ref(false);
const passwordRef = ref(null);

const teamId = ref('');
const teamName = ref('');
const cicloNombre = ref('');
const workspaceId = ref('');

const currentSlide = ref(0);
const coachMode = ref(true);
const aiData = ref(null);
const dimScores = reactive({});
const globalPct = ref(null);
const responseCount = ref(0);

const showActionForm = ref(false);
const sessionActions = ref([]);
const actionSaving = ref(false);
const afIniciativa = ref('');
const afResponsable = ref('');
const afFecha = ref('');
const afDimension = ref('');
const afIniciativaRef = ref(null);
const slideCardRef = ref(null);

const today = new Date().toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });

// ── Computed ───────────────────────────────────────────────────────────
const slides = computed(() => {
  const s = [{ type: 'cover' }];
  if (aiData.value?.narrativa) s.push({ type: 'ai_narrativa' });
  DIMS.forEach(d => s.push({ type: 'dimension', dimKey: d.key }));
  if (aiData.value?.focusSesion) s.push({ type: 'ai_foco' });
  s.push({ type: 'cierre' });
  return s;
});

const slide = computed(() => slides.value[currentSlide.value] ?? { type: 'cover' });

const isFirst = computed(() => currentSlide.value === 0);
const isLast = computed(() => currentSlide.value === slides.value.length - 1);
const progressPct = computed(() => ((currentSlide.value + 1) / slides.value.length * 100).toFixed(1));

const slideTitleLabel = computed(() => {
  const s = slide.value;
  if (s.type === 'cover') return 'Portada';
  if (s.type === 'ai_narrativa') return 'Contexto del equipo';
  if (s.type === 'ai_foco') return 'Foco recomendado';
  if (s.type === 'cierre') return 'Cierre';
  if (s.type === 'dimension') {
    const sec = SECTIONS.find(sec => sec.id === s.dimKey);
    return sec ? sec.title : s.dimKey;
  }
  return '';
});

const globalLevel = computed(() => globalPct.value !== null ? getLevel(globalPct.value) : null);

const hasDimScores = computed(() => Object.keys(dimScores).length > 0);

const slideDim = computed(() => {
  if (slide.value?.type !== 'dimension') return null;
  const key = slide.value.dimKey;
  const dim = DIMS.find(d => d.key === key);
  const sec = SECTIONS.find(s => s.id === key);
  if (!dim || !sec) return null;
  return { dim, sec, scores: dimScores[key] || null };
});

const slideDimLevel = computed(() => {
  const pct = slideDim.value?.scores?.pct;
  return pct != null ? getLevel(pct) : null;
});

const slideCoachingQs = computed(() => {
  const d = slideDim.value;
  if (!d) return [];
  const pct = d.scores?.pct ?? null;
  const lvIdx = pct === null ? 1 : pct <= 33 ? 0 : pct <= 66 ? 1 : 2;
  return (COACHING_QUESTIONS[d.dim.key] || [])[lvIdx] || [];
});

const dimAlerts = computed(() => {
  if (!aiData.value || !Array.isArray(aiData.value.alertas)) return [];
  const key = slide.value?.dimKey;
  if (!key) return [];
  return aiData.value.alertas.filter(a => typeof a === 'string' && a.toLowerCase().includes(key.slice(0, 5)));
});

// ── Actions ────────────────────────────────────────────────────────────
async function doLogin() {
  const email = loginEmail.value.trim();
  const pw = loginPw.value;
  if (!email || !pw) { loginErr.value = 'Ingresa email y contraseña'; return; }
  loginLoading.value = true;
  loginErr.value = '';
  try {
    await signInWithEmailAndPassword(auth, email, pw);
  } catch {
    loginErr.value = 'Email o contraseña incorrectos';
    loginLoading.value = false;
  }
}

function navigate(delta) {
  const next = currentSlide.value + delta;
  if (next < 0 || next >= slides.value.length) return;
  currentSlide.value = next;
  nextTick(() => {
    if (slideCardRef.value) slideCardRef.value.scrollTop = 0;
  });
}

function toggleActionForm() {
  showActionForm.value = !showActionForm.value;
  if (showActionForm.value) {
    nextTick(() => { if (afIniciativaRef.value) afIniciativaRef.value.focus(); });
  }
}

async function saveAction() {
  const iniciativa = afIniciativa.value.trim();
  if (!iniciativa) { if (afIniciativaRef.value) afIniciativaRef.value.focus(); return; }
  const responsable = afResponsable.value.trim();
  const fechaObjetivo = afFecha.value;
  const dimension = afDimension.value;
  const dimLabel = dimension ? (DIMS.find(d => d.key === dimension) || {}).label || dimension : '';

  actionSaving.value = true;
  try {
    await addDoc(collection(db, 'planes'), {
      equipoId: teamId.value,
      equipoNombre: teamName.value || teamId.value,
      iniciativa,
      responsable,
      fechaObjetivo,
      estado: 'pendiente',
      ciclo: cicloNombre.value || '',
      dimension,
      ownerId: workspaceId.value,
      fechaCreacion: serverTimestamp(),
    });
    sessionActions.value.push({ iniciativa, responsable, fechaObjetivo, dimension, dimLabel });
    showActionForm.value = false;
    afIniciativa.value = '';
    afResponsable.value = '';
    afFecha.value = '';
    afDimension.value = '';
  } catch (err) {
    console.error('Error al guardar acción:', err);
    alert('No se pudo guardar la acción. Verifica tu conexión.');
  }
  actionSaving.value = false;
}

function exportSession() {
  const lv = globalPct.value !== null ? getLevel(globalPct.value) : null;
  const dimRows = DIMS.map(d => {
    const sec = SECTIONS.find(s => s.id === d.key);
    const sc = dimScores[d.key];
    const pct = sc ? sc.pct : null;
    const lvIdx = pct === null ? 1 : pct <= 33 ? 0 : pct <= 66 ? 1 : 2;
    const qs = (COACHING_QUESTIONS[d.key] || [])[lvIdx] || [];
    const lvDim = pct !== null ? getLevel(pct) : null;
    const qHtml = qs.map(q => `<li>${q}</li>`).join('');
    return `<div class="dim-block"><div class="dim-head">
      <span class="dim-name">${sec ? sec.title : d.label}</span>
      ${pct !== null ? `<span class="dim-score">${pct}%</span>` : ''}
      ${lvDim ? `<span class="dim-lv">${lvDim.label}</span>` : ''}
    </div>${qHtml ? `<ul class="dim-qs">${qHtml}</ul>` : ''}</div>`;
  }).join('');

  const actionsHtml = sessionActions.value.length ? `<div class="section">
    <div class="section-title">Acciones acordadas en sesión</div>
    <table class="actions-table">
      <thead><tr><th>Acción / Iniciativa</th><th>Responsable</th><th>Fecha</th><th>Dimensión</th></tr></thead>
      <tbody>${sessionActions.value.map(a => `<tr>
        <td>${a.iniciativa}</td><td>${a.responsable || ''}</td>
        <td>${a.fechaObjetivo || ''}</td><td>${a.dimLabel || a.dimension || ''}</td>
      </tr>`).join('')}</tbody>
    </table></div>` : '';

  const blankLines = Array(6).fill('<div class="blank-line"></div>').join('');
  const todayFull = new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<title>Sesión de facilitación — ${teamName.value}</title>
<style>
  body{font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e;margin:0;padding:32px 40px;font-size:13px}
  .header{border-bottom:2px solid #1a4fd6;padding-bottom:16px;margin-bottom:24px}
  .header h1{font-size:22px;margin:0 0 4px}
  .header .meta{font-size:12px;color:#666}
  .global-score{display:inline-block;background:#f0f5ff;border:1.5px solid #1a4fd6;border-radius:8px;padding:8px 18px;margin:12px 0}
  .global-score .num{font-size:28px;font-weight:700;color:#1a4fd6}
  .global-score .lv{font-size:12px;font-weight:700;color:#444;margin-left:8px;text-transform:uppercase;letter-spacing:.06em}
  .section{margin-bottom:24px}
  .section-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#888;margin-bottom:10px;border-bottom:1px solid #e5e7eb;padding-bottom:4px}
  .dims-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .dim-block{border:1px solid #e5e7eb;border-radius:6px;padding:10px 12px}
  .dim-head{display:flex;align-items:center;gap:8px;margin-bottom:6px}
  .dim-name{font-weight:700;font-size:12px;flex:1}
  .dim-score{font-size:16px;font-weight:700;color:#1a4fd6}
  .dim-lv{font-size:10px;color:#888}
  .dim-qs{margin:0;padding-left:16px;font-size:11px;color:#444;line-height:1.7}
  .actions-table{width:100%;border-collapse:collapse;font-size:12px}
  .actions-table th{background:#f3f4f6;font-weight:700;padding:6px 8px;text-align:left;border:1px solid #e5e7eb}
  .actions-table td{padding:6px 8px;border:1px solid #e5e7eb;vertical-align:top}
  .blank-lines{margin-top:12px}
  .blank-line{border-bottom:1px solid #ccc;height:28px;margin-bottom:4px}
  .commit-prompt{font-style:italic;color:#444;margin-bottom:16px;font-size:13px}
  @media print{body{padding:24px}}
</style></head><body>
  <div class="header">
    <h1>${teamName.value || 'Equipo'}</h1>
    <div class="meta">Sesión de facilitación · ${cicloNombre.value || 'Ciclo activo'} · ${todayFull}</div>
    ${globalPct.value !== null ? `<div class="global-score"><span class="num">${globalPct.value}%</span>${lv ? `<span class="lv">${lv.label}</span>` : ''}</div>` : ''}
  </div>
  <div class="section">
    <div class="section-title">Preguntas de coaching por dimensión</div>
    <div class="dims-grid">${dimRows}</div>
  </div>
  ${actionsHtml}
  <div class="section">
    <div class="section-title">Compromisos del equipo</div>
    <p class="commit-prompt">¿Cuál es la acción más importante que el equipo puede comprometerse a hacer antes del próximo Sprint?</p>
    <div class="blank-lines">${blankLines}</div>
  </div>
  <script>window.onload=function(){window.print()}<\/script>
</body></html>`;

  const w = window.open('', '_blank', 'width=900,height=700');
  if (w) { w.document.write(html); w.document.close(); }
}

// ── Data loading ────────────────────────────────────────────────────────
async function loadData(uid, cicloParam) {
  const ownerId = workspaceId.value || uid;

  if (teamId.value) {
    try {
      const tSnap = await getDoc(doc(db, 'equipos', teamId.value));
      teamName.value = tSnap.exists() ? tSnap.data().nombre : teamId.value;
    } catch { teamName.value = teamId.value; }
  }

  if (cicloParam) {
    cicloNombre.value = cicloParam;
  } else {
    try {
      const cSnap = await getDocs(query(collection(db, 'ciclos'), where('ownerId', '==', ownerId)));
      const active = cSnap.docs.find(d => !!d.data().activo);
      cicloNombre.value = active ? active.data().nombre || '' : '';
    } catch { cicloNombre.value = ''; }
  }

  try {
    const constraints = [];
    if (teamId.value) constraints.push(where('equipoId', '==', teamId.value));
    if (cicloNombre.value) constraints.push(where('ciclo', '==', cicloNombre.value));
    const q = constraints.length
      ? query(collection(db, 'respuestas'), ...constraints)
      : collection(db, 'respuestas');
    const rSnap = await getDocs(q);
    const resps = rSnap.docs.map(d => d.data());
    responseCount.value = resps.length;
    if (resps.length) {
      DIMS.forEach(d => {
        const vals = resps.map(r => r[d.storeKey] || 0);
        const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
        dimScores[d.key] = { avg, pct: Math.round((avg / d.max) * 100) };
      });
      globalPct.value = Math.round(resps.reduce((s, r) => s + (r.scoreTotalPct || 0), 0) / resps.length);
    }
  } catch { /* noop */ }

  if (teamId.value && cicloNombre.value) {
    try {
      const aiSnap = await getDoc(doc(db, 'analisis_ia', `${teamId.value}_${cicloNombre.value}`));
      aiData.value = aiSnap.exists() ? aiSnap.data() : null;
    } catch { aiData.value = null; }
  }
}

// ── Keyboard navigation ────────────────────────────────────────────────
function onKeydown(ev) {
  const tag = (ev.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
  if (['ArrowRight', 'ArrowDown', 'PageDown'].includes(ev.key)) {
    navigate(1); ev.preventDefault();
  } else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(ev.key)) {
    navigate(-1); ev.preventDefault();
  } else if (ev.key === 'n' || ev.key === 'N') {
    coachMode.value = !coachMode.value;
  }
}

// ── Init ───────────────────────────────────────────────────────────────
onMounted(() => {
  document.addEventListener('keydown', onKeydown);

  const params = new URLSearchParams(location.search);
  workspaceId.value = params.get('workspaceId') || '';
  teamId.value = params.get('equipoId') || '';
  const cicloParam = params.get('ciclo') || '';

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      screen.value = 'login';
      return;
    }
    if (!teamId.value) {
      screen.value = 'no-team';
      return;
    }
    await loadData(user.uid, cicloParam);
    if (!slides.value.length) {
      screen.value = 'no-data';
      return;
    }
    screen.value = 'presenter';
  });
});

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown);
});
</script>

<style>
:root {
  --ink: #0f1117;
  --ink-muted: #5a5f72;
  --ink-faint: #9198aa;
  --surface: #fafaf8;
  --surface-2: #f2f1ed;
  --border: #dddbd4;
  --accent: #1a4fd6;
  --accent-light: #dce6ff;
  --radius: 12px;
  --radius-sm: 8px;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'DM Sans', sans-serif; background: #0d0f18; color: #f0efe9; height: 100vh; overflow: hidden; }
.fac-root { height: 100vh; display: flex; flex-direction: column; }

/* Login */
.login-wrap { display: flex; align-items: center; justify-content: center; height: 100vh; background: var(--surface); }
.login-card { background: white; border-radius: var(--radius); padding: 36px; max-width: 360px; width: 90%; box-shadow: 0 8px 40px rgba(0,0,0,0.12); }
.login-card h2 { font-family: 'DM Serif Display', serif; font-size: 22px; color: var(--ink); margin-bottom: 6px; }
.login-card p { font-size: 13px; color: var(--ink-muted); margin-bottom: 22px; }
.fg { margin-bottom: 14px; }
.fg label { display: block; font-size: 11px; font-weight: 600; color: var(--ink-muted); margin-bottom: 5px; letter-spacing: 0.04em; text-transform: uppercase; }
.fi { width: 100%; border: 1.5px solid var(--border); border-radius: var(--radius-sm); padding: 9px 12px; font-size: 14px; font-family: inherit; color: var(--ink); background: white; outline: none; }
.fi:focus { border-color: var(--accent); }
.btn-p { display: inline-flex; align-items: center; justify-content: center; padding: 10px 20px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 600; cursor: pointer; border: none; background: var(--accent); color: white; font-family: inherit; }
.btn-p:disabled { opacity: 0.55; cursor: default; }
.lerr { font-size: 12px; color: #c0282a; min-height: 16px; margin-bottom: 10px; }

/* Presenter */
.presenter { display: flex; flex-direction: column; height: 100vh; }
.stage { flex: 1; display: flex; align-items: center; justify-content: center; padding: 32px 40px; overflow: hidden; min-height: 0; }
.slide-card { background: white; border-radius: 18px; padding: clamp(32px,5vw,64px); max-width: 860px; width: 100%; box-shadow: 0 28px 90px rgba(0,0,0,0.5); max-height: 100%; overflow-y: auto; color: var(--ink); }
.slide-card::-webkit-scrollbar { width: 4px; }
.slide-card::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

/* Slide content */
.s-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--accent); margin-bottom: 12px; }
.s-h1 { font-family: 'DM Serif Display', serif; font-size: clamp(30px,5vw,54px); color: var(--ink); line-height: 1.1; margin-bottom: 12px; }
.s-h2 { font-family: 'DM Serif Display', serif; font-size: clamp(22px,3.5vw,38px); color: var(--ink); line-height: 1.2; margin-bottom: 12px; }
.s-meta { font-size: 14px; color: var(--ink-faint); margin-bottom: 20px; }
.score-row { display: flex; align-items: baseline; gap: 14px; margin: 20px 0 6px; }
.score-num { font-family: 'DM Serif Display', serif; font-size: clamp(40px,6vw,68px); line-height: 1; }
.level-tag { font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 4px 12px; border-radius: 99px; }
.dim-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-top: 24px; }
.dim-chip { border-radius: var(--radius-sm); padding: 12px 14px; border: 1.5px solid var(--border); }
.dim-chip-label { font-size: 10px; font-weight: 600; color: var(--ink-faint); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 5px; }
.dim-chip-pct { font-size: 22px; font-weight: 700; }
.q-list { list-style: none; display: flex; flex-direction: column; gap: 14px; margin-top: 26px; }
.q-list li { display: flex; gap: 12px; align-items: flex-start; font-size: clamp(14px,1.8vw,17px); color: var(--ink-muted); line-height: 1.65; }
.q-num { flex-shrink: 0; width: 26px; height: 26px; border-radius: 99px; background: var(--accent-light); color: var(--accent); font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; margin-top: 3px; }
.s-text { font-size: clamp(14px,1.8vw,16px); color: var(--ink-muted); line-height: 1.85; white-space: pre-wrap; margin-top: 22px; }
.cierre-q { font-family: 'DM Serif Display', serif; font-size: clamp(18px,2.5vw,28px); color: var(--ink); line-height: 1.45; font-style: italic; margin-top: 22px; padding: 24px 28px; background: var(--surface-2); border-radius: var(--radius); border-left: 4px solid var(--accent); }
.s-caption { font-size: 13px; color: var(--ink-faint); margin-top: 10px; }

/* Control bar */
.ctrlbar { background: rgba(255,255,255,0.05); border-top: 1px solid rgba(255,255,255,0.07); padding: 12px 24px; display: flex; align-items: center; gap: 10px; flex-shrink: 0; position: relative; }
.progress-rail { position: absolute; top: 0; left: 0; right: 0; height: 2px; background: rgba(255,255,255,0.07); }
.progress-bar { height: 100%; background: var(--accent); transition: width 0.28s; }
.cb-btn { padding: 7px 15px; border-radius: var(--radius-sm); font-size: 12px; font-weight: 600; cursor: pointer; border: 1.5px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.06); color: #d8d7d0; font-family: inherit; transition: background 0.15s; white-space: nowrap; }
.cb-btn:hover:not(:disabled) { background: rgba(255,255,255,0.12); }
.cb-btn:disabled { opacity: 0.3; cursor: default; }
.cb-btn.on { background: rgba(26,79,214,0.3); border-color: rgba(26,79,214,0.55); color: #93b4ff; }
.cb-center { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; }
.cb-title { font-size: 12px; color: rgba(255,255,255,0.45); text-align: center; }
.cb-counter { font-size: 11px; color: rgba(255,255,255,0.25); font-weight: 600; letter-spacing: 0.06em; }

/* Notes panel */
.notes-panel { background: linear-gradient(180deg,#14172280 0%,#0d0f18 100%); border-top: 1px solid rgba(255,255,255,0.06); padding: 16px 28px 20px; max-height: 200px; overflow-y: auto; flex-shrink: 0; animation: slidein 0.2s ease; }
@keyframes slidein { from{transform:translateY(10px);opacity:0} to{transform:translateY(0);opacity:1} }
.notes-panel::-webkit-scrollbar { width: 3px; }
.notes-panel::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); }
.n-header { font-size: 9px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(255,255,255,0.25); margin-bottom: 8px; margin-top: 12px; }
.n-header:first-child { margin-top: 0; }
.n-item { font-size: 12px; color: rgba(255,255,255,0.6); line-height: 1.75; padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
.n-item:last-child { border-bottom: none; }
.n-item strong { color: rgba(255,255,255,0.85); }
.n-ai { font-size: 12px; color: rgba(147,180,255,0.7); line-height: 1.75; white-space: pre-wrap; }
.n-warn { color: rgba(255,170,80,0.75) !important; }
.n-empty { font-size: 12px; color: rgba(255,255,255,0.2); font-style: italic; }
.kbd { background: rgba(255,255,255,0.1); border-radius: 3px; padding: 1px 5px; font-size: 10px; font-family: monospace; color: rgba(255,255,255,0.4); }

/* Loading / error states */
.loading-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; gap: 10px; }
.loading-screen p { font-size: 14px; color: rgba(255,255,255,0.35); }
.loading-screen p.sub { font-size: 12px; color: rgba(255,255,255,0.2); }

/* Action form */
.action-section { margin-top: 28px; border-top: 1.5px solid var(--border); padding-top: 22px; }
.action-toggle { display: inline-flex; align-items: center; gap: 7px; padding: 8px 16px; border-radius: var(--radius-sm); border: 1.5px solid var(--accent); background: var(--accent-light); color: var(--accent); font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
.action-toggle:hover { background: #c8d9ff; }
.action-form { margin-top: 16px; display: flex; flex-direction: column; gap: 12px; background: var(--surface-2); border-radius: var(--radius); padding: 18px 20px; }
.af-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.af-field { display: flex; flex-direction: column; gap: 5px; }
.af-field label { font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-faint); }
.af-field input, .af-field select { border: 1.5px solid var(--border); border-radius: var(--radius-sm); padding: 8px 10px; font-size: 13px; font-family: inherit; color: var(--ink); background: white; outline: none; }
.af-field input:focus, .af-field select:focus { border-color: var(--accent); }
.af-save { align-self: flex-end; padding: 9px 20px; border-radius: var(--radius-sm); background: var(--accent); color: white; border: none; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
.af-save:disabled { opacity: 0.5; cursor: default; }
.action-list { margin-top: 16px; display: flex; flex-direction: column; gap: 8px; }
.action-item { display: flex; align-items: flex-start; gap: 10px; padding: 10px 14px; border-radius: var(--radius-sm); background: #f0faf3; border: 1.5px solid #c3e8cc; }
.action-check { color: #2d9b52; font-size: 14px; flex-shrink: 0; margin-top: 1px; }
.action-text { flex: 1; }
.action-text strong { font-size: 13px; color: var(--ink); display: block; margin-bottom: 2px; }
.action-text span { font-size: 11px; color: var(--ink-faint); }
</style>
