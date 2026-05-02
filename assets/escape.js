// Escape HTML — cubre contextos de texto y atributos (cubre las 5 entidades: & < > " ').
// Cualquier variable user-controlled interpolada en innerHTML o template literals debe pasar por e().
export const e = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
