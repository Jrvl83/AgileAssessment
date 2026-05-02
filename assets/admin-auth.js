import { auth, db } from '../src/firebase-compat.js';
import { state, setState } from './admin-state.js';
import { fetchAllData, fetchUsers } from './admin-api.js';

// ── Auth ─────────────────────────────────────────────────────────
export async function login(email, password) {
  const errEl = document.getElementById('loginError');
  const btn = document.getElementById('loginBtn');
  if (errEl) errEl.textContent = '';
  if (!email || !password) {
    if (errEl) errEl.textContent = 'Ingresa email y contraseña';
    return;
  }
  if (btn) { btn.disabled = true; btn.textContent = 'Ingresando…'; }
  try {
    await auth.signInWithEmailAndPassword(email, password);
    // onAuthStateChanged maneja el resto
  } catch (e) {
    if (errEl) errEl.textContent = 'Email o contraseña incorrectos';
    if (btn) { btn.disabled = false; btn.textContent = 'Ingresar →'; }
  }
}

export async function logout() {
  await auth.signOut();
}

export function initAuth() {
  auth.onAuthStateChanged(async (firebaseUser) => {
    if (!firebaseUser) {
      setState({
        currentUser: null,
        currentRole: null,
        currentUserName: '',
        teams: [],
        responses: [],
        teamStats: {},
        cycles: [],
        plans: [],
        users: [],
      });
      return;
    }

    try {
      const doc = await db.collection('usuarios').doc(firebaseUser.uid).get();
      if (!doc.exists) {
        state.loginMessage = 'No se encontró tu cuenta. Contacta al administrador.';
        await auth.signOut();
        return;
      }
      if (doc.data().activo === false) {
        state.loginMessage = 'Cuenta suspendida. Contacta al administrador.';
        await auth.signOut();
        return;
      }
      state.currentUser = firebaseUser;
      state.currentRole = doc.data().role;
      state.currentUserName = doc.data().nombre || firebaseUser.email;
      state.loginMessage = '';
    } catch (e) {
      await auth.signOut();
      return;
    }

    if (state.currentRole === 'super_admin') await fetchUsers();
    await fetchAllData();
  });
}
