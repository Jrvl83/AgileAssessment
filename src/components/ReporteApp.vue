<template>
  <div class="shell">
    <div class="header">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;">
        <div>
          <div class="header-eyebrow">{{ branding.marca || 'Reporte de Madurez Ágil' }}</div>
          <h1>
            <template v-if="branding.logoUrl">
              <img :src="branding.logoUrl" :alt="branding.marca || ''" style="max-height:40px;max-width:180px;object-fit:contain;display:block;margin-bottom:4px;" />
            </template>
            <template v-if="status === 'loading'">Cargando…</template>
            <template v-else-if="status === 'error'">Reporte no disponible</template>
            <template v-else>{{ report?.equipoNombre }}</template>
          </h1>
          <p v-if="status === 'ready'">Ciclo: {{ cicloLabel }}</p>
        </div>
        <button
          v-if="status === 'ready'"
          class="no-print"
          style="flex-shrink:0;margin-top:48px;padding:8px 18px;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;border:1.5px solid #dddbd4;background:white;color:#0f1117;font-family:'DM Sans',sans-serif;"
          @click="printPage()"
        >↓ Descargar PDF</button>
      </div>
    </div>

    <div v-if="status === 'loading'" class="loading-state">Cargando reporte…</div>
    <div v-else-if="status === 'error'" class="error-state">{{ errorMsg }}</div>

    <template v-else>
      <!-- Score + Radar -->
      <div class="section-card">
        <div class="score-hero">
          <div style="flex:1;min-width:160px;">
            <div class="score-big" :style="{ color: d.level.color }">{{ d.avgTotal }}%</div>
            <div style="margin-top:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
              <span class="level-badge" :style="{ background: d.level.bg, color: d.level.color }">{{ d.level.label }}</span>
              <span v-if="alignBadge" class="level-badge" :style="{ background: alignBadge.bg, color: alignBadge.color }">Alineación {{ alignBadge.label }}</span>
            </div>
            <div style="margin-top:10px;font-size:12px;color:var(--ink-faint);">{{ d.count }} respuesta{{ d.count !== 1 ? 's' : '' }}</div>
            <div v-if="d.level?.desc" style="margin-top:12px;font-size:13px;color:var(--ink-muted);line-height:1.5;">{{ d.level.desc }}</div>
          </div>
          <div style="flex:0 0 auto;width:220px;">
            <canvas ref="radarCanvasRef" style="display:block;width:100%;max-height:220px;"></canvas>
          </div>
        </div>
      </div>

      <!-- Dimensiones -->
      <div class="section-card">
        <div class="section-title">Resultados por dimensión</div>
        <div v-for="dim in d.dims" :key="dim.key" class="dim-row">
          <div class="dim-row-header">
            <span class="dim-label" :style="{ color: dim.color }">{{ dim.label }}</span>
            <span class="dim-pct">{{ dimPct(dim.key) }}%</span>
          </div>
          <div class="dim-bar-wrap">
            <div class="dim-bar" :style="{ width: dimPct(dim.key) + '%', background: dim.color }"></div>
          </div>
          <div v-if="dispersion(dim.key)" style="font-size:10px;color:var(--ink-faint);margin-top:2px;">
            Rango: {{ dispersion(dim.key).min }}%–{{ dispersion(dim.key).max }}% · dispersión ±{{ dispersion(dim.key).sd }}%
          </div>
        </div>
      </div>

      <!-- Madurez por rol -->
      <div v-if="d.roleStats?.length > 1" class="section-card">
        <div class="section-title">Madurez por rol</div>
        <div v-for="rs in d.roleStats" :key="rs.role" class="role-row">
          <div style="width:140px;font-size:13px;font-weight:500;flex-shrink:0;">{{ rs.role }}</div>
          <div class="org-bar-wrap">
            <div class="org-bar" :style="{ width: rs.avg + '%', background: rs.level.color }"></div>
          </div>
          <div style="font-size:13px;font-weight:600;width:42px;text-align:right;flex-shrink:0;">{{ rs.avg }}%</div>
          <span style="font-size:11px;font-weight:600;padding:2px 8px;border-radius:99px;flex-shrink:0;" :style="{ background: rs.level.bg, color: rs.level.color }">{{ rs.level.label }}</span>
          <span style="font-size:11px;color:var(--ink-faint);flex-shrink:0;">{{ rs.count }} resp.</span>
        </div>
      </div>

      <!-- Recomendaciones -->
      <div v-if="d.recommendations?.length" class="section-card">
        <div class="section-title">Recomendaciones prioritarias</div>
        <div v-for="rec in d.recommendations" :key="rec.dimLabel" class="rec-item">
          <div class="rec-dot" :style="{ background: rec.dimColor, marginTop: '5px' }"></div>
          <div>
            <div style="font-size:13px;font-weight:600;margin-bottom:4px;" :style="{ color: rec.dimColor }">{{ rec.dimLabel }} · {{ rec.pct }}%</div>
            <div style="font-size:13px;color:var(--ink-muted);line-height:1.5;">{{ rec.text }}</div>
          </div>
        </div>
      </div>
    </template>

    <div class="footer" v-if="status !== 'loading'">
      <template v-if="genDate">Generado el {{ genDate }} · Válido hasta el {{ expDate }}<br /></template>
      Este reporte es de solo lectura · Assessment Agile
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase.js';
import { useRadarChart } from '../composables/useRadarChart.js';

