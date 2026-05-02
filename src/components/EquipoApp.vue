<template>
  <div class="shell">
    <div class="header">
      <div class="header-eyebrow">{{ branding.marca || 'Portal del Equipo' }}</div>
      <h1>
        <template v-if="branding.logoUrl">
          <img :src="branding.logoUrl" :alt="branding.marca || ''" style="max-height:40px;max-width:180px;object-fit:contain;display:block;margin-bottom:4px;" />
        </template>
        <template v-if="status === 'loading'">Cargando…</template>
        <template v-else-if="status === 'error'">Portal no disponible</template>
        <template v-else>{{ portal?.teamName || 'Equipo' }}</template>
      </h1>
      <p v-if="status === 'ready'">Resultados y plan de acción del equipo</p>
    </div>

    <div v-if="status === 'loading'" class="loading-state">Cargando datos del equipo…</div>
    <div v-else-if="status === 'error'" class="error-state">{{ errorMsg }}</div>

    <template v-else>
      <!-- Score + Radar -->
      <div class="section-card">
        <div v-if="hasData" class="score-hero">
          <div style="flex:1;min-width:160px;">
            <div class="score-big" :style="{ color: d.level ? d.level.color : levelColor(d.avgTotal) }">{{ d.avgTotal }}%</div>
            <div style="margin-top:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
              <span v-if="d.level" class="level-badge" :style="{ background: d.level.bg, color: d.level.color }">{{ d.level.label }}</span>
            </div>
            <div style="margin-top:10px;font-size:12px;color:var(--ink-faint);">{{ d.count }} respuesta{{ d.count !== 1 ? 's' : '' }}</div>
            <div v-if="d.activeCycle" style="margin-top:4px;font-size:12px;color:var(--ink-faint);">Ciclo activo: {{ d.activeCycle }}</div>
            <div v-if="d.level?.desc" style="margin-top:12px;font-size:13px;color:var(--ink-muted);line-height:1.5;">{{ d.level.desc }}</div>
          </div>
          <div style="flex:0 0 auto;width:220px;">
            <canvas ref="radarCanvasRef" style="display:block;width:100%;max-height:220px;"></canvas>
          </div>
        </div>
        <div v-else style="text-align:center;padding:24px 0;">
          <div style="font-size:32px;margin-bottom:12px;">📊</div>
          <div style="font-size:14px;color:var(--ink-muted);">No hay respuestas registradas todavía.<br />Completa el assessment para ver los resultados.</div>
          <div v-if="d.activeCycle" style="margin-top:12px;font-size:13px;font-weight:500;color:var(--accent);">Ciclo activo: {{ d.activeCycle }}</div>
        </div>
      </div>

      <!-- Dimensiones -->
      <div v-if="hasData && dims.length" class="section-card">
        <div class="section-title">Resultados por dimensión</div>
        <div v-for="dim in dims" :key="dim.key" class="dim-row">
          <div class="dim-row-header">
            <span class="dim-label" :style="{ color: dim.color }">{{ dim.label }}</span>
            <span class="dim-pct" :style="{ color: dim.color }">{{ dimPct(dim.key) }}%</span>
          </div>
          <div class="dim-bar-wrap">
            <div class="dim-bar" :style="{ width: dimPct(dim.key) + '%', background: dim.color }"></div>
          </div>
        </div>
      </div>

      <!-- Evolución -->
      <div v-if="evol.length >= 2" class="section-card">
        <div class="section-title">Evolución histórica</div>
        <div v-for="(ev, i) in evol" :key="ev.cycleName" class="evol-row">
          <div style="width:110px;font-size:13px;font-weight:500;flex-shrink:0;">{{ ev.cycleName }}</div>
          <div style="flex:1;min-width:80px;background:var(--surface-2);border-radius:99px;height:8px;overflow:hidden;">
            <div :style="{ width: ev.avgTotal + '%', height: '100%', background: levelColor(ev.avgTotal), borderRadius: '99px' }"></div>
          </div>
          <div style="font-size:13px;font-weight:600;width:44px;text-align:right;flex-shrink:0;" :style="{ color: levelColor(ev.avgTotal) }">{{ ev.avgTotal }}%</div>
          <div style="width:64px;flex-shrink:0;text-align:right;">
            <span v-if="i > 0" style="font-size:11px;font-weight:600;" :style="{ color: delta(ev, evol[i-1]) >= 0 ? '#0d7a52' : '#c0282a' }">
              {{ delta(ev, evol[i-1]) >= 0 ? '▲ +' : '▼ ' }}{{ delta(ev, evol[i-1]) }}%
            </span>
          </div>
          <div style="font-size:11px;color:var(--ink-faint);flex-shrink:0;">{{ ev.count }} resp.</div>
        </div>
      </div>

      <!-- Plan de acción -->
      <div v-if="plans.length" class="section-card">
        <div class="section-title">Plan de acción</div>
        <p style="font-size:12px;color:var(--ink-faint);margin-bottom:14px;">Puedes actualizar el estado de las acciones que te corresponden.</p>
        <div v-for="p in plans" :key="p.id" class="plan-item">
          <div style="display:flex;flex-direction:column;align-items:flex-start;gap:4px;flex-shrink:0;">
            <span class="plan-status" :style="{ background: planSt(p).bg, color: planSt(p).color }">{{ planSt(p).label }}</span>
            <span v-if="planStates[p.id]?.saving" style="font-size:10px;color:var(--ink-faint);">Guardando…</span>
            <span v-else-if="planStates[p.id]?.saved" style="font-size:10px;color:#0d7a52;">Guardado</span>
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;font-weight:500;line-height:1.4;">
              {{ p.iniciativa }}
              <span v-if="p.dimension" style="font-size:10px;color:var(--ink-faint);margin-left:6px;">{{ p.dimension }}</span>
            </div>
            <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:4px;align-items:center;">
              <span v-if="p.responsable" style="font-size:11px;color:var(--ink-muted);">{{ p.responsable }}</span>
              <span v-if="p.fechaObjetivo" style="font-size:11px;color:var(--ink-faint);">Fecha: {{ p.fechaObjetivo }}</span>
              <span v-if="p.ciclo" style="font-size:10px;color:var(--ink-faint);">{{ p.ciclo }}</span>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;">
              <button
                v-for="[k, v] in otherStates(p)"
                :key="k"
                :style="{ fontSize: '11px', padding: '3px 10px', borderRadius: '99px', border: `1.5px solid ${v.color}`, background: v.bg, color: v.color, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }"
                @click="changePlanStatus(p.id, k)"
              >{{ v.label }}</button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div class="footer" v-if="status !== 'loading'">
      <template v-if="updatedAtStr">Datos actualizados el {{ updatedAtStr }}<br /></template>
      Vista de solo lectura · Assessment Agile
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase.js';
import { useRadarChart } from '../composables/useRadarChart.js';

