<template>
  <div>
    <!-- Nuevo workspace admin -->
    <div class="section-card">
      <div class="section-title">Nuevo workspace admin</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
        <div class="field-group" style="margin-bottom:0;">
          <label>Nombre</label>
          <input class="field-input" type="text" placeholder="Nombre del cliente"
            v-model="state.newUserNombre" />
        </div>
        <div class="field-group" style="margin-bottom:0;">
          <label>Email</label>
          <input class="field-input" type="text" placeholder="cliente@empresa.com"
            v-model="state.newUserEmail" @keydown.enter="createUser" />
        </div>
      </div>
      <p style="font-size:12px;color:var(--ink-faint);margin-bottom:12px;">
        Se creará la cuenta y se enviará automáticamente un correo con un link para que el cliente defina su contraseña.
      </p>
      <button class="btn primary"
        :disabled="!state.newUserNombre.trim() || !state.newUserEmail.trim()"
        @click="createUser">
        Crear usuario y enviar invitación
      </button>
    </div>

    <!-- Lista de workspace admins -->
    <div class="section-card">
      <div class="section-title">Workspace admins ({{ state.users.length }})</div>
      <div v-if="state.users.length === 0" class="empty-state" style="padding:24px 0;">
        Aún no has creado ningún workspace admin.
      </div>
      <div v-else style="display:flex;flex-direction:column;gap:10px;">
        <div v-for="u in state.users" :key="u.id"
          style="background:var(--surface);border:1.5px solid var(--border);border-radius:var(--radius-sm);padding:14px 16px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
            <div>
              <div style="font-size:14px;font-weight:500;color:var(--ink);">{{ u.nombre || '—' }}</div>
              <div style="font-size:12px;color:var(--ink-faint);">{{ u.email || '' }}</div>
              <div v-if="u.creadoEn" style="font-size:11px;color:var(--ink-faint);margin-top:2px;">
                Creado: {{ formatDate(u.creadoEn) }}
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <span :style="`font-size:11px;font-weight:600;padding:3px 10px;border-radius:99px;background:${u.activo ? 'var(--green-light)' : 'var(--red-light)'};color:${u.activo ? 'var(--green)' : 'var(--red)'};`">
                {{ u.activo ? 'Activo' : 'Suspendido' }}
              </span>
              <button v-if="u.activo" class="btn sm" @click="suspendUser(u.id, u.nombre)">Suspender</button>
              <button v-else class="btn sm" @click="reactivateUser(u.id, u.nombre)">Reactivar</button>
              <button class="btn sm" @click="resendInvite(u.email, u.nombre)">Reenviar invitación</button>
              <button class="btn sm danger" @click="deleteUser(u.id, u.nombre)">Eliminar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { state } from '../../assets/admin-state.js';
import { createUser, suspendUser, reactivateUser, deleteUser, resendInvite } from '../../assets/admin-api.js';

function formatDate(val) {
  if (!val) return '';
  return val.toDate ? val.toDate().toLocaleDateString('es') : '';
}
</script>
