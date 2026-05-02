<template>
  <div class="shell">
    <div class="header">
      <div class="header-eyebrow">{{ branding.marca || 'Scrum Guide Standard' }}</div>
      <h1>
        <img v-if="branding.logoUrl" :src="branding.logoUrl" :alt="branding.marca || ''"
          style="max-height:48px;max-width:200px;object-fit:contain;display:block;" />
        <template v-else-if="branding.marca">{{ branding.marca }}</template>
        <template v-else>Assessment de<br />Madurez Agile</template>
      </h1>
      <p>Evaluación del nivel de adopción de Scrum para Product Owners y Dev Teams. 20 preguntas · ~12 minutos.</p>
    </div>

    <!-- Loading -->
    <div v-if="screen === 'loading'" style="text-align:center;padding:80px 20px;color:var(--ink-faint);font-size:15px;">
      Cargando…
    </div>

    <!-- Link inválido -->
    <div v-else-if="screen === 'invalid'" style="text-align:center;padding:64px 20px;">
      <div style="font-size:40px;margin-bottom:20px;">🔗</div>
      <h2 style="font-family:'DM Serif Display',serif;font-size:22px;margin-bottom:12px;">Link incompleto</h2>
      <p style="font-size:15px;color:var(--ink-muted);max-width:380px;margin:0 auto;line-height:1.7;">
        Para completar el assessment, usa el link específico que te envió tu coach.<br />
        <span style="font-size:13px;color:var(--ink-faint);">Ese link incluye el código de tu equipo y workspace.</span>
      </p>
    </div>

    <!-- Briefing -->
    <div v-else-if="screen === 'briefing'" style="padding:8px 0;">
      <div style="font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:var(--accent);margin-bottom:16px;">
        Antes de comenzar
      </div>
      <div style="font-size:16px;line-height:1.75;color:var(--ink-muted);white-space:pre-wrap;">{{ briefingTexto }}</div>
      <div class="nav" style="border-top:none;padding-top:0;margin-top:32px;">
        <button class="btn primary" @click="screen = 'intro'">Entendido, comenzar →</button>
      </div>
    </div>

    <!-- Intro -->
    <div v-else-if="screen === 'intro'" class="intro">
      <div class="intro-cards">
        <div class="intro-card">
          <div class="intro-card-icon">📋</div>
          <div class="intro-card-title">20 preguntas</div>
          <div class="intro-card-desc">6 dimensiones de madurez Scrum</div>
        </div>
        <div class="intro-card">
          <div class="intro-card-icon">⏱</div>
          <div class="intro-card-title">~12 minutos</div>
          <div class="intro-card-desc">Sin necesidad de cuenta ni login</div>
        </div>
        <div class="intro-card">
          <div class="intro-card-icon">📊</div>
          <div class="intro-card-title">Resultado inmediato</div>
          <div class="intro-card-desc">Score por dimensión + recomendaciones</div>
        </div>
        <div class="intro-card">
          <div class="intro-card-icon">☁️</div>
          <div class="intro-card-title">Resultados guardados</div>
          <div class="intro-card-desc">Análisis organizacional disponible</div>
        </div>
      </div>

      <div class="field-group">
        <label>¿A qué equipo perteneces?</label>
        <div v-if="teams.length === 0" class="teams-loading">Cargando equipos…</div>
        <select v-else class="field-input" :value="teamId" @change="onTeamChange">
          <option value="">— Selecciona tu equipo —</option>
          <option v-for="t in teams" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
      </div>

      <div v-if="anonymityMode !== 'full'" class="field-group">
        <label>
          {{ anonymityMode === 'nominal' ? 'Tu nombre' : 'Identificador de rol' }}
          <span style="color:var(--ink-faint);font-weight:400">(opcional)</span>
        </label>
        <input class="field-input" type="text"
          :placeholder="anonymityMode === 'nominal' ? 'Ej. María García' : 'Ej. Dev1, Dev2'"
          v-model="participantName" autocomplete="off" />
      </div>

      <div class="role-select">
        <label>¿Cuál es tu rol en el equipo?</label>
        <div class="role-opts">
          <button v-for="r in ['Product Owner', 'Dev Team', 'Scrum Master', 'Otro']" :key="r"
            class="role-btn" :class="{ selected: role === r }" @click="role = r">{{ r }}</button>
        </div>
        <p v-if="role === 'Scrum Master'" style="margin-top:12px;font-size:13px;color:var(--amber);background:var(--amber-light);border-radius:var(--radius-sm);padding:10px 14px;">
          Como Scrum Master, responde desde la perspectiva del equipo completo. Las preguntas evalúan las prácticas del equipo, no solo las tuyas.
        </p>
        <p v-if="alreadyAnswered" style="margin-top:10px;font-size:13px;color:var(--accent);background:var(--accent-light);border-radius:var(--radius-sm);padding:10px 14px;">
          Ya respondiste el assessment en el ciclo <strong>{{ cicloNombre }}</strong>. Puedes volver a responder si quieres actualizar tu respuesta.
        </p>
      </div>

      <div style="background:var(--surface-2);border-left:3px solid var(--accent);border-radius:0 var(--radius-sm) var(--radius-sm) 0;padding:10px 14px;margin-top:16px;font-size:13px;color:var(--ink-muted);line-height:1.6;">
        <template v-if="guidanceText">{{ guidanceText }}</template>
        <template v-else>
          Este assessment está diseñado para completarse de forma <strong>individual</strong>, sin coordinarlo con tus compañeros.
          {{ anonMsgFull }} No hay respuestas correctas o incorrectas.
        </template>
      </div>

      <div class="nav" style="border-top:none;padding-top:0;margin-top:28px;">
        <button class="btn primary" @click="startAssessment" :disabled="!canStart">Comenzar assessment →</button>
      </div>
    </div>

    <!-- Contexto del equipo -->
    <div v-else-if="screen === 'context'" class="intro">
      <div style="font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:var(--accent);margin-bottom:12px;">Contexto del equipo</div>
      <p style="font-size:15px;color:var(--ink-muted);margin-bottom:28px;line-height:1.65;">
        Estas preguntas ayudan a personalizar el assessment. La primera adapta la sección Excelencia Técnica a tu tipo de equipo.
      </p>

      <div class="field-group">
        <label>¿El equipo trabaja en desarrollo de software?
          <span style="background:#eef2ff;color:#1a4fd6;font-size:10px;font-weight:600;padding:1px 8px;border-radius:99px;margin-left:6px;">Adapta las preguntas técnicas</span>
        </label>
        <div class="role-opts" style="flex-wrap:wrap;margin-top:6px;">
          <button v-for="o in ['Sí', 'No']" :key="o" class="role-btn" :class="{ selected: teamType === o }" @click="teamType = o">{{ o }}</button>
        </div>
      </div>

      <div v-for="{ label, opts, model } in contextFields" :key="label" class="field-group">
        <label>{{ label }} <span style="color:var(--ink-faint);font-weight:400">(opcional)</span></label>
        <div class="role-opts" style="flex-wrap:wrap;margin-top:6px;">
          <button v-for="o in opts" :key="o" class="role-btn" :class="{ selected: contextValues[model] === o }"
            @click="contextValues[model] = o">{{ o }}</button>
        </div>
      </div>

      <div class="nav" style="border-top:none;padding-top:0;margin-top:8px;">
        <button class="btn" @click="screen = 'intro'">← Volver</button>
        <button class="btn primary" @click="startContext">Comenzar assessment →</button>
      </div>
    </div>

    <!-- Sección de preguntas -->
    <div v-else-if="screen === 'section'">
      <div class="progress-wrap">
        <div class="progress-meta">
          <span class="progress-label">{{ sec.tag }}</span>
          <span class="progress-count">{{ answeredCount }}/{{ totalQ }} respondidas</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: progressPct + '%' }"></div>
        </div>
      </div>

      <div class="section-chip">{{ sec.tag }}<span class="role-tag">{{ sec.role }}</span></div>
      <div class="section-title">
        {{ sec.title }}
        <span v-if="sec.id === 'tecnico' && teamType === 'No'"
          style="display:inline-block;background:#eef2ff;color:#1a4fd6;font-size:11px;font-weight:600;padding:1px 8px;border-radius:99px;margin-left:8px;vertical-align:middle;">
          Equipo no-software
        </span>
      </div>
      <div class="section-desc">{{ secDesc }}</div>

      <p v-if="sectionNote" style="margin:0 0 20px;font-size:13px;color:var(--accent-dark);background:var(--accent-light);border-radius:var(--radius-sm);padding:10px 14px;">
        <strong>Nota:</strong> {{ sectionNote }}
      </p>

      <div v-for="({ q, qi }, idx) in activeQs" :key="`${sec.id}_${qi}`" class="question">
        <div class="question-text">
          <span class="question-num">P{{ idx + 1 }}</span>{{ qText(sec.id, qi, q.text) }}
        </div>
        <div class="options" role="radiogroup" :aria-label="qText(sec.id, qi, q.text)">
          <button v-for="(opt, oi) in q.opts" :key="oi"
            class="option" :class="{ selected: answers[`${sec.id}_${qi}`] === oi }"
            role="radio" :aria-checked="answers[`${sec.id}_${qi}`] === oi"
            @click="pick(`${sec.id}_${qi}`, oi)">
            <span class="option-score">{{ oi + 1 }}</span>
            <span class="option-label">{{ opt }}</span>
          </button>
        </div>
      </div>

      <!-- Preguntas personalizadas -->
      <div v-for="(cq, cidx) in customQs" :key="cq.id"
        class="question" style="border-top:2px dashed var(--border);padding-top:20px;margin-top:4px;">
        <div style="font-size:10px;font-weight:600;color:var(--accent);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:6px;">Pregunta adicional</div>
        <div class="question-text">
          <span class="question-num">P{{ activeQs.length + cidx + 1 }}</span>{{ cq.texto }}
        </div>
        <div class="options" role="radiogroup">
          <button v-for="(opt, oi) in cq.opts.filter(Boolean)" :key="oi"
            class="option" :class="{ selected: customAnswers[cq.id] === oi }"
            role="radio" :aria-checked="customAnswers[cq.id] === oi"
            @click="pickCustom(cq.id, oi)">
            <span class="option-score">{{ oi + 1 }}</span>
            <span class="option-label">{{ opt }}</span>
          </button>
        </div>
      </div>

      <div class="open-question">
        <label style="font-size:14px;display:block;margin-bottom:8px;">
          <strong style="font-weight:500;color:var(--ink);">Comentario abierto</strong>
          <span style="color:var(--ink-faint);font-weight:400;"> — ¿Qué está bloqueando más a tu equipo en esta área? (opcional)</span>
        </label>
        <textarea class="field-input" placeholder="Escribe tu observación aquí…"
          :value="openTexts[sec.id] || ''"
          @input="openTexts[sec.id] = $event.target.value"></textarea>
      </div>

      <div class="nav">
        <button v-if="currentSection > 0" class="btn" @click="prev">← Anterior</button>
        <button class="btn primary" :disabled="!secDone" @click="onNext">
          {{ nextLabel }}
        </button>
      </div>
    </div>

    <!-- Salud del equipo -->
    <div v-else-if="screen === 'health'">
      <div class="progress-wrap">
        <div class="progress-meta">
          <span class="progress-label" style="color:var(--green);">Salud del equipo</span>
          <span class="progress-count">{{ Object.keys(healthAnswers).length }}/{{ HEALTH_QUESTIONS.length }} respondidas</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width:100%;background:var(--green);"></div>
        </div>
      </div>

      <div class="section-chip" style="background:var(--green-light);color:var(--green);">
        Sección adicional<span class="role-tag" style="background:var(--green);color:#fff;">Todo el equipo</span>
      </div>
      <div class="section-title">Seguridad psicológica del equipo</div>
      <div class="section-desc">Estas 3 preguntas son opcionales. Evalúan el clima de confianza del equipo. Los resultados son independientes del score de madurez Scrum.</div>

      <div v-for="(hq, qi) in HEALTH_QUESTIONS" :key="hq.id" class="question">
        <div class="question-text"><span class="question-num">P{{ qi + 1 }}</span>{{ hq.text }}</div>
        <div class="options" role="radiogroup">
          <button v-for="(opt, oi) in hq.opts" :key="oi"
            class="option" :class="{ selected: healthAnswers[hq.id] === oi }"
            role="radio" :aria-checked="healthAnswers[hq.id] === oi"
            @click="healthAnswers[hq.id] = oi">
            <span class="option-score">{{ oi + 1 }}</span>
            <span class="option-label">{{ opt }}</span>
          </button>
        </div>
      </div>

      <div class="nav">
        <button class="btn" @click="backFromHealth">← Volver</button>
        <button class="btn primary" :disabled="!healthDone" @click="showResults">Ver resultados →</button>
      </div>
    </div>

    <!-- Resultados / gracias -->
    <div v-else-if="screen === 'results'" style="text-align:center;padding:56px 0 40px;">
      <div style="width:72px;height:72px;border-radius:50%;background:var(--green-light);display:flex;align-items:center;justify-content:center;margin:0 auto 28px;font-size:32px;color:var(--green);">✓</div>
      <h2 style="font-family:'DM Serif Display',serif;font-size:clamp(24px,4vw,32px);line-height:1.15;margin-bottom:14px;">¡Gracias por completar<br>el assessment!</h2>
      <p style="font-size:15px;color:var(--ink-muted);max-width:420px;margin:0 auto 32px;line-height:1.7;">Tu respuesta ha sido registrada. El líder del equipo tendrá acceso al análisis de resultados y las recomendaciones de mejora.</p>
      <p v-if="submitStatus === 'sending'" style="font-size:13px;color:var(--ink-faint);margin-bottom:20px;">Guardando respuesta…</p>
      <p v-else-if="submitStatus === 'ok'" style="font-size:13px;color:var(--green);margin-bottom:20px;">✓ Respuesta guardada correctamente.</p>
      <p v-else-if="submitStatus === 'error'" style="font-size:13px;color:var(--red);margin-bottom:20px;">
        Error al guardar.
        <button class="btn" @click="submitResults" style="padding:3px 10px;font-size:12px;margin-left:6px;">Reintentar</button>
      </p>
      <button class="btn" @click="restart">← Hacer otro assessment</button>
    </div>

    <!-- Footer de anonimato (fixed) -->
    <div v-if="showAnonFooter" class="anon-footer">
      <span style="margin-right:6px;">🔒</span>{{ anonMsg }}
      <span v-if="aiEnabled" style="color:var(--ink-faint);"> · Los comentarios pueden analizarse de forma agregada por IA para generar recomendaciones. Nunca se identifican autores.</span>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { collection, query, where, getDocs, getDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase.js';
import { SECTIONS, HEALTH_QUESTIONS, getLevel } from '../../assessment-config.js';

const screen = ref('loading');
const currentSection = ref(0);
const answers = reactive({});
const customAnswers = reactive({});
const role = ref('');
const teams = ref([]);
const teamId = ref('');
const teamName = ref('');
const participantName = ref('');
const submitStatus = ref('');
const cicloNombre = ref('');
const teamSize = ref('');
const teamAge = ref('');
const dedicatedPO = ref('');
const workMode = ref('');
const teamType = ref('');
const openTexts = reactive({});
const startedAt = ref(null);
const briefingTexto = ref('');
const anonymityMode = ref('full');
const aiEnabled = ref(false);
const healthEnabled = ref(false);
const healthAnswers = reactive({});
const guidanceText = ref('');
const wsConfig = reactive({ questionOverrides: {}, customQuestions: {} });
const branding = reactive({ marca: '', logoUrl: '', colorAcento: '' });

let wsId = '';

// ── Context fields config ──────────────────────────────────────────────
const contextFields = [
  { label: '¿Cuánto tiempo lleva el equipo trabajando con Scrum?', opts: ['< 3 meses', '3–12 meses', '1–2 años', '> 2 años'], model: 'teamAge' },
  { label: '¿Cuántas personas hay en el equipo?', opts: ['3–5', '6–8', '9+'], model: 'teamSize' },
  { label: '¿El Product Owner tiene dedicación exclusiva a este equipo?', opts: ['Sí', 'No', 'Compartido'], model: 'dedicatedPO' },
  { label: '¿Cómo trabaja el equipo?', opts: ['Presencial', 'Híbrido', 'Totalmente remoto'], model: 'workMode' },
];

// Proxy so v-for can read/write context pill values by model name
const contextValues = new Proxy({}, {
  get(_, key) {
    if (key === 'teamAge') return teamAge.value;
    if (key === 'teamSize') return teamSize.value;
    if (key === 'dedicatedPO') return dedicatedPO.value;
    if (key === 'workMode') return workMode.value;
    return undefined;
  },
  set(_, key, val) {
    if (key === 'teamAge') teamAge.value = val;
    else if (key === 'teamSize') teamSize.value = val;
    else if (key === 'dedicatedPO') dedicatedPO.value = val;
    else if (key === 'workMode') workMode.value = val;
    return true;
  },
});

// ── Computed ──────────────────────────────────────────────────────────
const sec = computed(() => SECTIONS[currentSection.value] ?? SECTIONS[0]);

const activeQs = computed(() => {
  const ov = wsConfig.questionOverrides;
  const secId = sec.value.id;
  const qs = secId === 'tecnico' && teamType.value === 'No' && sec.value.altQuestions
    ? sec.value.altQuestions
    : sec.value.questions;
  return qs.map((q, qi) => ({ q, qi })).filter(({ qi }) => !(ov[`${secId}_${qi}`] || {}).disabled);
});

const customQs = computed(() => {
  return ((wsConfig.customQuestions || {})[sec.value.id] || [])
    .filter(cq => cq.texto && cq.opts.filter(Boolean).length >= 2);
});

const totalQ = computed(() => {
  const ov = wsConfig.questionOverrides || {};
  return SECTIONS.reduce((a, s) => {
    const qs = s.id === 'tecnico' && teamType.value === 'No' && s.altQuestions ? s.altQuestions : s.questions;
    return a + qs.filter((_, qi) => !(ov[`${s.id}_${qi}`] || {}).disabled).length;
  }, 0);
});

const answeredCount = computed(() => Object.keys(answers).length);
const progressPct = computed(() => totalQ.value > 0 ? Math.round((answeredCount.value / totalQ.value) * 100) : 0);

const secDone = computed(() =>
  activeQs.value.every(({ qi }) => answers[`${sec.value.id}_${qi}`] !== undefined)
);

const isLastSection = computed(() => currentSection.value === SECTIONS.length - 1);

const nextLabel = computed(() => {
  if (!isLastSection.value) return 'Siguiente →';
  return healthEnabled.value ? 'Siguiente: Salud del equipo →' : 'Ver resultados →';
});

const canStart = computed(() => !!(role.value && teamId.value));

const alreadyAnswered = computed(() => {
  try {
    return !!(teamId.value && cicloNombre.value &&
      localStorage.getItem(`assessment_${cicloNombre.value}_${teamId.value}`));
  } catch { return false; }
});

const healthDone = computed(() => HEALTH_QUESTIONS.every(q => healthAnswers[q.id] !== undefined));

const showAnonFooter = computed(() => ['intro', 'context', 'section', 'health'].includes(screen.value));

const anonMsg = computed(() => {
  const msgs = {
    full: 'Tus respuestas son completamente anónimas. Solo se registra tu rol.',
    semi: 'Tus respuestas se guardan con un identificador de rol. El coach no ve tu nombre.',
    nominal: 'Tus respuestas están vinculadas a tu nombre.',
  };
  return msgs[anonymityMode.value] || msgs.full;
});

const anonMsgFull = computed(() => {
  if (anonymityMode.value === 'full') return 'Tus respuestas son completamente anónimas.';
  if (anonymityMode.value === 'semi') return 'Tus respuestas se guardan con un identificador de rol.';
  return 'Tus respuestas están vinculadas a tu nombre.';
});

const sectionNote = computed(() => {
  if (!sec.value) return '';
  const notes = {
    'Product Owner': {
      'Dev Team': 'Responde desde lo que has observado sobre cómo se gestiona el backlog y la relación con el PO.',
      'Scrum Master': 'Responde desde tu perspectiva como facilitador de la relación entre el PO y el equipo.',
      'Otro': 'Responde desde lo que has podido observar en el equipo.',
    },
    'Dev Team': {
      'Product Owner': 'Responde desde lo que has podido observar sobre las prácticas del equipo de desarrollo.',
      'Scrum Master': 'Responde desde tu perspectiva como facilitador del equipo.',
      'Otro': 'Responde desde lo que has podido observar en el equipo.',
    },
    'PO + Dev Team': {
      'Scrum Master': 'Responde desde tu perspectiva como facilitador: observas estas prácticas de cerca y tu percepción es valiosa.',
      'Otro': 'Responde desde lo que has podido observar en el equipo.',
    },
  };
  return notes[sec.value.role]?.[role.value] || '';
});

const secDesc = computed(() => {
  const s = sec.value;
  return s.id === 'tecnico' && teamType.value === 'No' && s.altDesc ? s.altDesc : s.desc;
});

// ── Helpers ────────────────────────────────────────────────────────────
function qText(secId, qi, defaultText) {
  return wsConfig.questionOverrides[`${secId}_${qi}`]?.texto || defaultText;
}

// ── Actions ────────────────────────────────────────────────────────────
function onTeamChange(e) {
  const id = e.target.value;
  const t = teams.value.find(t => t.id === id);
  teamId.value = id;
  teamName.value = t ? t.name : '';
}

function pick(key, val) {
  answers[key] = val;
}

function pickCustom(cqId, val) {
  customAnswers[cqId] = val;
}

function startAssessment() {
  if (!canStart.value) return;
  screen.value = 'context';
}

function startContext() {
  screen.value = 'section';
  currentSection.value = 0;
  startedAt.value = Date.now();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function next() {
  currentSection.value++;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function prev() {
  currentSection.value--;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function onNext() {
  if (isLastSection.value) {
    healthEnabled.value ? goToHealth() : showResults();
  } else {
    next();
  }
}

function goToHealth() {
  screen.value = 'health';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function backFromHealth() {
  screen.value = 'section';
  currentSection.value = SECTIONS.length - 1;
}

function showResults() {
  screen.value = 'results';
  submitStatus.value = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
  submitResults();
}

function restart() {
  screen.value = briefingTexto.value.trim() ? 'briefing' : 'intro';
  currentSection.value = 0;
  Object.keys(answers).forEach(k => delete answers[k]);
  Object.keys(customAnswers).forEach(k => delete customAnswers[k]);
  Object.keys(openTexts).forEach(k => delete openTexts[k]);
  Object.keys(healthAnswers).forEach(k => delete healthAnswers[k]);
  role.value = '';
  teamId.value = '';
  teamName.value = '';
  participantName.value = '';
  submitStatus.value = '';
  teamSize.value = '';
  teamAge.value = '';
  dedicatedPO.value = '';
  workMode.value = '';
  teamType.value = '';
  startedAt.value = null;
}

function calcResults() {
  let total = 0, max = 0;
  const dims = {};
  const ov = wsConfig.questionOverrides || {};
  SECTIONS.forEach((s) => {
    let wSum = 0, wMax = 0;
    const qs = s.id === 'tecnico' && teamType.value === 'No' && s.altQuestions ? s.altQuestions : s.questions;
    qs.forEach((q, qi) => {
      if ((ov[`${s.id}_${qi}`] || {}).disabled) return;
      const w = q.weight || 1;
      wMax += 3 * w;
      wSum += (answers[`${s.id}_${qi}`] || 0) * w;
    });
    const dimMax = wMax > 0 ? wMax : qs.length * 3;
    const score = wMax > 0 ? Math.round((wSum / wMax) * dimMax) : 0;
    dims[s.id] = { score, max: dimMax, pct: Math.round((score / dimMax) * 100), name: s.title };
    total += score;
    max += dimMax;
  });
  return { total, max, pct: Math.round((total / max) * 100), dims };
}

async function submitResults() {
  if (submitStatus.value === 'ok' || submitStatus.value === 'sending') return;
  submitStatus.value = 'sending';

  const { pct, dims } = calcResults();
  const level = getLevel(pct);

  try {
    let cicloFinal = cicloNombre.value;
    if (!cicloFinal && wsId) {
      const cSnap = await getDocs(query(collection(db, 'ciclos'), where('ownerId', '==', wsId)));
      const active = cSnap.docs.find(d => !!d.data().activo);
      cicloFinal = active ? active.data().nombre || '' : '';
    }

    const respDoc = {
      equipoId: teamId.value,
      equipoNombre: teamName.value,
      participante: participantName.value.trim() || 'Anónimo',
      rol: role.value,
      ciclo: cicloFinal,
      tamanoEquipo: '',
      tiempoScrum: '',
      teamAge: teamAge.value || '',
      teamSize: teamSize.value || '',
      dedicatedPO: dedicatedPO.value || '',
      workMode: workMode.value || '',
      teamType: teamType.value === 'No' ? 'knowledge' : 'software',
      scoreTotalPct: pct,
      nivel: level.label,
      answers: { ...answers },
      comments: { ...openTexts },
      customAnswers: { ...customAnswers },
      fecha: serverTimestamp(),
    };

    // Scores por dimensión
    SECTIONS.forEach(s => {
      respDoc[s.storeKey || s.id] = dims[s.id] ? dims[s.id].score : 0;
    });

    const completionSeconds = startedAt.value ? Math.round((Date.now() - startedAt.value) / 1000) : null;
    if (completionSeconds !== null) respDoc.completionSeconds = completionSeconds;
    if (completionSeconds !== null && completionSeconds < 180) respDoc.flaggedFast = true;

    if (healthEnabled.value && Object.keys(healthAnswers).length > 0) {
      const hSum = Object.values(healthAnswers).reduce((a, b) => a + b, 0);
      respDoc.teamHealthScore = Math.round((hSum / (HEALTH_QUESTIONS.length * 3)) * 100);
      respDoc.healthAnswers = { ...healthAnswers };
    }

    await addDoc(collection(db, 'respuestas'), respDoc);
    submitStatus.value = 'ok';

    try { localStorage.setItem(`assessment_${cicloFinal}_${teamId.value}`, '1'); } catch { /* noop */ }
  } catch {
    submitStatus.value = 'error';
  }
}

// ── Init ───────────────────────────────────────────────────────────────
watch(() => branding.colorAcento, (c) => {
  if (c) document.documentElement.style.setProperty('--accent', c);
}, { immediate: true });

onMounted(async () => {
  const params = new URLSearchParams(window.location.search);
  wsId = params.get('workspaceId') || '';

  if (!wsId) {
    screen.value = 'invalid';
    return;
  }

  try {
    const tSnap = await getDocs(query(collection(db, 'equipos'), where('ownerId', '==', wsId)));
    teams.value = tSnap.docs
      .filter(d => d.data().activo === true)
      .map(d => ({ id: d.id, name: d.data().nombre }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch { teams.value = []; }

  try {
    const cSnap = await getDocs(query(collection(db, 'ciclos'), where('ownerId', '==', wsId)));
    const active = cSnap.docs.find(d => !!d.data().activo);
    cicloNombre.value = active ? active.data().nombre || '' : '';
  } catch { cicloNombre.value = ''; }

  // Pre-seleccionar equipo desde URL param (QR / link directo)
  const presetId = params.get('equipoId') || params.get('teamId');
  if (presetId) {
    const found = teams.value.find(t => t.id === presetId);
    if (found) { teamId.value = found.id; teamName.value = found.name; }
  }

  try {
    const wsSnap = await getDoc(doc(db, 'workspaces', wsId));
    const d = wsSnap.exists() ? wsSnap.data() : {};
    briefingTexto.value = d.briefingTexto || '';
    anonymityMode.value = d.anonymityMode || 'full';
    aiEnabled.value = d.aiEnabled || false;
    healthEnabled.value = d.teamHealthEnabled || false;
    guidanceText.value = d.guidanceText || '';
    if (d.colorAcento) branding.colorAcento = d.colorAcento;
    if (d.marca) branding.marca = d.marca;
    if (d.logoUrl) branding.logoUrl = d.logoUrl;
  } catch { briefingTexto.value = ''; }

  try {
    const cfgSnap = await getDoc(doc(db, 'configuraciones', wsId));
    if (cfgSnap.exists()) {
      wsConfig.questionOverrides = cfgSnap.data().questionOverrides || {};
      wsConfig.customQuestions = cfgSnap.data().customQuestions || {};
    }
  } catch {
    wsConfig.questionOverrides = {};
    wsConfig.customQuestions = {};
  }

  screen.value = briefingTexto.value.trim() ? 'briefing' : 'intro';
});
</script>

<style>
:root {
  --ink: #0f1117;
  --ink-muted: #5a5f72;
  --ink-faint: #9198aa;
  --surface: #fafaf8;
  --surface-2: #f2f1ed;
  --surface-3: #e8e7e1;
  --accent: #1a4fd6;
  --accent-light: #dce6ff;
  --accent-dark: #0f35a0;
  --green: #0d7a52;
  --green-light: #d4f0e5;
  --amber: #a05c0a;
  --amber-light: #fdefd6;
  --red: #c0282a;
  --red-light: #fce8e8;
  --border: #dddbd4;
  --radius: 12px;
  --radius-sm: 8px;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'DM Sans', sans-serif; background: var(--surface); color: var(--ink); min-height: 100vh; font-size: 16px; line-height: 1.6; }
.shell { max-width: 720px; margin: 0 auto; padding: 0 20px 100px; }
.header { padding: 48px 0 40px; border-bottom: 1px solid var(--border); margin-bottom: 40px; }
.header-eyebrow { font-size: 12px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent); margin-bottom: 12px; }
.header h1 { font-family: 'DM Serif Display', serif; font-size: clamp(28px, 5vw, 44px); line-height: 1.1; color: var(--ink); margin-bottom: 14px; }
.header p { font-size: 16px; color: var(--ink-muted); max-width: 520px; line-height: 1.65; }
.progress-wrap { margin-bottom: 36px; }
.progress-meta { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px; }
.progress-label { font-size: 13px; font-weight: 500; color: var(--ink-muted); }
.progress-count { font-size: 13px; color: var(--ink-faint); }
.progress-track { height: 3px; background: var(--surface-3); border-radius: 99px; overflow: hidden; }
.progress-fill { height: 100%; background: var(--accent); border-radius: 99px; transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
.section-chip { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent); background: var(--accent-light); padding: 4px 10px; border-radius: 99px; margin-bottom: 10px; }
.section-title { font-family: 'DM Serif Display', serif; font-size: 22px; color: var(--ink); margin-bottom: 6px; }
.section-desc { font-size: 14px; color: var(--ink-muted); margin-bottom: 28px; }
.role-tag { font-size: 11px; font-weight: 500; color: var(--ink-faint); background: var(--surface-2); border: 1px solid var(--border); padding: 2px 8px; border-radius: 99px; margin-left: 8px; }
.question { margin-bottom: 24px; }
.question-text { font-size: 15px; font-weight: 500; color: var(--ink); margin-bottom: 12px; line-height: 1.5; }
.question-num { font-size: 11px; font-weight: 600; color: var(--accent); margin-right: 6px; }
.options { display: flex; flex-direction: column; gap: 8px; }
.option { display: flex; align-items: flex-start; gap: 12px; padding: 12px 14px; background: white; border: 1.5px solid var(--border); border-radius: var(--radius-sm); cursor: pointer; transition: border-color 0.15s, background 0.15s, transform 0.1s; text-align: left; width: 100%; font-family: 'DM Sans', sans-serif; }
.option:hover { border-color: var(--accent); background: var(--accent-light); transform: translateX(2px); }
.option.selected { border-color: var(--accent); background: var(--accent-light); }
.option-score { width: 22px; height: 22px; border-radius: 50%; background: var(--surface-2); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; color: var(--ink-faint); flex-shrink: 0; margin-top: 1px; transition: background 0.15s, color 0.15s, border-color 0.15s; }
.option.selected .option-score { background: var(--accent); color: white; border-color: var(--accent); }
.option-label { font-size: 14px; color: var(--ink); line-height: 1.5; }
.nav { display: flex; gap: 10px; margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--border); }
.btn { padding: 11px 22px; border-radius: var(--radius-sm); font-size: 14px; font-weight: 500; cursor: pointer; border: 1.5px solid var(--border); background: white; color: var(--ink); font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
.btn:hover { background: var(--surface-2); border-color: var(--ink-faint); }
.btn.primary { background: var(--accent); border-color: var(--accent); color: white; margin-left: auto; }
.btn.primary:hover { background: var(--accent-dark); border-color: var(--accent-dark); }
.btn:disabled { opacity: 0.35; cursor: not-allowed; }
.btn:disabled:hover { background: white; border-color: var(--border); }
.intro { padding: 8px 0; }
.intro-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 28px 0; }
@media (max-width: 500px) { .intro-cards { grid-template-columns: 1fr; } }
.intro-card { background: white; border: 1.5px solid var(--border); border-radius: var(--radius-sm); padding: 16px 18px; }
.intro-card-icon { font-size: 20px; margin-bottom: 8px; }
.intro-card-title { font-size: 13px; font-weight: 600; color: var(--ink); margin-bottom: 4px; }
.intro-card-desc { font-size: 13px; color: var(--ink-muted); }
.role-select { margin-bottom: 0; }
.role-select label { font-size: 15px; font-weight: 500; color: var(--ink); display: block; margin-bottom: 10px; }
.role-opts { display: flex; gap: 10px; flex-wrap: wrap; }
.role-btn { padding: 9px 18px; border: 1.5px solid var(--border); border-radius: 99px; background: white; font-size: 13px; font-weight: 500; cursor: pointer; color: var(--ink); font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
.role-btn:hover, .role-btn.selected { background: var(--accent-light); border-color: var(--accent); color: var(--accent-dark); }
.field-group { margin-bottom: 20px; }
.field-group > label { font-size: 15px; font-weight: 500; color: var(--ink); display: block; margin-bottom: 10px; }
.field-input { width: 100%; padding: 10px 12px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); font-size: 14px; font-family: 'DM Sans', sans-serif; background: white; color: var(--ink); outline: none; transition: border-color 0.15s; appearance: none; -webkit-appearance: none; }
.field-input:focus { border-color: var(--accent); }
select.field-input { cursor: pointer; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239198aa' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px; }
.teams-loading { font-size: 13px; color: var(--ink-faint); padding: 10px 0; }
textarea.field-input { resize: vertical; min-height: 72px; line-height: 1.5; }
.open-question { margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border); }
.anon-footer { position: fixed; bottom: 0; left: 0; right: 0; background: rgba(250,250,248,0.96); border-top: 1px solid var(--border); padding: 10px 20px; font-size: 12px; color: var(--ink-muted); text-align: center; backdrop-filter: blur(4px); z-index: 100; line-height: 1.5; }
</style>
