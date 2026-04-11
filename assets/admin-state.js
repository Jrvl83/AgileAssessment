// ── Firebase Init ────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyDcsMNbGqwmkbgg3k41dPfKCEgWMnX0SaM",
  authDomain: "agile-assessment-5a117.firebaseapp.com",
  projectId: "agile-assessment-5a117",
  storageBucket: "agile-assessment-5a117.firebasestorage.app",
  messagingSenderId: "41571782884",
  appId: "1:41571782884:web:e8b96178aeffc4649edcf1"
};
firebase.initializeApp(firebaseConfig);
const db  = firebase.firestore();
const auth = firebase.auth();
const fns  = firebase.functions();

// LEVELS, DIMS, RECS, RECS_ROLE, getLevel, getRec → assessment-config.js

// Mínimo de respuestas por rol para mostrar el desglose por rol (protección de anonimato)
const MIN_ROLE_RESPONSES = 3;

// ── State ────────────────────────────────────────────────────────
const state = {
  currentUser:        null,
  currentRole:        null,
  currentUserName:    '',
  loginMessage:       '',
  activeTab:          'analysis',
  teams:              [],
  responses:          [],
  teamStats:          {},
  loading:            false,
  newTeamName:        '',
  teamRoleFilter:     {},
  orgRoleFilter:      'Todos',
  cycles:             [],
  cycleFilter:        'Todos',
  evolTeamId:         '',
  evolRole:           'Todos',
  newCycleName:       '',
  plans:              [],
  newPlanTeamId:      '',
  newPlanIniciativa:  '',
  newPlanResponsable: '',
  newPlanFecha:       '',
  newPlanCiclo:       '',
  recTexts:           {},
  planTeamFilter:     'Todos',
  planCycleFilter:    'Todos',
  users:              [],
  newUserNombre:      '',
  newUserEmail:       '',
  teamRecsExpanded:   {},
  teamDetailExpanded: {},
  teamGapsExpanded:   {},
  newPlanDimension:   '',
  excludeOtro:        false,
  reports:            [],
  briefingTexto:      '',
  marca:              '',
  logoUrl:            '',
  colorAcento:        ''
};

// setState actualiza el estado y dispara un re-render.
// Llamar con patch vacío (setState({})) solo para re-renderizar sin cambiar estado.
function setState(patch) {
  Object.assign(state, patch);
  render();
}
