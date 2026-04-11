import { DIMS, getLevel, COACHING_QUESTIONS } from '../assessment-config.js';

// Exponer las variables de browser como globales de Node
globalThis.DIMS                = DIMS;
globalThis.getLevel            = getLevel;
globalThis.COACHING_QUESTIONS  = COACHING_QUESTIONS;
globalThis.MIN_ROLE_RESPONSES  = 3;
globalThis.render    = () => {};
globalThis.setState  = () => {};
globalThis.toast     = () => {};
globalThis.state = {
  currentUser: null, currentRole: null, currentUserName: '',
  loginMessage: '', activeTab: 'analysis',
  teams: [], responses: [], teamStats: {}, loading: false,
  cycles: [], plans: [], users: []
};
