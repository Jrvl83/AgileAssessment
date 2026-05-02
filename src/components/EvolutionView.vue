<template>
  <div v-if="state.loading" class="empty-state">Cargando datos…</div>
  <div v-else-if="!withData.length" class="empty-state">Aún no hay respuestas para mostrar evolución.</div>
  <template v-else>

    <!-- Tarjeta principal -->
    <div class="section-card">
      <div class="section-title">
        Evolución{{ teamName ? ' · ' + teamName : '' }}{{ state.evolRole !== 'Todos' ? ' · ' + state.evolRole : '' }}
      </div>

      <!-- Selectores -->
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:20px;">
        <select class="field-input" style="max-width:220px;" v-model="state.evolTeamId">
          <option value="">— Seleccionar equipo —</option>
          <option v-for="s in withData" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
        <button v-for="r in ROLES" :key="r"
          class="role-pill" :class="{ active: r === state.evolRole }"
          @click="state.evolRole = r">{{ r }}</button>
      </div>

      <!-- Sin equipo seleccionado -->
      <div v-if="!state.evolTeamId" style="color:var(--ink-faint);font-size:13px;padding:8px 0;">
        Selecciona un equipo para ver su evolución entre ciclos.
      </div>

      <!-- Sin datos para la combinación -->
      <div v-else-if="!data.length" style="color:var(--ink-faint);font-size:13px;padding:8px 0;">
        No hay datos para esta combinación.
      </div>

      <template v-else>
        <!-- Aviso un solo ciclo -->
        <p v-if="data.length === 1"
          style="font-size:13px;color:var(--amber);background:var(--amber-light);border-radius:var(--radius-sm);padding:10px 14px;margin-bottom:16px;">
          Solo hay un ciclo con datos. La comparación aparecerá cuando haya más de un ciclo completado.
        </p>

        <!-- Timeline de ciclos -->
        <div class="evo-timeline">
          <div v-for="(d, i) in data" :key="d.cycleName"
            class="evo-cycle-card" :style="`background:${d.level.bg};`">
            <div class="evo-cycle-name" :style="`color:${d.level.color};`">{{ d.cycleName }}</div>
            <div class="evo-cycle-score" :style="`color:${d.level.color};`">
              {{ d.avgTotal }}%
              <template v-if="i > 0">
                <span v-if="d.avgTotal - data[i-1].avgTotal > 0"  class="delta-up"> ▲ +{{ d.avgTotal - data[i-1].avgTotal }}%</span>
                <span v-else-if="d.avgTotal - data[i-1].avgTotal < 0" class="delta-dn"> ▼ {{ d.avgTotal - data[i-1].avgTotal }}%</span>
                <span v-else class="delta-eq"> → 0%</span>
              </template>
            </div>
            <div class="evo-cycle-meta" :style="`color:${d.level.color};`">{{ d.level.label }} · {{ d.count }} resp.</div>
          </div>
        </div>

        <!-- Tabla de dimensiones -->
        <div v-if="data.length > 1" style="overflow-x:auto;margin-top:16px;">
          <table class="evo-table">
            <thead>
              <tr>
                <th class="evo-th">Dimensión</th>
                <th v-for="d in data" :key="d.cycleName" class="evo-th-c">{{ d.cycleName }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="dim in DIMS" :key="dim.key">
                <td class="evo-td-dim">
                  <span :style="`display:inline-block;width:8px;height:8px;border-radius:50%;background:${dim.color};margin-right:6px;vertical-align:middle;`"></span>{{ dim.label }}
                </td>
                <td v-for="(d, i) in data" :key="d.cycleName" class="evo-td">
                  <div class="evo-bar-wrap">
                    <div class="evo-bar" :style="`width:${d.avgDims[dim.key].pct}%;background:${dim.color};`"></div>
                  </div>
                  <div style="font-weight:600;color:var(--ink);">
                    {{ d.avgDims[dim.key].pct }}%
                    <template v-if="i > 0">
                      <span v-if="d.avgDims[dim.key].pct - data[i-1].avgDims[dim.key].pct > 0"
                        class="delta-up">▲ +{{ d.avgDims[dim.key].pct - data[i-1].avgDims[dim.key].pct }}%</span>
                      <span v-else-if="d.avgDims[dim.key].pct - data[i-1].avgDims[dim.key].pct < 0"
                        class="delta-dn">▼ {{ d.avgDims[dim.key].pct - data[i-1].avgDims[dim.key].pct }}%</span>
                      <span v-else class="delta-eq">→ 0%</span>
                    </template>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Acciones vinculadas a dimensiones -->
        <div v-if="teamPlans.length && data.length > 1"
          style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border);">
          <div style="font-size:12px;font-weight:700;color:var(--ink-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:14px;">
            Acciones vinculadas a dimensiones
          </div>
          <template v-for="dim in DIMS" :key="dim.key">
            <div v-if="dimPlansByKey[dim.key]?.length" style="margin-bottom:16px;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                <span :style="`width:8px;height:8px;border-radius:50%;background:${dim.color};flex-shrink:0;display:inline-block;`"></span>
                <span :style="`font-size:12px;font-weight:600;color:${dim.color};`">{{ dim.label }}</span>
                <template v-if="latest && prevCycle">
                  <span v-if="latest.avgDims[dim.key].pct - prevCycle.avgDims[dim.key].pct > 0"
                    class="delta-up">▲ +{{ latest.avgDims[dim.key].pct - prevCycle.avgDims[dim.key].pct }}%</span>
                  <span v-else-if="latest.avgDims[dim.key].pct - prevCycle.avgDims[dim.key].pct < 0"
                    class="delta-dn">▼ {{ latest.avgDims[dim.key].pct - prevCycle.avgDims[dim.key].pct }}%</span>
                  <span v-else class="delta-eq">→ 0%</span>
                </template>
              </div>
              <div v-for="p in dimPlansByKey[dim.key]" :key="p.id"
                style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:6px;">
                <div style="flex:1;font-size:12px;color:var(--ink);min-width:0;">{{ p.iniciativa }}</div>
                <span v-if="p.responsable" style="font-size:11px;color:var(--ink-faint);flex-shrink:0;">{{ p.responsable }}</span>
                <span :style="`font-size:10px;font-weight:600;padding:2px 8px;border-radius:99px;background:${STATUS_MAP[p.estado]?.bg || '#f3f4f6'};color:${STATUS_MAP[p.estado]?.color || '#374151'};flex-shrink:0;`">
                  {{ STATUS_MAP[p.estado]?.label || p.estado }}
                </span>
              </div>
            </div>
          </template>
        </div>

        <!-- Recomendaciones -->
        <div class="recs-section" style="margin-top:16px;">
          <div class="recs-label">
            Recomendaciones · {{ latest.cycleName }}{{ state.evolRole !== 'Todos' ? ' · ' + state.evolRole : '' }}
          </div>
          <template v-if="recItems.length">
            <div v-for="item in recItems" :key="item.recKey"
              :class="['rec-item', item.regressed ? 'rec-item--urgent' : item.improved ? 'rec-item--improving' : '']"
              style="align-items:flex-start;">
              <div class="rec-dot" :style="`background:${item.color};flex-shrink:0;margin-top:${item.regressed || item.improved ? '14px' : '5px'}`"></div>
              <div class="rec-text" style="flex:1;">
                <div v-if="item.regressed" class="rec-trend" style="color:var(--red);">▼ Retroceso −{{ item.diff }}% vs. ciclo anterior</div>
                <div v-else-if="item.improved" class="rec-trend" style="color:#0d7a52;">▲ Mejora +{{ item.diff }}% vs. ciclo anterior — mantener el foco</div>
                <strong>{{ item.label }}:</strong> {{ item.text }}
              </div>
              <button class="btn-plan no-print" @click="doPrefillPlan(item.recKey, item.key)">+ Plan</button>
            </div>
          </template>
          <div v-else class="rec-item">
            <div class="rec-dot" style="background:#0d7a52"></div>
            <div class="rec-text">Excelente progreso en todas las dimensiones. Mantener el ritmo de mejora continua.</div>
          </div>
        </div>
      </template>
    </div>

    <!-- Tendencia histórica (Chart.js) -->
    <div v-if="state.evolTeamId && data.length >= 3"
      class="section-card" style="margin-top:0;margin-bottom:0;">
      <div class="section-title">Tendencia histórica por dimensión</div>
      <p style="font-size:12px;color:var(--ink-faint);margin-bottom:16px;line-height:1.5;">
        Evolución de cada dimensión a lo largo de todos los ciclos con datos.
      </p>
      <div style="position:relative;height:280px;">
        <canvas ref="trendCanvas"></canvas>
      </div>
    </div>

    <!-- Detalle por pregunta -->
    <div v-if="state.evolTeamId && qSections.length"
      class="section-card" style="margin-top:0;">
      <div class="section-title">
        Detalle por pregunta · {{ prevCycle?.cycleName }} → {{ latest?.cycleName }}
      </div>
      <p style="font-size:12px;color:var(--ink-faint);margin-bottom:16px;line-height:1.5;">
        Puntaje promedio de cada pregunta en el último ciclo y variación respecto al anterior.
      </p>
      <div v-for="sec in qSections" :key="sec.dimKey" style="margin-bottom:20px;">
        <div :style="`font-size:11px;font-weight:600;color:${sec.color};text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;`">
          <span :style="`display:inline-block;width:8px;height:8px;border-radius:50%;background:${sec.color};margin-right:6px;vertical-align:middle;`"></span>{{ sec.label }}
        </div>
        <div v-for="(q, i) in sec.questions" :key="q.key"
          style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--border);">
          <div style="font-size:11px;font-weight:600;color:var(--ink-faint);width:22px;flex-shrink:0;">P{{ i + 1 }}</div>
          <div style="flex:1;font-size:12px;color:var(--ink-muted);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" :title="q.text">
            {{ q.text.length > 72 ? q.text.slice(0, 72) + '…' : q.text }}
          </div>
          <div style="font-size:12px;font-weight:600;color:var(--ink);flex-shrink:0;min-width:36px;text-align:right;">{{ q.latestPct }}%</div>
          <div style="flex-shrink:0;min-width:54px;text-align:right;">
            <span v-if="q.delta > 0"  class="delta-up">▲ +{{ q.delta }}%</span>
            <span v-else-if="q.delta < 0" class="delta-dn">▼ {{ q.delta }}%</span>
            <span v-else class="delta-eq">→ 0%</span>
          </div>
        </div>
      </div>
    </div>

  </template>
