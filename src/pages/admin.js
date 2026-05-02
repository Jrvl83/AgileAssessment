import { createApp } from 'vue';
import AdminApp from '../components/AdminApp.vue';
import { state, setState } from '../../assets/admin-state.js';
import { login, logout } from '../../assets/admin-auth.js';
import * as adminApi from '../../assets/admin-api.js';
import * as adminRender from '../../assets/admin-render.js';
import * as adminExport from '../../assets/admin-export.js';
import '../../assets/admin.css';

// Exponer funciones a window para onclick handlers en v-html (temporal — se elimina en Fase 5)
Object.assign(window, adminApi);
Object.assign(window, adminRender);
Object.assign(window, adminExport);
window.login = login;
window.logout = logout;
window.setState = setState;
window.state = state;

createApp(AdminApp).mount('#app');
