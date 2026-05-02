<template>
  <div class="login-card fade-in">
    <h2>Acceso restringido</h2>
    <p>Ingresa tus credenciales para continuar.</p>
    <div class="field-group">
      <label>Email</label>
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
    <div class="field-group">
      <label>Contraseña</label>
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
    <div id="loginError" class="login-error">{{ loginError }}</div>
    <div v-if="state.loginMessage" style="font-size:13px;color:var(--amber);background:var(--amber-light);padding:8px 12px;border-radius:var(--radius-sm);margin-top:8px;">
      {{ state.loginMessage }}
    </div>
    <div style="margin-top:16px;">
      <button id="loginBtn" class="btn primary" :disabled="loading" @click="doLogin">
        {{ loading ? 'Ingresando…' : 'Ingresar →' }}
      </button>
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