const status = ref('loading');
const errorMsg = ref('');
const report = ref(null);
const radarCanvasRef = ref(null);

const d = computed(() => report.value?.data ?? {});
const branding = computed(() => report.value?.branding ?? {});
const cicloLabel = computed(() => {
  const c = report.value?.ciclo;
  return c && c !== 'Todos' ? c : 'Todos los ciclos';
});
const alignBadge = computed(() => d.value.dispersion?.overall?.align ?? null);
const genDate = computed(() => {
  const ts = report.value?.generatedAt;
  return ts ? ts.toDate().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) : null;
});
const expDate = computed(() => {
  const ts = report.value?.expiresAt;
  return ts ? ts.toDate().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) : null;
});
const radarData = computed(() => (status.value === 'ready' ? d.value : null));

useRadarChart(radarCanvasRef, radarData);

function printPage() { window.print(); }

function dimPct(key) {
  return (d.value.avgDims?.[key] ?? { pct: 0 }).pct;
}
function dispersion(key) {
  return d.value.dispersion?.[key] ?? null;
}

watch(branding, (b) => {
  if (b.colorAcento) document.documentElement.style.setProperty('--accent', b.colorAcento);
}, { immediate: true });

onMounted(async () => {
  const token = new URLSearchParams(window.location.search).get('t');
  if (!token) {
    status.value = 'error';
    errorMsg.value = 'Link inválido. Solicita un nuevo link al coach.';
    return;
  }
  try {
    const snap = await getDoc(doc(db, 'reportes', token));
    if (!snap.exists()) {
      status.value = 'error';
      errorMsg.value = 'Este reporte no existe o ha sido revocado.';
      return;
    }
    const r = snap.data();
    if (r.expiresAt && r.expiresAt.toDate() < new Date()) {
      status.value = 'error';
      errorMsg.value = 'Este reporte ha expirado. Solicita un nuevo link al coach.';
      return;
    }
    report.value = r;
    document.title = r.equipoNombre + ' — Reporte de Madurez';
    status.value = 'ready';
  } catch {
    status.value = 'error';
    errorMsg.value = 'Error al cargar el reporte. Intenta nuevamente más tarde.';
  }
});
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
.dim-pct { font-size: 13px; font-weight: 600; color: var(--ink); }
.dim-bar-wrap { height: 8px; background: var(--surface-2); border-radius: 99px; overflow: hidden; }
.dim-bar { height: 100%; border-radius: 99px; }
.role-row { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--border); }
.role-row:last-child { border-bottom: none; }
.org-bar-wrap { flex: 1; height: 8px; background: var(--surface-2); border-radius: 99px; overflow: hidden; }
.org-bar { height: 100%; border-radius: 99px; }
.rec-item { display: flex; align-items: flex-start; gap: 10px; padding: 12px 0; border-bottom: 1px solid #f3f4f6; }
.rec-item:last-child { border-bottom: none; }
.rec-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.footer { text-align: center; font-size: 12px; color: var(--ink-faint); padding: 24px 0; border-top: 1px solid var(--border); margin-top: 20px; line-height: 1.8; }
.error-state { text-align: center; padding: 80px 20px; font-size: 15px; color: var(--ink-muted); }
.loading-state { text-align: center; padding: 60px 20px; color: var(--ink-faint); font-size: 14px; }
.no-print {}
@media print {
  .no-print { display: none !important; }
  body { background: white; }
  .shell { padding: 0 16px 32px; }
  .header { padding: 24px 0 20px; }
  .section-card { break-inside: avoid; border: 1px solid #ddd; }
}
</style>
