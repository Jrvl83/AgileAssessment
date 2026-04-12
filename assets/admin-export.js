// ── Export ───────────────────────────────────────────────────────
function downloadCSV(filename, rows) {
  const csv = 'sep=;\r\n' + '\uFEFF' + rows.map(r =>
    r.map(cell => '"' + String(cell == null ? '' : cell).replace(/"/g, '""') + '"').join(';')
  ).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportSummary() {
  const headers = ['Equipo', 'Ciclo', 'Rol', 'Respuestas', 'Score Total %', 'Nivel',
    ...DIMS.map(d => d.label + ' %')];
  const rows = [headers];
  Object.values(state.teamStats).filter(s => s.count > 0).forEach(s => {
    const ds = getTeamFilteredStats(s.id, state.orgRoleFilter, state.cycleFilter);
    if (!ds) return;
    rows.push([s.name, state.cycleFilter === 'Todos' ? 'Todos' : state.cycleFilter,
      state.orgRoleFilter, ds.count, ds.avgTotal, ds.level.label,
      ...DIMS.map(d => ds.avgDims[d.key].pct)]);
  });
  downloadCSV(`resumen-assessment-${new Date().toISOString().slice(0,10)}.csv`, rows);
}

function exportRaw() {
  const headers = ['Fecha', 'Equipo', 'Participante', 'Rol', 'Ciclo', 'Tamaño Equipo', 'Tiempo Scrum',
    'Score Total %', 'Nivel', ...DIMS.map(d => d.label)];
  const rows = [headers];
  [...state.responses]
    .sort((a, b) => (a.fields.Fecha || '').localeCompare(b.fields.Fecha || ''))
    .forEach(r => {
      const team = state.teams.find(t => (r.fields.Equipo || []).includes(t.id));
      rows.push([
        r.fields.Fecha ? new Date(r.fields.Fecha).toLocaleDateString('es') : '',
        team ? team.name : '',
        r.fields.Participante || '',
        r.fields.Rol || '',
        r.fields.Ciclo || '',
        r.fields['Tamaño Equipo'] || '',
        r.fields['Tiempo Scrum'] || '',
        r.fields['Score Total %'] || 0,
        r.fields.Nivel || '',
        ...DIMS.map(d => r.fields[d.field] || 0)
      ]);
    });
  downloadCSV(`respuestas-assessment-${new Date().toISOString().slice(0,10)}.csv`, rows);
}

function exportPDF() { window.print(); }

async function exportPPT(teamId) {
  if (typeof PptxGenJS === 'undefined') { toast('Librería PPT no disponible'); return; }

  const s = state.teamStats[teamId];
  if (!s) return;

  const cf           = state.cycleFilter;
  const selectedRole = state.teamRoleFilter[teamId] || 'Todos';
  const exOtro       = state.excludeOtro && selectedRole === 'Todos';
  const ds           = getTeamFilteredStats(teamId, selectedRole, cf, exOtro);
  if (!ds) { toast('Sin datos para exportar'); return; }

  const teamName   = s.name;
  const cycleLabel = cf === 'Todos' ? 'Todos los ciclos' : cf;
  const dateStr    = new Date().toLocaleDateString('es', { day:'2-digit', month:'long', year:'numeric' });
  const accentHex  = (state.colorAcento || '#1a56db').replace('#', '');
  const marca      = state.marca || 'Assessment Agile';

  // Recomendaciones
  const sortedByPct = DIMS.slice().sort((a, b) => ds.avgDims[a.key].pct - ds.avgDims[b.key].pct);
  const criticalDim = sortedByPct[0] && ds.avgDims[sortedByPct[0].key].pct < 33 ? sortedByPct[0] : null;
  const below80     = DIMS.filter(d => ds.avgDims[d.key].pct < 80).sort((a, b) => ds.avgDims[a.key].pct - ds.avgDims[b.key].pct);
  const recDims     = below80.length > 0 ? below80 : sortedByPct.slice(0, 4);
  const teamResps   = state.responses.filter(r => (r.fields.Equipo || []).includes(teamId));
  const majorityRole = getMajorityRole(teamResps);

  // Radar como imagen
  const radarCanvas = document.getElementById('radar-' + teamId);
  const radarImg    = radarCanvas ? radarCanvas.toDataURL('image/png') : null;

  // Planes del equipo
  const teamPlans = state.plans.filter(p =>
    p.equipoId === teamId && (cf === 'Todos' || p.ciclo === cf)
  );

  const pres     = new PptxGenJS();
  pres.layout    = 'LAYOUT_WIDE';
  pres.author    = marca;
  pres.subject   = 'Assessment de Madurez Agile';

  const levelColor = ds.level.color.replace('#', '');
  const levelBg    = ds.level.bg.replace('#', '');

  // ── Slide 1: Cover ───────────────────────────────────────────
  const s1 = pres.addSlide();
  s1.addShape(pres.ShapeType.rect, { x:0, y:0, w:13.33, h:0.7, fill:{ color: accentHex } });
  s1.addText(marca, { x:0.4, y:0.12, w:10, h:0.46, fontSize:13, color:'FFFFFF', bold:true });
  s1.addText(teamName, { x:0.7, y:1.4, w:11.93, h:1.4, fontSize:44, bold:true, color:'111827', align:'center' });
  s1.addText('Assessment de Madurez Agile', { x:0.7, y:2.8, w:11.93, h:0.5, fontSize:18, color:'6b7280', align:'center' });
  s1.addShape(pres.ShapeType.roundRect, { x:4.67, y:3.5, w:4, h:1.8, fill:{ color: levelBg }, line:{ color: levelColor, width:1.5 }, rectRadius:0.15 });
  s1.addText(ds.avgTotal + '%', { x:4.67, y:3.6, w:4, h:0.9, fontSize:42, bold:true, color: levelColor, align:'center' });
  s1.addText(ds.level.label, { x:4.67, y:4.5, w:4, h:0.5, fontSize:16, color: levelColor, align:'center' });
  s1.addText(`${cycleLabel}  ·  ${ds.count} respuestas  ·  ${dateStr}`, { x:0.7, y:6.4, w:11.93, h:0.4, fontSize:11, color:'9ca3af', align:'center' });
  s1.addShape(pres.ShapeType.rect, { x:0, y:7.1, w:13.33, h:0.4, fill:{ color: accentHex } });

  // ── Slide 2: Radar + Dimensiones ────────────────────────────
  const s2 = pres.addSlide();
  s2.addShape(pres.ShapeType.rect, { x:0, y:0, w:13.33, h:0.55, fill:{ color: accentHex } });
  s2.addText('Análisis por dimensión', { x:0.3, y:0.1, w:8, h:0.38, fontSize:14, bold:true, color:'FFFFFF' });
  s2.addText(teamName + '  ·  ' + cycleLabel, { x:8, y:0.1, w:5, h:0.38, fontSize:11, color:'FFFFFF', align:'right' });

  if (radarImg) {
    s2.addImage({ data: radarImg, x:0.3, y:0.75, w:5.2, h:5.2 });
  }

  const rightX = 5.9;
  DIMS.forEach((d, i) => {
    const pct      = ds.avgDims[d.key].pct;
    const barW     = Math.max((pct / 100) * 6.8, 0.01);
    const dimColor = d.color.replace('#', '');
    const yBase    = 0.85 + i * 0.98;
    s2.addText(d.label, { x: rightX, y: yBase, w:5, h:0.3, fontSize:10, bold:true, color:'374151' });
    s2.addText(pct + '%', { x: rightX + 5, y: yBase, w:1.4, h:0.3, fontSize:10, bold:true, color: dimColor, align:'right' });
    s2.addShape(pres.ShapeType.rect, { x: rightX, y: yBase + 0.33, w:6.8, h:0.28, fill:{ color:'f3f4f6' }, line:{ color:'f3f4f6' } });
    s2.addShape(pres.ShapeType.rect, { x: rightX, y: yBase + 0.33, w: barW, h:0.28, fill:{ color: dimColor }, line:{ color: dimColor } });
  });

  // ── Slide 3: Recomendaciones ─────────────────────────────────
  const s3 = pres.addSlide();
  s3.addShape(pres.ShapeType.rect, { x:0, y:0, w:13.33, h:0.55, fill:{ color: accentHex } });
  s3.addText('Recomendaciones', { x:0.3, y:0.1, w:8, h:0.38, fontSize:14, bold:true, color:'FFFFFF' });
  s3.addText(teamName + '  ·  ' + cycleLabel, { x:8, y:0.1, w:5, h:0.38, fontSize:11, color:'FFFFFF', align:'right' });

  recDims.forEach((d, i) => {
    const pct      = ds.avgDims[d.key].pct;
    const dimColor = d.color.replace('#', '');
    const recText  = getRec(d.key, pct, majorityRole);
    const isCrit   = criticalDim && d.key === criticalDim.key;
    const yBase    = 0.8 + i * 1.08;
    s3.addShape(pres.ShapeType.ellipse, { x:0.3, y: yBase + 0.08, w:0.18, h:0.18, fill:{ color: dimColor }, line:{ color: dimColor } });
    s3.addText(d.label + (isCrit ? '  ⚠ Crítica' : '') + '  ' + pct + '%', { x:0.6, y: yBase, w:12.4, h:0.32, fontSize:11, bold:true, color: dimColor });
    s3.addText(recText, { x:0.6, y: yBase + 0.33, w:12.4, h:0.65, fontSize:10, color:'374151' });
  });

  // ── Slide 4: Plan de acción (si hay planes) ──────────────────
  if (teamPlans.length > 0) {
    const STATUS_C = { 'pendiente':{ c:'a05c0a', bg:'fdefd6', l:'Pendiente' }, 'en-curso':{ c:'1a4fd6', bg:'dce6ff', l:'En curso' }, 'completado':{ c:'0d7a52', bg:'d4f0e5', l:'Completado' } };
    const s4 = pres.addSlide();
    s4.addShape(pres.ShapeType.rect, { x:0, y:0, w:13.33, h:0.55, fill:{ color: accentHex } });
    s4.addText('Plan de Acción', { x:0.3, y:0.1, w:8, h:0.38, fontSize:14, bold:true, color:'FFFFFF' });
    s4.addText(teamName + '  ·  ' + cycleLabel, { x:8, y:0.1, w:5, h:0.38, fontSize:11, color:'FFFFFF', align:'right' });
    s4.addShape(pres.ShapeType.rect, { x:0.3, y:0.72, w:12.73, h:0.38, fill:{ color: accentHex }, line:{ color: accentHex } });
    s4.addText('Iniciativa', { x:0.35, y:0.75, w:6, h:0.32, fontSize:10, bold:true, color:'FFFFFF' });
    s4.addText('Responsable', { x:6.4, y:0.75, w:2.4, h:0.32, fontSize:10, bold:true, color:'FFFFFF' });
    s4.addText('Estado', { x:8.9, y:0.75, w:1.9, h:0.32, fontSize:10, bold:true, color:'FFFFFF' });
    s4.addText('Dimensión', { x:10.9, y:0.75, w:2.1, h:0.32, fontSize:10, bold:true, color:'FFFFFF' });

    teamPlans.slice(0, 12).forEach((p, i) => {
      const st    = STATUS_C[p.estado] || STATUS_C['pendiente'];
      const yRow  = 1.2 + i * 0.45;
      const rowBg = i % 2 === 0 ? 'f9fafb' : 'FFFFFF';
      s4.addShape(pres.ShapeType.rect, { x:0.3, y: yRow, w:12.73, h:0.42, fill:{ color: rowBg }, line:{ color:'e5e7eb' } });
      s4.addText(p.iniciativa || '—', { x:0.35, y: yRow + 0.05, w:6, h:0.32, fontSize:9.5, color:'111827' });
      s4.addText(p.responsable || '—', { x:6.4, y: yRow + 0.05, w:2.4, h:0.32, fontSize:9.5, color:'374151' });
      s4.addShape(pres.ShapeType.roundRect, { x:8.9, y: yRow + 0.08, w:1.6, h:0.25, fill:{ color: st.bg }, line:{ color: st.bg }, rectRadius:0.1 });
      s4.addText(st.l, { x:8.9, y: yRow + 0.08, w:1.6, h:0.25, fontSize:8.5, bold:true, color: st.c, align:'center' });
      s4.addText(p.dimension || '—', { x:10.9, y: yRow + 0.05, w:2.1, h:0.32, fontSize:9.5, color:'374151' });
    });
  }

  const filename = `${teamName.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]/g, '-')}-assessment-${new Date().toISOString().slice(0,10)}.pptx`;
  toast('Generando PPT…');
  await pres.writeFile({ fileName: filename });
}

function exportPlanPDF() {
  const STATUS = {
    'pendiente':  { label:'Pendiente',  color:'#a05c0a', bg:'#fdefd6' },
    'en-curso':   { label:'En curso',   color:'#1a4fd6', bg:'#dce6ff' },
    'completado': { label:'Completado', color:'#0d7a52', bg:'#d4f0e5' },
  };

  const filtered = state.plans
    .filter(p => state.planTeamFilter === 'Todos' || p.equipoNombre === state.planTeamFilter)
    .filter(p => state.planCycleFilter === 'Todos' || p.ciclo === state.planCycleFilter);

  const title = state.planTeamFilter !== 'Todos'
    ? `Plan de Acción — ${state.planTeamFilter}`
    : 'Plan de Acción';
  const cycleLabel = state.planCycleFilter !== 'Todos' ? ` · ${state.planCycleFilter}` : '';
  const dateStr = new Date().toLocaleDateString('es', { day:'2-digit', month:'long', year:'numeric' });

  const counts = { pendiente:0, 'en-curso':0, completado:0 };
  filtered.forEach(p => { if (counts[p.estado] !== undefined) counts[p.estado]++; });

  // Agrupar: en curso primero, luego pendiente, luego completado
  let rows = '';
  ['en-curso', 'pendiente', 'completado'].forEach(status => {
    const items = filtered.filter(p => p.estado === status);
    if (!items.length) return;
    const st = STATUS[status];
    rows += `<tr class="group-header">
      <td colspan="4">
        <span class="badge" style="background:${st.bg};color:${st.color}">${st.label}</span>
        <span class="count">${items.length} acción${items.length !== 1 ? 'es' : ''}</span>
      </td>
    </tr>`;
    items.forEach((p, i) => {
      const fecha = p.fechaObjetivo
        ? new Date(p.fechaObjetivo + 'T12:00:00').toLocaleDateString('es', { day:'2-digit', month:'short', year:'numeric' })
        : '—';
      rows += `<tr class="${i % 2 === 0 ? 'even' : ''}">
        <td class="ini">${p.iniciativa || '—'}</td>
        <td>${p.responsable || '—'}</td>
        <td>${fecha}</td>
        <td>${p.ciclo || '—'}</td>
      </tr>`;
    });
  });

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:-apple-system,Arial,sans-serif; color:#111827; padding:32px 40px; font-size:12px; }
  .header { border-bottom:2.5px solid #1a56db; padding-bottom:14px; margin-bottom:20px; }
  .header h1 { font-size:20px; font-weight:700; color:#1a56db; }
  .header .meta { font-size:11px; color:#6b7280; margin-top:3px; }
  .summary { display:flex; gap:12px; margin-bottom:22px; }
  .s-item { background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:10px 16px; }
  .s-item .num { font-size:20px; font-weight:700; }
  .s-item .lbl { font-size:10px; color:#6b7280; margin-top:1px; }
  table { width:100%; border-collapse:collapse; }
  thead th { background:#1a56db; color:white; font-size:10px; font-weight:600;
    text-transform:uppercase; letter-spacing:0.05em; padding:7px 10px; text-align:left; }
  td { padding:7px 10px; border-bottom:1px solid #f3f4f6; vertical-align:top; }
  tr.even td { background:#fafafa; }
  tr.group-header td { background:#f3f4f6; padding:10px 10px 5px; border-bottom:none; }
  .badge { display:inline-block; font-size:10px; font-weight:700; padding:2px 8px;
    border-radius:99px; margin-right:5px; }
  .count { font-size:11px; color:#6b7280; }
  .ini { font-weight:500; }
  .empty { text-align:center; padding:32px; color:#9ca3af; }
  .footer { margin-top:20px; font-size:10px; color:#9ca3af;
    border-top:1px solid #e5e7eb; padding-top:10px; }
  @media print { body { padding:16px 24px; } }
</style>
</head>
<body>
  <div class="header">
    <h1>${title}${cycleLabel}</h1>
    <div class="meta">Generado el ${dateStr} · Assessment de Madurez Agile</div>
  </div>
  <div class="summary">
    <div class="s-item"><div class="num" style="color:#1a4fd6">${counts['en-curso']}</div><div class="lbl">En curso</div></div>
    <div class="s-item"><div class="num" style="color:#a05c0a">${counts['pendiente']}</div><div class="lbl">Pendiente</div></div>
    <div class="s-item"><div class="num" style="color:#0d7a52">${counts['completado']}</div><div class="lbl">Completado</div></div>
    <div class="s-item"><div class="num">${filtered.length}</div><div class="lbl">Total</div></div>
  </div>
  ${filtered.length ? `
  <table>
    <thead><tr>
      <th style="width:45%">Iniciativa / Acción</th>
      <th style="width:20%">Responsable</th>
      <th style="width:15%">Fecha objetivo</th>
      <th style="width:20%">Ciclo</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>` : `<p class="empty">No hay acciones para los filtros seleccionados.</p>`}
  <div class="footer">Assessment de Madurez Agile · Plan de Acción</div>
</body>
</html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}
