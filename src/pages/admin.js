import { createApp } from 'vue';
import AdminApp from '../components/AdminApp.vue';
import '../../assets/admin.css';

// Exponer a window solo las funciones de modal que siguen usando innerHTML
// con onclick handlers (Grupo D — pendiente de convertir a Vue modals nativos)
import { closeCloseCycleModal, confirmCloseCycle } from '../../assets/admin-render.js';
import { closeQR, copyQRUrl } from '../../assets/admin-render.js';
window.closeCloseCycleModal = closeCloseCycleModal;
window.confirmCloseCycle    = confirmCloseCycle;
window.closeQR              = closeQR;
window.copyQRUrl            = copyQRUrl;

createApp(AdminApp).mount('#app');
