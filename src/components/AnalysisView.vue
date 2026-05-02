<template>
  <div v-if="state.loading" class="empty-state">Cargando datos…</div>
  <div v-else>
    <!-- Stats row -->
    <div class="stats-row">
      <div class="stat-card"><div class="stat-num">{{ state.teams.length }}</div><div class="stat-label">Equipos</div></div>
      <div class="stat-card"><div class="stat-num">{{ state.responses.length }}</div><div class="stat-label">Respuestas</div></div>
      <div class="stat-card"><div class="stat-num">{{ withData.length }}</div><div class="stat-label">Con datos</div></div>
      <div class="stat-card">
        <div class="stat-num" :style="`color:${orgLevel ? orgLevel.color : 'var(--ink-faint)'}`">
          {{ compData.length ? orgAvg + '%' : '—' }}
        </div>
        <div class="stat-label">{{ statLabel }} · {{ orgLevel ? orgLevel.label : 'Sin datos' }}</div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!withData.length"
      class="empty-state" style="border:1.5px solid var(--border);border-radius:var(--radius);background:white;">
      Aún no hay respuestas. Comparte el assessment con los equipos para ver el análisis aquí.
    </div>

    <template v-else>
      <!-- Botones de exportación -->
      <div class="no-print" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;">
        <button class="btn sm" @click="exportPDF()">↓ Exportar PDF</button>
        <button class="btn sm" @click="exportSummary()">↓ Resumen CSV</button>
        <button class="btn sm" @click="exportRaw()">↓ Datos completos CSV</button>
      </div>

      <!-- Filtro de ciclos -->
      <div v-if="availCycles.length" class="no-print"
        style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:20px;">
        <span style="font-size:11px;font-weight:600;color:var(--ink-faint);text-transform:uppercase;letter-spacing:0.06em;">Ciclo</span>
        <button v-for="c in ['Todos', ...availCycles]" :key="c"
          class="role-pill" :class="{ active: c === state.cycleFilter }"
          @click="state.cycleFilter = c">{{ c }}</button>
        <button v-if="activeCycleObj" class="btn sm danger no-print"
          style="margin-left:auto;flex-shrink:0;"
          :title="'Cierre formal del ciclo activo — sincroniza portales y registra el cierre'"
          @click="showCloseCycleModal(activeCycleObj.id, activeCycleObj.name)">
          ⊘ Cerrar ciclo
        </button>
      </div>

      <!-- Toggle Otro -->
      <div v-if="otroCount > 0" class="no-print"
        style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:20px;">
        <span style="font-size:11px;font-weight:600;color:var(--ink-faint);text-transform:uppercase;letter-spacing:0.06em;">Otro</span>
        <button class="role-pill" :class="{ active: state.excludeOtro }"
          :style="state.excludeOtro ? 'background:#fce8e8;color:#c0282a;border-color:#c0282a40;' : ''"
          @click="state.excludeOtro = !state.excludeOtro">
          {{ state.excludeOtro ? '✓ ' : '' }}Excluir "Otro" <span style="font-size:10px;opacity:0.65;">({{ otroCount }})</span>
        </button>
        <span v-if="state.excludeOtro" style="font-size:12px;color:var(--ink-faint);">Promedios calculados sin respuestas "Otro"</span>
      </div>

      <!-- Madurez por rol (org) -->
      <div v-if="roleOrgStats.length > 1" class="section-card">
        <div class="section-title">Madurez por rol · toda la organización{{ state.cycleFilter !== 'Todos' ? ' · ' + state.cycleFilter : '' }}</div>
        <template v-if="visibleOrgRoles.length">
          <div v-for="rs in visibleOrgRoles" :key="rs.role" class="org-row">
            <div class="org-name">{{ rs.role }}</div>
            <div class="org-bar-wrap"><div class="org-bar" :style="`width:${rs.avg}%;background:${rs.level.color}`"></div></div>
            <div class="org-pct">{{ rs.avg }}%</div>
            <span class="org-badge" :style="`background:${rs.level.bg};color:${rs.level.color}`">{{ rs.level.label }}</span>
            <span style="font-size:11px;color:var(--ink-faint);flex-shrink:0;min-width:52px;text-align:right;">{{ rs.count }} resp.</span>
          </div>
        </template>
        <div v-else style="font-size:13px;color:var(--ink-faint);padding:8px 0;">
          Ningún rol alcanza el mínimo de {{ MIN_ROLE_RESPONSES }} respuestas.
        </div>
        <div v-if="hiddenOrgRoles.length"
          style="font-size:11px;color:var(--ink-faint);margin-top:10px;padding-top:8px;border-top:1px solid var(--border);">
          ⚠ Desglose oculto para proteger el anonimato — menos de {{ MIN_ROLE_RESPONSES }} respuestas:
          <template v-for="(r, i) in hiddenOrgRoles" :key="r.role">
            <strong>{{ r.role }}</strong> ({{ r.count }})<template v-if="i < hiddenOrgRoles.length - 1">, </template>
          </template>.
        </div>
      </div>

      <!-- Comparativo organizacional -->
      <div class="section-card">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:16px;">
          <div class="section-title" style="margin-bottom:0;">
            Comparativo organizacional{{ state.cycleFilter !== 'Todos' ? ' · ' + state.cycleFilter : '' }}
          </div>
          <div class="role-filter no-print" style="margin-bottom:0;padding-bottom:0;border-bottom:none;">
            <button v-for="r in ['Todos', ...availOrgRoles]" :key="r"
              class="role-pill" :class="{ active: r === state.orgRoleFilter }"
              @click="state.orgRoleFilter = r">
              {{ r }} <span style="font-size:10px;opacity:0.65;">({{ orgRoleCounts[r] || 0 }})</span>
            </button>
          </div>
        </div>
        <template v-if="compSorted.length">
          <div v-for="s in compSorted" :key="s.id" class="org-row">
            <div class="org-name" :title="s.name">{{ s.name }}</div>
            <div class="org-bar-wrap"><div class="org-bar" :style="`width:${s.avgTotal}%;background:${s.level.color}`"></div></div>
            <div class="org-pct">{{ s.avgTotal }}%</div>
            <span class="org-badge" :style="`background:${s.level.bg};color:${s.level.color}`">{{ s.level.label }}</span>
          </div>
        </template>
        <div v-else style="padding:16px 0;text-align:center;color:var(--ink-faint);font-size:13px;">
          No hay respuestas para los filtros seleccionados.
        </div>
      </div>

      <!-- Comparativa por dimensión (con radar) -->
      <div v-if="compData.length >= 2" class="section-card">
        <div class="section-title">
          Comparativa por dimensión{{ state.cycleFilter !== 'Todos' ? ' · ' + state.cycleFilter : '' }}
        </div>
        <div style="display:flex;gap:20px;flex-wrap:wrap;align-items:flex-start;">
          <div class="no-print" style="flex:0 0 auto;width:240px;">
            <canvas ref="compareCanvas" style="display:block;width:100%;max-height:240px;"></canvas>
            <div style="display:flex;flex-direction:column;gap:4px;margin-top:8px;">
              <span v-for="(s, i) in compSorted" :key="s.id" style="font-size:11px;display:flex;align-items:center;gap:5px;">
                <span :style="`display:inline-block;width:10px;height:10px;border-radius:50%;background:${TEAM_PALETTE[i % TEAM_PALETTE.length]};flex-shrink:0;`"></span>
                {{ s.name }}
              </span>
            </div>
          </div>
          <div style="flex:1;min-width:280px;overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:12px;">
              <thead>
                <tr>
                  <th style="text-align:left;padding:6px 8px 6px 0;font-size:11px;font-weight:600;color:var(--ink-faint);border-bottom:1.5px solid var(--border);white-space:nowrap;">Equipo</th>
                  <th v-for="d in DIMS" :key="d.key"
                    :style="`text-align:center;padding:6px 4px;font-size:11px;font-weight:600;color:${d.color};border-bottom:1.5px solid var(--border);min-width:58px;`">
                    {{ d.label }}
                  </th>
                  <th style="text-align:center;padding:6px 4px;font-size:11px;font-weight:600;color:var(--ink-faint);border-bottom:1.5px solid var(--border);min-width:52px;">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(s, i) in compSorted" :key="s.id">
                  <td style="padding:5px 8px 5px 0;font-size:12px;font-weight:500;color:var(--ink);white-space:nowrap;">
                    <span :style="`display:inline-block;width:8px;height:8px;border-radius:50%;background:${TEAM_PALETTE[i % TEAM_PALETTE.length]};margin-right:5px;vertical-align:middle;`"></span>{{ s.name }}
                  </td>
                  <td v-for="d in DIMS" :key="d.key" style="text-align:center;padding:3px 2px;">
                    <span :style="`display:inline-block;background:${cellBg(s.avgDims[d.key].pct)};color:${cellClr(s.avgDims[d.key].pct)};font-size:11px;font-weight:700;padding:2px 8px;border-radius:6px;min-width:38px;`">
                      {{ s.avgDims[d.key].pct }}%
                    </span>
                  </td>
                  <td style="text-align:center;padding:3px 2px;">
                    <span :style="`display:inline-block;background:${cellBg(s.avgTotal)};color:${cellClr(s.avgTotal)};font-size:12px;font-weight:700;padding:2px 8px;border-radius:6px;min-width:38px;`">
                      {{ s.avgTotal }}%
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Tendencia organizacional -->
      <div v-if="orgTrendPoints.length >= 2 && orgTrendTeams >= 2" class="section-card no-print">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap;">
          <div class="section-title" style="margin-bottom:0;">Tendencia organizacional por ciclo</div>
          <span v-if="orgTrendDelta > 0" style="font-size:11px;background:#d4f0e5;color:#0d7a52;padding:2px 8px;border-radius:99px;font-weight:700;">↗ +{{ orgTrendDelta }}pp</span>
          <span v-else-if="orgTrendDelta < 0" style="font-size:11px;background:#fce8e8;color:#c0282a;padding:2px 8px;border-radius:99px;font-weight:700;">↘ {{ orgTrendDelta }}pp</span>
          <span v-else style="font-size:11px;background:#f3f4f6;color:var(--ink-faint);padding:2px 8px;border-radius:99px;">→ Sin cambio</span>
        </div>
        <div style="height:180px;"><canvas ref="orgTrendCanvas"></canvas></div>
        <p style="font-size:11px;color:var(--ink-faint);margin-top:8px;text-align:right;">
          {{ orgTrendTeams }} equipos · {{ orgTrendPoints.length }} ciclos
        </p>
      </div>

      <!-- Detalle por equipo -->
      <div class="section-title">Detalle por equipo</div>
      <div class="team-grid">
        <TeamCard
          v-for="s in allSorted" :key="s.id"
          :tid="s.id"
          :team-stat="s"
          :comp-data="compData"
          :org-avg="orgAvg"
          :global-avgs="globalAvgs"
        />
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch, onUnmounted } from 'vue';
import Chart from 'chart.js/auto';
import { state } from '../../assets/admin-state.js';
import { MIN_ROLE_RESPONSES } from '../../assets/admin-state.js';
import {
  computeGlobalDimAverages, getTeamFilteredStats, calcOrgTrend,
} from '../../assets/admin-api.js';
import { showCloseCycleModal } from '../../assets/admin-render.js';
import { exportPDF, exportSummary, exportRaw } from '../../assets/admin-export.js';
import { DIMS, getLevel } from '../../assessment-config.js';
import TeamCard from './TeamCard.vue';