</template>

<script setup>
import { computed, watch, ref, onUnmounted } from 'vue';
import Chart from 'chart.js/auto';
import { state } from '../../assets/admin-state.js';
import { getEvolutionData, getMajorityRole } from '../../assets/admin-api.js';
import { prefillPlan } from '../../assets/admin-render.js';
import { DIMS, SECTIONS, getRec } from '../../assessment-config.js';

const ROLES = ['Todos', 'Product Owner', 'Dev Team', 'Scrum Master'];
const STATUS_MAP = {
  pendiente:  { label: 'Pendiente',  color: '#a05c0a', bg: '#fdefd6' },
  'en-curso': { label: 'En curso',   color: '#1a4fd6', bg: '#dce6ff' },
  completado: { label: 'Completado', color: '#0d7a52', bg: '#d4f0e5' },
};

const trendCanvas = ref(null);
let chartInstance = null;

const withData = computed(() => Object.values(state.teamStats).filter((s) => s.count > 0));
const data     = computed(() => state.evolTeamId ? getEvolutionData(state.evolTeamId, state.evolRole) : []);
const teamName = computed(() => withData.value.find((s) => s.id === state.evolTeamId)?.name || '');
const latest   = computed(() => data.value[data.value.length - 1] ?? null);
const prevCycle = computed(() => data.value.length > 1 ? data.value[data.value.length - 2] : null);

