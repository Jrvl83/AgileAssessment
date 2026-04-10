import { DIMS, getLevel } from '../assessment-config.js';

// Exponer las variables de browser como globales de Node
globalThis.DIMS      = DIMS;
globalThis.getLevel  = getLevel;
globalThis.render    = () => {};
globalThis.setState  = () => {};
globalThis.toast     = () => {};
globalThis.state = {
  currentUser: null, currentRole: null, currentUserName: '',
  loginMessage: '', activeTab: 'analysis',
  teams: [], responses: [], teamStats: {}, loading: false,
  cycles: [], plans: [], users: []
};
