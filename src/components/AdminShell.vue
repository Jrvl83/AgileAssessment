<template>
  <div class="shell">
    <div class="header">
      <div class="header-eyebrow">Panel de Administración</div>
      <h1>Assessment Agile</h1>
      <p>Análisis comparativo de madurez por equipo</p>
    </div>
    <!-- Tab bar -->
    <div class="tab-bar">
      <div class="tabs">
        <button class="tab" :class="{ active: state.activeTab === 'analysis' }"   @click="state.activeTab = 'analysis'">Análisis</button>
        <button class="tab" :class="{ active: state.activeTab === 'evolution' }"  @click="state.activeTab = 'evolution'">Evolución</button>
        <button class="tab" :class="{ active: state.activeTab === 'plan' }"       @click="state.activeTab = 'plan'">Plan de Acción</button>
        <button class="tab" :class="{ active: state.activeTab === 'teams' }"      @click="state.activeTab = 'teams'">Equipos</button>
        <button class="tab" :class="{ active: state.activeTab === 'config' }"     @click="state.activeTab = 'config'">Configuración</button>
        <button v-if="state.currentRole === 'super_admin'" class="tab"
          :class="{ active: state.activeTab === 'usuarios' }" @click="state.activeTab = 'usuarios'">Usuarios</button>
      </div>
      <div class="tab-actions">
        <input
          v-model="searchQuery"
          @input="onSearch"
          class="search-input"
          type="text"
          placeholder="Buscar equipo…"
          style="font-size:12px;padding:4px 8px;border:1px solid var(--border);border-radius:4px;width:160px;"
        />
        <span v-if="state.currentUserName" style="font-size:12px;color:var(--ink-faint);margin-right:4px;">
          {{ state.currentUserName }}
        </span>
        <button class="btn sm" @click="refresh">↺ Actualizar</button>
        <button class="btn sm danger" @click="doLogout">Cerrar sesión</button>
      </div>
    </div>

    <!-- Banner de cadencia -->
    <div v-if="showCadenceBanner"
      style="background:var(--amber-light);border-bottom:1px solid #e0c06a;padding:11px 20px;font-size:13px;color:var(--amber);display:flex;align-items:center;gap:8px;">
      <span style="font-size:15px;">⏰</span>
      <span>Han pasado <strong>{{ weeksSinceLast === 1 ? '1 semana' : weeksSinceLast + ' semanas' }}</strong> desde la última respuesta — cadencia configurada cada <strong>{{ state.assessmentCadenceWeeks === 1 ? '1 semana' : state.assessmentCadenceWeeks + ' semanas' }}</strong>. ¿Ya abriste el nuevo ciclo?</span>
      <button @click="state.cadenceBannerDismissed = true" title="Descartar"
        style="margin-left:auto;background:none;border:none;cursor:pointer;font-size:18px;color:var(--amber);line-height:1;padding:0 2px;flex-shrink:0;">✕</button>
    </div>

    <!-- Contenido principal -->
    <div class="tab-content-wrapper">
      <AnalysisView  v-if="state.activeTab === 'analysis'"  />
      <EvolutionView v-if="state.activeTab === 'evolution'" />
      <PlanView      v-if="state.activeTab === 'plan'"      />
      <TeamsView     v-if="state.activeTab === 'teams'"     />
      <ConfigView    v-if="state.activeTab === 'config'"    />
      <UsuariosView  v-if="state.activeTab === 'usuarios'"  />
    </div>

    <!-- Toast -->
    <div class="toast" id="toast"></div>

    <!-- Modales Vue -->
    <QRModal         v-if="state.qrModal"         />
    <CloseCycleModal v-if="state.closeCycleModal"  />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { state } from '../../assets/admin-state.js';
import { logout } from '../../assets/admin-auth.js';
import { fetchAllData } from '../../assets/admin-api.js';
import { filterTeams, renderSearchResults, computeSearchStats } from '../../assets/admin-search.js';
import AnalysisView   from './AnalysisView.vue';
import EvolutionView  from './EvolutionView.vue';
import PlanView       from './PlanView.vue';
import TeamsView      from './TeamsView.vue';
import ConfigView     from './ConfigView.vue';
import UsuariosView   from './UsuariosView.vue';
import QRModal        from './QRModal.vue';
import CloseCycleModal from './CloseCycleModal.vue';

const weeksSinceLast = computed(() => {
  if (!state.responses.length) return 0;
  const lastFecha = state.responses[0].fields.Fecha;
  if (!lastFecha) return 0;
  return Math.floor((Date.now() - new Date(lastFecha).getTime()) / (7 * 24 * 60 * 60 * 1000));
});

const showCadenceBanner = computed(() =>
  !!(state.assessmentCadenceWeeks
    && !state.loading
    && !state.cadenceBannerDismissed
    && state.responses.length
    && weeksSinceLast.value >= state.assessmentCadenceWeeks)
);

const searchQuery = ref('');
const searchResultsEl = ref(null);

function onSearch() {
  const matched = filterTeams(searchQuery.value);
  const container = document.getElementById('search-results-panel');
  renderSearchResults(container, matched, searchQuery.value);

  if (matched.length) {
    const stats = computeSearchStats(state.responses.filter(
      (r) => matched.some((t) => (r.fields.Equipo || []).includes(t.id))
    ));
    state.searchStats = stats;
  } else {
    state.searchStats = null;
  }
}

async function doLogout() { await logout(); }
async function refresh()   { await fetchAllData(); }
</script>
