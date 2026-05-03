<template>
  <div class="login-page">
    <div class="login-card fade-in">
      <div class="login-logo">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2L26 14L14 26L2 14L14 2Z" fill="var(--accent-light)" stroke="var(--accent)" stroke-width="1.5" stroke-linejoin="round"/>
          <path d="M14 8L20 14L14 20L8 14L14 8Z" fill="var(--accent)" stroke="var(--accent)" stroke-width="1" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="login-eyebrow">Panel de Administración</div>
      <h1 class="login-title">Assessment Agile</h1>
      <div class="login-divider"></div>
      <div class="field-group">
        <label>Email</label>
        <div class="field-input-wrapper">
          <svg class="field-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="5" width="16" height="11" rx="2" stroke="currentColor" stroke-width="1.5"/>
            <path d="M2 8l8 4.5L18 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <input
            id="emailInput"
            class="field-input"
            type="email"
            placeholder="tu@email.com"
            v-model="email"
            @keydown.enter="focusPassword"
            autocomplete="email"
          />
        </div>
      </div>
      <div class="field-group">
        <label>Contraseña</label>
        <div class="field-input-wrapper">
          <svg class="field-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="9" width="12" height="9" rx="2" stroke="currentColor" stroke-width="1.5"/>
            <path d="M7 9V7a3 3 0 016 0v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <input
            id="pwInput"
            class="field-input"
            type="password"
            placeholder="••••••••"
            v-model="password"
            @keydown.enter="doLogin"
            autocomplete="current-password"
            ref="pwRef"
          />
        </div>
      </div>
      <div id="loginError" class="login-error">{{ loginError }}</div>
      <div v-if="state.loginMessage" class="login-message">
        {{ state.loginMessage }}
      </div>
      <div style="margin-top:20px;">
        <button id="loginBtn" class="btn primary btn-block" :disabled="loading" @click="doLogin">
          {{ loading ? 'Ingresando…' : 'Ingresar →' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { state } from '../../assets/admin-state.js';
import { login } from '../../assets/admin-auth.js';

const email = ref('');
const password = ref('');
const loginError = ref('');
const loading = ref(false);
const pwRef = ref(null);

function focusPassword() {
  if (pwRef.value) pwRef.value.focus();
}

async function doLogin() {
  loginError.value = '';
  if (!email.value || !password.value) {
    loginError.value = 'Ingresa email y contraseña';
    return;
  }
  loading.value = true;
  await login(email.value, password.value);
  loading.value = false;
}
</script>
