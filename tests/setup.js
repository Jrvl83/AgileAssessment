import { DIMS, getLevel, COACHING_QUESTIONS } from '../assessment-config.js';
import { state } from '../assets/admin-state.js';

// Exponer variables de config como globales de Node
globalThis.DIMS = DIMS;
globalThis.getLevel = getLevel;
globalThis.COACHING_QUESTIONS = COACHING_QUESTIONS;
globalThis.MIN_ROLE_RESPONSES = 3;
globalThis.render = () => {};
globalThis.setState = () => {};
globalThis.toast = () => {};

// Usar el state real del módulo para que las funciones importadas lean el mismo objeto
globalThis.state = state;
