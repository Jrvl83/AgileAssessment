<template>
  <div>
    <!-- Gestión de ciclos -->
    <div class="section-card">
      <div class="section-title">Gestión de ciclos</div>
      <div class="add-row" style="margin-bottom:16px;">
        <div class="field-group" style="flex:1;margin-bottom:0;">
          <label>Nombre del ciclo</label>
          <input class="field-input" type="text" placeholder="Ej. Q1 2026"
            v-model="state.newCycleName" @keydown.enter="addCycle" />
        </div>
        <button class="btn primary" style="flex-shrink:0;margin-bottom:1px;" @click="addCycle">Crear</button>
      </div>
      <div v-if="state.cycles.length === 0" style="font-size:13px;color:var(--ink-faint);padding:8px 0;">
        No hay ciclos creados aún.
      </div>
      <div v-else class="team-list">
        <div v-for="c in state.cycles" :key="c.id" class="cycle-row">
          <div class="cycle-row-name">{{ c.name }}</div>
          <span :class="c.active ? 'badge-active' : 'badge-inactive'">{{ c.active ? 'Activo' : 'Cerrado' }}</span>
          <div style="display:flex;gap:6px;">
            <button class="btn sm" @click="toggleCycle(c.id, c.name, c.active)">
              {{ c.active ? 'Cerrar' : 'Activar' }}
            </button>
            <button class="btn sm danger" @click="deleteCycle(c.id, c.name)">✕</button>
          </div>
        </div>
      </div>
      <p style="font-size:12px;color:var(--ink-faint);margin-top:12px;line-height:1.5;">
        Solo un ciclo puede estar activo a la vez. Las nuevas respuestas del assessment se asignan automáticamente al ciclo activo.
      </p>
    </div>

    <!-- Reportes compartidos -->
    <div v-if="state.reports.length" class="section-card">
      <div class="section-title">Reportes compartidos</div>
      <div class="team-list">
        <div v-for="r in state.reports" :key="r.id" class="team-row">
          <div class="team-row-name" style="font-size:13px;">{{ reportLabel(r) }}</div>
          <span style="font-size:11px;color:var(--ink-faint);">Generado: {{ formatDate(r.generatedAt) }}</span>
          <span :style="`font-size:11px;color:${isExpired(r) ? '#c0282a' : 'var(--ink-faint)'};`">
            {{ isExpired(r) ? '✕ Expirado' : 'Expira: ' + formatDate(r.expiresAt) }}
          </span>
          <div style="display:flex;gap:6px;">
            <button v-if="!isExpired(r)" class="btn sm" @click="copyLink(reportUrl(r))">Copiar link</button>
            <button class="btn sm danger" @click="revokeReport(r.id, reportLabel(r))">Revocar</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Portales de equipo -->
    <div v-if="portalEntries.length" class="section-card">
      <div class="section-title">Portales de equipo activos</div>
      <p style="font-size:12px;color:var(--ink-faint);margin-bottom:14px;line-height:1.5;">
        Links permanentes para que el equipo vea sus resultados, evolución y plan de acción. Sin login ni controles de admin.
      </p>
      <div class="team-list">
        <div v-for="[tid, p] in portalEntries" :key="tid" class="team-row">
          <template v-if="teamById(tid)">
            <div class="team-row-name" style="font-size:13px;">{{ teamById(tid).name }}</div>
            <span style="font-size:11px;color:var(--ink-faint);">Actualizado: {{ formatUpdatedAt(p.updatedAt) }}</span>
            <div style="display:flex;gap:6px;">
              <button class="btn sm" @click="copyLink(portalUrl(p))">Copiar link</button>
              <button class="btn sm" @click="syncPortalAndRefresh(tid)">Sincronizar</button>
              <button class="btn sm danger" @click="revokePortal(tid, teamById(tid).name)">Revocar</button>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Marca del workspace -->
    <div class="section-card">
      <div class="section-title">Marca del workspace</div>
      <p style="font-size:13px;color:var(--ink-faint);margin-bottom:16px;line-height:1.6;">
        Personaliza la apariencia del formulario y los reportes compartidos con la identidad de tu consultora o cliente.
      </p>
      <div style="display:grid;gap:16px;">
        <div class="field-group" style="margin-bottom:0;">
          <label>Nombre de marca</label>
          <input class="field-input" type="text" placeholder="Ej. Agile Warriors"
            :value="state.marca" @input="saveBranding('marca', $event.target.value)" />
          <span style="font-size:11px;color:var(--ink-faint);margin-top:4px;display:block;">Aparece en el encabezado del formulario y del reporte. Si se deja vacío, se usa el nombre por defecto.</span>
        </div>
        <div class="field-group" style="margin-bottom:0;">
          <label>URL del logo</label>
          <input class="field-input" type="url" placeholder="https://ejemplo.com/logo.png"
            :value="state.logoUrl" @input="saveBranding('logoUrl', $event.target.value)" />
          <span style="font-size:11px;color:var(--ink-faint);margin-top:4px;display:block;">Reemplaza el título con una imagen. Tamaño recomendado: 180×48 px, formato PNG o SVG.</span>
        </div>
        <div class="field-group" style="margin-bottom:0;">
          <label>Color de acento</label>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">
            <input type="color" :value="state.colorAcento || '#1a4fd6'"
              @input="saveBranding('colorAcento', $event.target.value)"
              style="width:36px;height:30px;padding:2px;border:1.5px solid var(--border);border-radius:6px;cursor:pointer;background:white;" />
            <span style="font-size:12px;font-family:monospace;color:var(--ink-muted);">{{ state.colorAcento || '#1a4fd6' }}</span>
          </div>
          <span style="font-size:11px;color:var(--ink-faint);">Sustituye el azul (#1a4fd6) por defecto en el formulario y reportes.</span>
        </div>
      </div>
    </div>

    <!-- Briefing -->
    <div class="section-card">
      <div class="section-title">Briefing pre-assessment</div>
      <p style="font-size:13px;color:var(--ink-faint);margin-bottom:12px;line-height:1.6;">
        Texto que el participante ve antes de comenzar el formulario. Úsalo para encuadrar el propósito y la anonimidad del assessment.
      </p>
      <textarea :value="state.briefingTexto || ''"
        placeholder="Este assessment es anónimo. Los resultados se analizan de forma agregada…"
        @input="saveBriefing($event.target.value)"
        style="width:100%;box-sizing:border-box;min-height:100px;font-size:13px;font-family:inherit;color:var(--ink);border:1.5px solid var(--border);border-radius:var(--radius-sm);padding:10px 12px;resize:vertical;background:#f9fafb;line-height:1.6;"></textarea>
      <p style="font-size:11px;color:var(--ink-faint);margin-top:6px;">Guardado automáticamente. Si lo dejas vacío, no se muestra pantalla de briefing.</p>
    </div>

    <!-- Agregar equipo -->
    <div class="section-card">
      <div class="section-title">Agregar equipo</div>
      <div class="add-row">
        <div class="field-group">
          <label>Nombre del equipo</label>
          <input class="field-input" type="text" placeholder="Ej. Equipo Phoenix"
            v-model="state.newTeamName" @keydown.enter="addTeam" />
        </div>
        <button class="btn primary" style="flex-shrink:0;margin-bottom:1px;" @click="addTeam">Agregar</button>
      </div>
    </div>

    <!-- Lista de equipos -->
    <div class="section-card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <div class="section-title" style="margin-bottom:0;">Equipos registrados</div>
        <a href="https://console.firebase.google.com/project/agile-assessment-5a117/firestore"
          target="_blank" class="btn sm">Ver en Firebase ↗</a>
      </div>
      <div v-if="state.loading" class="empty-state">Cargando equipos…</div>
      <div v-else-if="state.teams.length === 0" class="empty-state">No hay equipos aún. Agrega el primero.</div>
      <div v-else class="team-list">
        <div v-for="t in state.teams" :key="t.id" class="team-row">
          <div class="team-row-name">
            {{ t.name }}
            <span v-if="ownerLabel(t)"
              style="font-size:10px;background:var(--accent-light);color:var(--accent);padding:1px 7px;border-radius:99px;margin-left:6px;">
              {{ ownerLabel(t) }}
            </span>
          </div>
          <span class="team-count-badge">{{ teamCount(t) }} respuesta{{ teamCount(t) !== 1 ? 's' : '' }}</span>
          <span :class="t.active ? 'badge-on' : 'badge-off'">{{ t.active ? 'Activo' : 'Inactivo' }}</span>
          <select
            :style="`font-size:11px;border:1px solid var(--border);border-radius:6px;padding:2px 6px;color:${t.category ? 'var(--ink)' : 'var(--ink-faint)'};background:#fff;cursor:pointer;flex-shrink:0;`"
            :value="t.category || ''"
            @change="saveTeamCategory(t.id, $event.target.value)"
            title="Categoría del equipo para benchmark segmentado">
            <option value="">Categoría…</option>
            <option v-for="cat in TEAM_CATS" :key="cat" :value="cat">{{ cat }}</option>
          </select>
          <div style="display:flex;gap:6px;">
            <button class="btn sm" @click="showQR(t.id, t.name)">QR</button>
            <button class="btn sm" title="Abrir modo facilitación para este equipo" @click="openFacilitar(t.id)">Facilitar →</button>
            <button v-if="state.portals && state.portals[t.id]" class="btn sm" @click="showExistingPortal(t.id, t.name)">Portal ↗</button>
            <button v-else class="btn sm" @click="createPortal(t.id)">+ Portal</button>
            <button class="btn sm" @click="toggleActive(t.id, t.name, t.active)">
              {{ t.active ? 'Desactivar' : 'Activar' }}
            </button>
            <button class="btn sm danger" @click="deleteTeam(t.id, t.name)">✕</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { state } from '../../assets/admin-state.js';
import {
  addTeam, deleteTeam, toggleActive, saveTeamCategory,
  addCycle, deleteCycle, toggleCycle,
  generateReport, revokeReport,
  createPortal, revokePortal, syncPortalAndRefresh,
  saveBriefing, saveBranding,
} from '../../assets/admin-api.js';
import {
  showQR, showExistingPortal, openFacilitar,
} from '../../assets/admin-render.js';
import { toast } from '../../assets/admin-toast.js';

const TEAM_CATS = ['Software', 'Conocimiento', 'Operaciones', 'Otro'];

const portalEntries = computed(() =>
  state.portals ? Object.entries(state.portals) : []
);

function teamById(tid)  { return state.teams.find((t) => t.id === tid); }
function teamCount(t)   { return state.teamStats[t.id] ? state.teamStats[t.id].count : 0; }
function ownerLabel(t) {
  if (state.currentRole !== 'super_admin' || !t.ownerId) return null;
  const u = state.users.find((u) => u.id === t.ownerId);
  return u ? (u.nombre || u.email) : null;
}

function reportLabel(r)  { return r.equipoNombre + (r.ciclo && r.ciclo !== 'Todos' ? ' · ' + r.ciclo : ''); }
function reportUrl(r)    { return location.origin + '/reporte.html?t=' + r.id; }
function portalUrl(p)    { return location.origin + '/equipo.html?t=' + p.token; }
function isExpired(r)    { return r.expiresAt && r.expiresAt < new Date(); }

function formatDate(val) {
  if (!val) return '—';
  return val.toDate ? val.toDate().toLocaleDateString('es') : val instanceof Date ? val.toLocaleDateString('es') : '—';
}
function formatUpdatedAt(val) {
  if (!val) return '—';
  const d = val instanceof Date ? val : (val.toDate ? val.toDate() : null);
  return d ? d.toLocaleDateString('es') : '—';
}

function copyLink(url) {
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
</script>
