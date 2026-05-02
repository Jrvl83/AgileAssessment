<template>
  <div v-if="state.loading" class="empty-state">Cargando datos…</div>
  <div v-else>
    <!-- Formulario nueva acción -->
    <div class="section-card" id="plan-form">
      <div class="section-title">Nueva acción de mejora</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
        <div class="field-group" style="margin-bottom:0;">
          <label>Equipo</label>
          <select class="field-input" v-model="state.newPlanTeamId">
            <option value="">— Seleccionar equipo —</option>
            <option v-for="t in activeTeams" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
        </div>
        <div class="field-group" style="margin-bottom:0;">
          <label>Ciclo</label>
          <select class="field-input" v-model="state.newPlanCiclo">
            <option value="">— Ciclo activo —</option>
            <option v-for="c in state.cycles" :key="c.id" :value="c.name">
              {{ c.name }}{{ c.active ? ' (activo)' : '' }}
            </option>
          </select>
        </div>
      </div>
      <div class="field-group">
        <label>Iniciativa / Acción</label>
        <input class="field-input" type="text" placeholder="Ej. Definir Definition of Done con el equipo"
          v-model="state.newPlanIniciativa" @keydown.enter="addPlan" />
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px;">
        <div class="field-group" style="margin-bottom:0;">
          <label>Responsable</label>
          <input class="field-input" type="text" placeholder="Ej. Scrum Master"
            v-model="state.newPlanResponsable" />
        </div>
        <div class="field-group" style="margin-bottom:0;">
          <label>Fecha objetivo</label>
          <input class="field-input" type="date" v-model="state.newPlanFecha" />
        </div>
        <div class="field-group" style="margin-bottom:0;">
          <label>Dimensión <span style="color:var(--ink-faint);font-weight:400">(opcional)</span></label>
          <select class="field-input" v-model="state.newPlanDimension">
            <option value="">— General —</option>
            <option v-for="d in DIMS" :key="d.key" :value="d.key">{{ d.label }}</option>
          </select>
        </div>
      </div>
      <button class="btn primary" :disabled="!state.newPlanTeamId || !state.newPlanIniciativa.trim()" @click="addPlan">
        + Agregar acción
      </button>
    </div>

    <!-- Exportar -->
    <div v-if="filtered.length" class="no-print" style="margin-bottom:16px;">
      <button class="btn sm" @click="exportPlanPDF">↓ Exportar Plan PDF</button>
    </div>

    <!-- Panel de seguimiento -->
    <div class="section-card">
      <div class="section-title">Acciones en seguimiento</div>

      <!-- Filtros -->
      <div class="no-print">
        <div v-if="teamNames.length > 1" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
          <span style="font-size:11px;font-weight:600;color:var(--ink-faint);text-transform:uppercase;letter-spacing:0.06em;flex-shrink:0;">Equipo</span>
          <button v-for="n in ['Todos', ...teamNames]" :key="n"
            class="role-pill" :class="{ active: n === state.planTeamFilter }"
            @click="state.planTeamFilter = n">{{ n }}</button>
        </div>
        <div v-if="availCycles.length" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
          <span style="font-size:11px;font-weight:600;color:var(--ink-faint);text-transform:uppercase;letter-spacing:0.06em;flex-shrink:0;">Ciclo</span>
          <button v-for="c in ['Todos', ...availCycles]" :key="c"
            class="role-pill" :class="{ active: c === state.planCycleFilter }"
            @click="state.planCycleFilter = c">{{ c }}</button>
        </div>
      </div>

      <!-- Contadores -->
      <div class="stats-row" style="grid-template-columns:repeat(3,1fr);margin-bottom:16px;">
        <div v-for="[k, v] in Object.entries(PLAN_STATE)" :key="k" class="stat-card">
          <div class="stat-num" :style="`color:${v.color}`">{{ counts[k] }}</div>
          <div class="stat-label">{{ v.label }}</div>
        </div>
      </div>

      <!-- Lista -->
      <div v-if="filtered.length === 0" class="empty-state" style="padding:24px 0;">
        No hay acciones para los filtros seleccionados.
      </div>
      <div v-else style="display:flex;flex-direction:column;gap:10px;">
        <div v-for="p in filtered" :key="p.id"
          style="background:var(--surface);border:1.5px solid var(--border);border-radius:var(--radius-sm);padding:14px 16px;">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
            <div style="flex:1;min-width:0;">
              <div style="font-size:14px;font-weight:500;color:var(--ink);margin-bottom:6px;">{{ p.iniciativa }}</div>
              <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
                <span v-if="p.equipoNombre" style="font-size:11px;font-weight:500;color:var(--ink-muted);">{{ p.equipoNombre }}</span>
                <span v-if="p.responsable" style="font-size:11px;color:var(--ink-faint);">· {{ p.responsable }}</span>
                <span v-if="p.ciclo" style="font-size:11px;color:var(--ink-faint);background:var(--surface-2);border:1px solid var(--border);padding:1px 7px;border-radius:99px;">{{ p.ciclo }}</span>
                <span v-if="p.fechaObjetivo" style="font-size:11px;color:var(--ink-faint);">Fecha: {{ p.fechaObjetivo }}</span>
                <span v-if="planDim(p)" class="plan-dim-badge"
                  :style="`border-color:${planDim(p).color};color:${planDim(p).color};`">
                  {{ planDim(p).label }}
                </span>
              </div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0;">
              <span :style="`font-size:11px;font-weight:600;padding:3px 10px;border-radius:99px;background:${planStateOf(p).bg};color:${planStateOf(p).color};`">
                {{ planStateOf(p).label }}
              </span>
              <span v-if="p.updatedByTeam" style="font-size:10px;font-weight:600;padding:2px 8px;border-radius:99px;background:#f0fdf4;color:#0d7a52;border:1px solid #bbf7d0;">
                Actualizado por equipo
              </span>
              <div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end;">
                <button v-for="[k, v] in otherStates(p)" :key="k"
                  class="btn sm" style="padding:3px 8px;font-size:11px;"
                  @click="updatePlanStatus(p.id, k)">{{ v.label }}</button>
                <button class="btn sm danger" style="padding:3px 8px;font-size:11px;"
                  @click="deletePlan(p.id)">✕</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { state } from '../../assets/admin-state.js';
