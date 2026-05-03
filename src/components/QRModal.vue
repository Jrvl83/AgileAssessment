<template>
  <div
    style="display:flex;position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:100;align-items:center;justify-content:center;"
    @click.self="close">

    <!-- Compartir assessment (QR) -->
    <div v-if="modal.type === 'qr'"
      style="background:white;border-radius:var(--radius);padding:28px;max-width:380px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.2);">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <div style="font-size:16px;font-weight:600;color:var(--ink);">Compartir assessment</div>
        <button @click="close" aria-label="Cerrar"
          style="background:none;border:none;font-size:20px;line-height:1;cursor:pointer;color:var(--ink-faint);padding:0 2px;">✕</button>
      </div>
      <div style="font-size:13px;color:var(--ink-muted);margin-bottom:20px;">
        Comparte este QR con el equipo <strong>{{ modal.teamName }}</strong> para que accedan al assessment con el equipo pre-seleccionado.
      </div>
      <div ref="qrDiv" style="display:flex;justify-content:center;margin-bottom:20px;"></div>
      <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 12px;font-size:11px;color:var(--ink-muted);word-break:break-all;margin-bottom:16px;">{{ modal.url }}</div>
      <div style="display:flex;gap:8px;">
        <button class="btn primary" @click="copyUrl(modal.url)" style="flex:1;">Copiar link</button>
        <button class="btn" @click="close">Cerrar</button>
      </div>
    </div>

    <!-- Reporte para stakeholders -->
    <div v-else-if="modal.type === 'report'"
      style="background:white;border-radius:var(--radius);padding:28px;max-width:480px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.2);">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <div style="font-size:16px;font-weight:600;color:var(--ink);">Reporte para stakeholders</div>
        <button @click="close" aria-label="Cerrar"
          style="background:none;border:none;font-size:20px;line-height:1;cursor:pointer;color:var(--ink-faint);padding:0 2px;">✕</button>
      </div>
      <div style="font-size:13px;color:var(--ink-muted);margin-bottom:16px;">
        Link de <strong>solo lectura</strong> para
        <strong>{{ modal.teamName }}{{ modal.ciclo && modal.ciclo !== 'Todos' ? ' · ' + modal.ciclo : '' }}</strong>.
        Sin login ni controles de edición. Válido 30 días.
      </div>
      <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 12px;font-size:11px;color:var(--ink-muted);word-break:break-all;margin-bottom:16px;">{{ modal.url }}</div>
      <div style="display:flex;gap:8px;">
        <button class="btn primary" @click="copyUrl(modal.url)" style="flex:1;">Copiar link</button>
        <button class="btn" @click="close">Cerrar</button>
      </div>
    </div>

    <!-- Portal del equipo -->
    <div v-else-if="modal.type === 'portal'"
      style="background:white;border-radius:var(--radius);padding:28px;max-width:480px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.2);">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <div style="font-size:16px;font-weight:600;color:var(--ink);">Portal del equipo</div>
        <button @click="close" aria-label="Cerrar"
          style="background:none;border:none;font-size:20px;line-height:1;cursor:pointer;color:var(--ink-faint);padding:0 2px;">✕</button>
      </div>
      <div style="font-size:13px;color:var(--ink-muted);margin-bottom:16px;">
        Link permanente de <strong>solo lectura</strong> para <strong>{{ modal.teamName }}</strong>.<br>
        El equipo puede ver sus resultados, evolución histórica y plan de acción.
      </div>
      <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 12px;font-size:11px;color:var(--ink-muted);word-break:break-all;margin-bottom:16px;">{{ modal.url }}</div>
      <div style="display:flex;gap:8px;">
        <button class="btn primary" @click="copyUrl(modal.url)" style="flex:1;">Copiar link</button>
        <button class="btn" @click="close">Cerrar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { state } from '../../assets/admin-state.js';
import { toast } from '../../assets/admin-toast.js';

const modal = computed(() => state.qrModal);
const qrDiv = ref(null);

watch(qrDiv, (div) => {
  if (!div || modal.value?.type !== 'qr') return;
  div.innerHTML = '';
  if (typeof window.QRCode !== 'undefined') {
    new window.QRCode(div, { text: modal.value.url, width: 180, height: 180, colorDark: '#0f1117', colorLight: '#ffffff' });
  } else {
    div.innerHTML = '<div style="font-size:12px;color:var(--ink-faint);text-align:center;padding:16px;">Copia el link de arriba para compartir.</div>';
  }
}, { flush: 'post' });

function close() { state.qrModal = null; }

function copyUrl(url) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => toast('Link copiado'));
  } else {
    const ta = document.createElement('textarea');
    ta.value = url;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    toast('Link copiado');
  }
}

function handleEsc(e) { if (e.key === 'Escape') close(); }
onMounted(() => document.addEventListener('keydown', handleEsc));
onUnmounted(() => document.removeEventListener('keydown', handleEsc));
</script>