const TEAM_PALETTE = ['#1a4fd6', '#0d7a52', '#a05c0a', '#7c3aed', '#c0282a', '#0891b2', '#d97706', '#65a30d'];

const compareCanvas  = ref(null);
const orgTrendCanvas = ref(null);
let compareChart  = null;
let orgTrendChart = null;

const withData = computed(() => Object.values(state.teamStats).filter((s) => s.count > 0));

const filtByCycle = computed(() =>
  state.cycleFilter === 'Todos'
    ? state.responses
    : state.responses.filter((r) => r.fields.Ciclo === state.cycleFilter)
);

const otroCount = computed(() => filtByCycle.value.filter((r) => r.fields.Rol === 'Otro').length);

const exOtro = computed(() => state.excludeOtro && state.orgRoleFilter === 'Todos');

const compData = computed(() =>
  withData.value.map((s) => {
    const fs = getTeamFilteredStats(s.id, state.orgRoleFilter, state.cycleFilter, exOtro.value);
    return fs ? { id: s.id, name: s.name, ...fs } : null;
  }).filter(Boolean)
);

const compSorted = computed(() => [...compData.value].sort((a, b) => b.avgTotal - a.avgTotal));

const orgAvg = computed(() =>
  compData.value.length
    ? Math.round(compData.value.reduce((a, s) => a + s.avgTotal, 0) / compData.value.length)
    : 0
);
const orgLevel   = computed(() => compData.value.length ? getLevel(orgAvg.value) : null);
const statLabel  = computed(() => state.orgRoleFilter === 'Todos' ? 'Promedio org' : 'Promedio · ' + state.orgRoleFilter);
const globalAvgs = computed(() => computeGlobalDimAverages(state.cycleFilter, state.excludeOtro));