const evolTeamResps = computed(() =>
  state.responses.filter((r) => (r.fields?.Equipo || []).includes(state.evolTeamId))
);
const roleForRec = computed(() =>
  state.evolRole === 'Todos' ? getMajorityRole(evolTeamResps.value) : state.evolRole
);

const dimScores = computed(() => {
  if (!latest.value) return [];
  return DIMS.map((d) => ({
    ...d,
    pct:     latest.value.avgDims[d.key].pct,
    prevPct: prevCycle.value ? prevCycle.value.avgDims[d.key].pct : null,
  }));
});

const recItems = computed(() => {
  if (!latest.value) return [];
  const evolBelow80 = [...dimScores.value]
    .filter((d) => d.pct < 80 || (d.prevPct !== null && d.pct < d.prevPct))
    .sort((a, b) => {
      const aR = a.prevPct !== null && a.pct < a.prevPct;
      const bR = b.prevPct !== null && b.pct < b.prevPct;
      if (aR && !bR) return -1;
      if (!aR && bR) return 1;
      return a.pct - b.pct;
    });
  const toFix = evolBelow80.length ? evolBelow80 : [...dimScores.value].sort((a, b) => a.pct - b.pct).slice(0, 4);
  return toFix.map((d) => {
    const regressed = d.prevPct !== null && d.pct < d.prevPct;
    const improved  = d.prevPct !== null && d.pct > d.prevPct && d.pct < 60;
    const diff      = d.prevPct !== null ? Math.abs(d.pct - d.prevPct) : 0;
    const recKey    = 'evol_' + d.key;
    const text      = getRec(d.key, d.pct, roleForRec.value);
    state.recTexts[recKey] = `${d.label}: ${text}`;  // consumed by prefillPlan
    return { ...d, recKey, text, regressed, improved, diff };
  });
});