const PLAN_STATE = {
  pendiente:  { label: 'Pendiente',  color: '#a05c0a', bg: '#fdefd6' },
  'en-curso': { label: 'En curso',   color: '#1a4fd6', bg: '#dce6ff' },
  completado: { label: 'Completado', color: '#0d7a52', bg: '#d4f0e5' },
};

const status = ref('loading');
const errorMsg = ref('');
const portal = ref(null);
const planStates = reactive({});
const radarCanvasRef = ref(null);

const d = computed(() => portal.value?.data ?? {});
const hasData = computed(() => typeof d.value.avgTotal === 'number');
const dims = computed(() => d.value.dims ?? []);
const evol = computed(() => d.value.evolutionData ?? []);
const plans = computed(() => (d.value.plans ?? []).filter((p) => p.iniciativa));
const branding = computed(() => portal.value?.branding ?? {});
const updatedAtStr = computed(() => {
  const ts = portal.value?.updatedAt;
  return ts ? ts.toDate().toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' }) : null;
});
const radarData = computed(() => (hasData.value ? d.value : null));

useRadarChart(radarCanvasRef, radarData);

function levelColor(pct) {
  return pct >= 83 ? '#0d7a52' : pct >= 66 ? '#1a4fd6' : pct >= 41 ? '#a05c0a' : '#c0282a';
}
function dimPct(key) {
  return (d.value.avgDims?.[key] ?? { pct: 0 }).pct;
}
function delta(ev, prev) {
  return ev.avgTotal - prev.avgTotal;
}
function planCurrentEstado(p) {
  return planStates[p.id]?.estado ?? p.estado ?? 'pendiente';
}
function planSt(p) {
  return PLAN_STATE[planCurrentEstado(p)] ?? PLAN_STATE.pendiente;
}
function otherStates(p) {
  return Object.entries(PLAN_STATE).filter(([k]) => k !== planCurrentEstado(p));
}

