<template>
  <AdminLogin v-if="!state.currentUser" />
  <AdminShell v-else />
</template>

<script setup>
import { onMounted } from 'vue';
import { state } from '../../assets/admin-state.js';
import { initAuth } from '../../assets/admin-auth.js';
import AdminLogin from './AdminLogin.vue';
import AdminShell from './AdminShell.vue';

onMounted(() => {
  initAuth();
});
</script>