const availCycles  = computed(() =>
  state.cycles.length
    ? state.cycles.map((c) => c.name)
    : [...new Set(state.responses.map((r) => r.fields.Ciclo).filter(Boolean))].sort()
);
const activeCycleObj = computed(() => state.cycles.find((c) => c.active) || null);

const availOrgRoles = computed(() =>
  [...new Set(state.responses.map((r) => r.fields.Rol).filter(Boolean))].sort()
);

const roleOrgStats = computed(() =>
  [...new Set(filtByCycle.value.map((r) => r.fields.Rol).filter(Boolean))]
    .sort()
    .map((role) => {
      const rr = filtByCycle.value.filter((r) => r.fields.Rol === role);
      const avg = Math.round(rr.reduce((sum, r) => sum + (r.fields['Score Total %'] || 0), 0) / rr.length);
      return { role, count: rr.length, avg, level: getLevel(avg) };
    })
    .sort((a, b) => b.avg - a.avg)
);
const visibleOrgRoles = computed(() => roleOrgStats.value.filter((rs) => rs.count >= MIN_ROLE_RESPONSES));
const hiddenOrgRoles  = computed(() => roleOrgStats.value.filter((rs) => rs.count < MIN_ROLE_RESPONSES));

const orgRoleCounts = computed(() => {
  const c = { Todos: filtByCycle.value.length };
  availOrgRoles.value.forEach((r) => { c[r] = filtByCycle.value.filter((x) => x.fields.Rol === r).length; });
  return c;
});