async function changePlanStatus(planId, newEstado) {
  planStates[planId] = { estado: newEstado, saving: true, saved: false };
  try {
    await updateDoc(doc(db, 'planes', planId), {
      estado: newEstado,
      updatedByTeam: true,
      updatedByTeamAt: serverTimestamp(),
    });
    planStates[planId] = { estado: newEstado, saving: false, saved: true };
    setTimeout(() => {
      if (planStates[planId]?.estado === newEstado) planStates[planId].saved = false;
    }, 2000);
  } catch {
    delete planStates[planId];
    alert('No se pudo guardar el cambio. Verifica tu conexión e inténtalo de nuevo.');
  }
}

watch(branding, (b) => {
  if (b.colorAcento) document.documentElement.style.setProperty('--accent', b.colorAcento);
}, { immediate: true });

let unsubscribe = null;
onMounted(() => {
  const token = new URLSearchParams(window.location.search).get('t');
  if (!token) {
    status.value = 'error';
    errorMsg.value = 'Link inválido. Solicita el link al coach.';
    return;
  }
  unsubscribe = onSnapshot(
    doc(db, 'portales', token),
    (snap) => {
      if (!snap.exists()) {
        status.value = 'error';
        errorMsg.value = 'Este portal no existe o ha sido revocado.';
        return;
      }
      portal.value = snap.data();
      document.title = (portal.value.teamName || 'Equipo') + ' — Portal del Equipo';
      status.value = 'ready';
    },
    () => {
      status.value = 'error';
      errorMsg.value = 'Error al cargar el portal. Intenta nuevamente más tarde.';
    }
  );
});
onUnmounted(() => unsubscribe?.());
</script>

<style>
:root {
  --ink: #0f1117;
  --ink-muted: #5a5f72;
  --ink-faint: #9198aa;
  --surface: #fafaf8;
  --surface-2: #f2f1ed;
  --accent: #1a4fd6;
  --accent-light: #dce6ff;
  --border: #dddbd4;
  --radius: 12px;
  --radius-sm: 8px;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'DM Sans', sans-serif; background: var(--surface); color: var(--ink); min-height: 100vh; font-size: 16px; line-height: 1.6; }
.shell { max-width: 720px; margin: 0 auto; padding: 0 20px 80px; }
.header { padding: 48px 0 32px; border-bottom: 1px solid var(--border); margin-bottom: 32px; }
.header-eyebrow { font-size: 12px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent); margin-bottom: 12px; }
.header h1 { font-family: 'DM Serif Display', serif; font-size: clamp(22px, 4vw, 32px); line-height: 1.1; margin-bottom: 6px; }
.header p { font-size: 14px; color: var(--ink-muted); }
.section-card { background: white; border: 1.5px solid var(--border); border-radius: var(--radius); padding: 24px; margin-bottom: 20px; }
.section-title { font-size: 15px; font-weight: 600; color: var(--ink); margin-bottom: 16px; }
.score-hero { display: flex; align-items: flex-start; gap: 24px; flex-wrap: wrap; }
.score-big { font-size: 52px; font-weight: 600; line-height: 1; }
.level-badge { font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 99px; display: inline-block; }
.dim-row { margin-bottom: 12px; }
.dim-row-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.dim-label { font-size: 13px; font-weight: 500; }
.dim-pct { font-size: 13px; font-weight: 600; }
.dim-bar-wrap { height: 8px; background: var(--surface-2); border-radius: 99px; overflow: hidden; }
.dim-bar { height: 100%; border-radius: 99px; transition: width 0.4s ease; }
.evol-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid #f3f4f6; flex-wrap: wrap; }
.evol-row:last-child { border-bottom: none; }
.plan-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--border); }
.plan-item:last-child { border-bottom: none; }
.plan-status { font-size: 11px; font-weight: 600; padding: 2px 10px; border-radius: 99px; white-space: nowrap; flex-shrink: 0; margin-top: 2px; }
.footer { text-align: center; font-size: 12px; color: var(--ink-faint); padding: 24px 0; border-top: 1px solid var(--border); margin-top: 20px; line-height: 1.8; }
.error-state { text-align: center; padding: 80px 20px; font-size: 15px; color: var(--ink-muted); }
.loading-state { text-align: center; padding: 60px 20px; color: var(--ink-faint); font-size: 14px; }
</style>
