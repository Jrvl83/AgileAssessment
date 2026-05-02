<template>
  <div>
    <!-- Tab bar (Vue-native, sin v-html) -->
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
        <span v-if="state.currentUserName" style="font-size:12px;color:var(--ink-faint);margin-right:4px;">
          {{ state.currentUserName }}
        </span>
        <button class="btn sm" @click="refresh">↺ Actualizar</button>
        <button class="btn sm danger" @click="doLogout">Cerrar sesión</button>
      </div>
    </div>

    <!-- Contenido de tabs via v-html (temporal — se reemplaza en Fase 5) -->
    <div v-html="tabContent" ref="tabContentEl"></div>

    <!-- Toast -->
    <div class="toast" id="toast"></div>

    <!-- Modal QR -->
    <div
      id="qr-modal"
      style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:100;align-items:center;justify-content:center;"
    ></div>

    <!-- Modal cierre de ciclo -->
    <div
      id="close-cycle-modal"
      style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:100;align-items:center;justify-content:center;"
    ></div>
  </div>
</template>

<script setup>
import { computed, watch, nextTick, ref } from 'vue';
import { state } from '../../assets/admin-state.js';
import { logout } from '../../assets/admin-auth.js';
import { fetchAllData } from '../../assets/admin-api.js';
import {
  renderCadenceBanner,
  renderAnalysis,
  renderEvolution,
  renderPlan,
  renderTeams,
  renderConfig,
  renderUsuarios,
  initRadarCharts,
  initEvolutionTrendChart,
  initOrgTrendChart,
} from '../../assets/admin-render.js';

const tabContentEl = ref(null);

const tabContent = computed(() => {
  window._radarData = {};
  window._compareData = null;
  window._evolTrendData = null;
  window._orgTrendData = null;

  const banner = renderCadenceBanner();
  let content = '';
  switch (state.activeTab) {
    case 'analysis':  content = renderAnalysis();  break;
    case 'evolution': content = renderEvolution(); break;
    case 'plan':      content = renderPlan();       break;
    case 'teams':     content = renderTeams();      break;
    case 'config':    content = renderConfig();     break;
    case 'usuarios':  content = renderUsuarios();   break;
    default:          content = renderAnalysis();
  }
  return banner + content;
});

watch(tabContent, async () => {
  await nextTick();
  initRadarCharts();
  initEvolutionTrendChart();
  initOrgTrendChart();
}, { flush: 'post' });

async function doLogout() {
  await logout();
}

async function refresh() {
  await fetchAllData();
}
</script>