const teamPlans = computed(() =>
  state.plans.filter((p) => p.equipoId === state.evolTeamId && p.dimension)
);
const dimPlansByKey = computed(() => {
  const map = {};
  teamPlans.value.forEach((p) => {
    if (!map[p.dimension]) map[p.dimension] = [];
    map[p.dimension].push(p);
  });
  return map;
});

const qSections = computed(() => {
  if (data.value.length < 2 || !latest.value?.avgQuestions || !prevCycle.value?.avgQuestions) return [];
  return DIMS.map((dim) => {
    const sec = SECTIONS.find((s) => s.id === dim.key);
    if (!sec) return null;
    const questions = sec.questions.map((q, qi) => {
      const key       = sec.id + '_' + qi;
      const latestPct = Math.round(((latest.value.avgQuestions[key] || 0) / 3) * 100);
      const prevPct   = Math.round(((prevCycle.value.avgQuestions[key] || 0) / 3) * 100);
      return { key, text: q.text, latestPct, delta: latestPct - prevPct };
    });
    return { dimKey: dim.key, label: dim.label, color: dim.color, questions };
  }).filter(Boolean);
});

// Chart.js — inicializa/destruye cuando cambia el canvas o los datos relevantes
const trendKey = computed(() =>
  data.value.length >= 3 ? `${state.evolTeamId}/${state.evolRole}/${data.value.length}` : null
);

watch([trendCanvas, trendKey], ([canvas, key]) => {
  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
  if (!canvas || !key) return;

  chartInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels: data.value.map((d) => d.cycleName),
      datasets: DIMS.map((d) => ({
        label: d.label,
        data: data.value.map((cycle) => cycle.avgDims[d.key].pct),
        borderColor: d.color,
        backgroundColor: d.color + '18',
        borderWidth: 2,
        pointBackgroundColor: d.color,
        pointBorderColor: '#fff',
        pointBorderWidth: 1.5,
        pointRadius: 4,
        pointHoverRadius: 5,
        tension: 0.3,
        fill: false,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { min: 0, max: 100, ticks: { stepSize: 25, callback: (v) => v + '%', font: { size: 11, family: "'DM Sans', sans-serif" }, color: '#6b7280' }, grid: { color: 'rgba(0,0,0,0.06)' } },
        x: { ticks: { font: { size: 11, family: "'DM Sans', sans-serif" }, color: '#6b7280' }, grid: { display: false } },
      },
      plugins: {
        legend: { display: true, position: 'bottom', labels: { font: { size: 11, family: "'DM Sans', sans-serif" }, usePointStyle: true, pointStyleWidth: 8, padding: 14 } },
        tooltip: { callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw}%` } },
      },
      animation: { duration: 350 },
    },
  });
}, { flush: 'post' });

onUnmounted(() => { if (chartInstance) chartInstance.destroy(); });

function doPrefillPlan(recKey, dimKey) {
  prefillPlan(state.evolTeamId, recKey, '', dimKey);
}
</script>
