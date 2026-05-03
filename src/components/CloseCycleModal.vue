<template>
  <div
    style="display:flex;position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:100;align-items:center;justify-content:center;">
    <div style="background:white;border-radius:14px;padding:32px;max-width:420px;width:90%;box-shadow:0 24px 80px rgba(0,0,0,.22);">
      <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#c0282a;margin-bottom:8px;">Cierre de ciclo</div>
      <h3 style="font-family:'DM Serif Display',serif;font-size:20px;color:var(--ink);margin-bottom:4px;">{{ cycleName }}</h3>
      <p style="font-size:13px;color:var(--ink-muted);margin-bottom:18px;line-height:1.6;">
        El ciclo se marcará como <strong>cerrado</strong>. Los portales del equipo se sincronizarán con los datos finales
        y se registrará el evento en el webhook si está configurado.
      </p>
      <div style="background:var(--surface-2);border-radius:8px;padding:0 14px;margin-bottom:16px;">
        <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #f0efe9;">
          <span style="font-size:22px;font-weight:700;color:#1a4fd6;">{{ respCount }}</span>
          <span style="font-size:13px;color:var(--ink-muted);">respuesta{{ respCount !== 1 ? 's' : '' }} registradas</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #f0efe9;">
          <span style="font-size:22px;font-weight:700;color:#0d7a52;">{{ teamsWithResp }}</span>
          <span style="font-size:13px;color:var(--ink-muted);">equipo{{ teamsWithResp !== 1 ? 's' : '' }} con respuestas</span>
        </div>
      </div>
      <div v-if="noResp.length"
        style="margin-top:12px;padding:10px 12px;background:#fdefd6;border-radius:6px;font-size:12px;color:#a05c0a;">
        <strong>Sin respuestas este ciclo:</strong> {{ noResp.map(t => t.name).join(', ') }}
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:22px;">
        <button class="btn sm secondary" @click="cancel">Cancelar</button>
        <button class="btn sm danger" :disabled="confirming" @click="doConfirm">Confirmar cierre</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { state } from '../../assets/admin-state.js';
import { toggleCycle } from '../../assets/admin-api.js';

const cycleId   = computed(() => state.closeCycleModal?.cycleId);
const cycleName = computed(() => state.closeCycleModal?.cycleName);

const resps = computed(() =>
  state.responses.filter(r => r.fields.Ciclo === cycleName.value)
);
const teamSet = computed(() =>
  new Set(resps.value.map(r => (r.fields.Equipo || [])[0]).filter(Boolean))
);
const noResp = computed(() =>
  state.teams.filter(t => t.active && !teamSet.value.has(t.id))
);
const respCount     = computed(() => resps.value.length);
const teamsWithResp = computed(() => teamSet.value.size);

const confirming = ref(false);

function cancel() { state.closeCycleModal = null; }

async function doConfirm() {
  confirming.value = true;
  state.closeCycleModal = null;
  await toggleCycle(cycleId.value, cycleName.value, true);
  confirming.value = false;
}

function handleEsc(e) { if (e.key === 'Escape') cancel(); }
onMounted(() => document.addEventListener('keydown', handleEsc));
onUnmounted(() => document.removeEventListener('keydown', handleEsc));
</script>