const allSorted = computed(() => [...withData.value].sort((a, b) => b.avgTotal - a.avgTotal));

const orgTrendPoints = computed(() => calcOrgTrend());
const orgTrendTeams  = computed(() =>
  new Set(state.responses.map((r) => (r.fields.Equipo || [])[0]).filter(Boolean)).size
);
const orgTrendDelta = computed(() => {
  const pts = orgTrendPoints.value;
  return pts.length >= 2 ? pts[pts.length - 1].avg - pts[0].avg : 0;
});

function cellBg(p)  { return p >= 80 ? '#d4f0e5' : p >= 60 ? '#fdefd6' : '#fce8e8'; }
function cellClr(p) { return p >= 80 ? '#0d7a52' : p >= 60 ? '#a05c0a' : '#c0282a'; }

// Compare radar
const compareKey = computed(() =>
  compSorted.value.length >= 2
    ? compSorted.value.map((s) => s.id + ':' + DIMS.map((d) => s.avgDims[d.key].pct).join(',')).join('|')
    : null
);

watch([compareCanvas, compareKey], ([canvas, key]) => {
  if (compareChart) { compareChart.destroy(); compareChart = null; }
  if (!canvas || !key) return;
  compareChart = new Chart(canvas, {
    type: 'radar',
    data: {
      labels: DIMS.map((d) => d.label),
      datasets: compSorted.value.map((s, i) => ({
        label: s.name,
        data: DIMS.map((d) => s.avgDims[d.key].pct),
        backgroundColor: TEAM_PALETTE[i % TEAM_PALETTE.length] + '18',
        borderColor: TEAM_PALETTE[i % TEAM_PALETTE.length],
        borderWidth: 2,
        pointBackgroundColor: TEAM_PALETTE[i % TEAM_PALETTE.length],
        pointBorderColor: '#fff',
        pointBorderWidth: 1.5,
        pointRadius: 3,
        pointHoverRadius: 4,
      })),
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      scales: { r: { min: 0, max: 100, ticks: { stepSize: 25, display: false, backdropColor: 'transparent' }, grid: { color: 'rgba(0,0,0,0.07)' }, angleLines: { color: 'rgba(0,0,0,0.07)' }, pointLabels: { font: { size: 10, family: "'DM Sans', sans-serif" }, color: '#374151' } } },
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw}%` } } },
      animation: { duration: 350 },
    },
  });
}, { flush: 'post' });

// Org trend chart
const orgTrendKey = computed(() =>
  orgTrendPoints.value.length >= 2 && orgTrendTeams.value >= 2
    ? orgTrendPoints.value.map((p) => p.ciclo + ':' + p.avg).join('|')
    : null
);

watch([orgTrendCanvas, orgTrendKey], ([canvas, key]) => {
  if (orgTrendChart) { orgTrendChart.destroy(); orgTrendChart = null; }
  if (!canvas || !key) return;
  const pts = orgTrendPoints.value;
  orgTrendChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: pts.map((p) => p.ciclo),
      datasets: [{
        label: 'Score promedio org.',
        data: pts.map((p) => p.avg),
        borderColor: '#1a4fd6', backgroundColor: '#1a4fd618', borderWidth: 2.5,
        pointBackgroundColor: '#1a4fd6', pointBorderColor: '#fff', pointBorderWidth: 2,
        pointRadius: 5, pointHoverRadius: 6, tension: 0.3, fill: true,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        y: { min: 0, max: 100, ticks: { stepSize: 25, callback: (v) => v + '%', font: { size: 11, family: "'DM Sans', sans-serif" }, color: '#6b7280' }, grid: { color: 'rgba(0,0,0,0.06)' } },
        x: { ticks: { font: { size: 11, family: "'DM Sans', sans-serif" }, color: '#6b7280' }, grid: { display: false } },
      },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => { const pt = pts[ctx.dataIndex]; return ` ${ctx.raw}%  ·  ${pt.count} resp. · ${pt.teamCount} equipo${pt.teamCount !== 1 ? 's' : ''}`; } } },
      },
      animation: { duration: 350 },
    },
  });
}, { flush: 'post' });

onUnmounted(() => {
  if (compareChart)  compareChart.destroy();
  if (orgTrendChart) orgTrendChart.destroy();
});
</script>
