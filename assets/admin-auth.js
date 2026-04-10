// ── Auth ─────────────────────────────────────────────────────────
async function login() {
  const email    = (document.getElementById('emailInput').value || '').trim();
  const password = document.getElementById('pwInput').value;
  const errEl    = document.getElementById('loginError');
  const btn      = document.getElementById('loginBtn');
  errEl.textContent = '';
  if (!email || !password) { errEl.textContent = 'Ingresa email y contraseña'; return; }
  btn.disabled = true; btn.textContent = 'Ingresando…';
  try {
    await auth.signInWithEmailAndPassword(email, password);
    // onAuthStateChanged maneja el resto
  } catch(e) {
    errEl.textContent = 'Email o contraseña incorrectos';
    btn.disabled = false; btn.textContent = 'Ingresar →';
  }
}

async function logout() {
  await auth.signOut();
  // onAuthStateChanged maneja la limpieza
}

// ── Init ─────────────────────────────────────────────────────────
render(); // Muestra login inmediatamente mientras Firebase resuelve la sesión
auth.onAuthStateChanged(async (firebaseUser) => {
  if (!firebaseUser) {
    setState({
      currentUser: null, currentRole: null, currentUserName: '',
      teams: [], responses: [], teamStats: {}, cycles: [], plans: [], users: []
    });
    return;
  }

  // Leer documento de usuario en Firestore
  try {
    const allSnap = await db.collection('usuarios').get();
    console.log('DEBUG usuarios en Firestore:', allSnap.docs.map(d => d.id));
    const doc = await db.collection('usuarios').doc(firebaseUser.uid).get();
    console.log('DEBUG uid:', firebaseUser.uid, '| doc.exists:', doc.exists);
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
    state.currentUser     = firebaseUser;
    state.currentRole     = doc.data().role;
    state.currentUserName = doc.data().nombre || firebaseUser.email;
    state.loginMessage    = '';
  } catch(e) {
    await auth.signOut();
    return;
  }

  if (state.currentRole === 'super_admin') await fetchUsers();
  await fetchAllData();
});