import { addPlan, updatePlanStatus, deletePlan } from '../../assets/admin-api.js';
import { exportPlanPDF } from '../../assets/admin-export.js';
import { DIMS } from '../../assessment-config.js';

const PLAN_STATE = {
  pendiente:  { label: 'Pendiente',  color: '#a05c0a', bg: '#fdefd6' },
  'en-curso': { label: 'En curso',   color: '#1a4fd6', bg: '#dce6ff' },
  completado: { label: 'Completado', color: '#0d7a52', bg: '#d4f0e5' },
};

const activeTeams  = computed(() => state.teams.filter((t) => t.active));
const availCycles  = computed(() => state.cycles.map((c) => c.name));
const teamNames    = computed(() => [...new Set(state.plans.map((p) => p.equipoNombre).filter(Boolean))].sort());

const filtered = computed(() =>
  state.plans
    .filter((p) => state.planTeamFilter  === 'Todos' || p.equipoNombre === state.planTeamFilter)
    .filter((p) => state.planCycleFilter === 'Todos' || p.ciclo        === state.planCycleFilter)
);

const counts = computed(() => {
  const c = { pendiente: 0, 'en-curso': 0, completado: 0 };
  filtered.value.forEach((p) => { if (c[p.estado] !== undefined) c[p.estado]++; });
  return c;
});

function planStateOf(p) { return PLAN_STATE[p.estado] || PLAN_STATE['pendiente']; }
function planDim(p)     { return p.dimension ? DIMS.find((d) => d.key === p.dimension) : null; }
function otherStates(p) { return Object.entries(PLAN_STATE).filter(([k]) => k !== p.estado); }
</script>
