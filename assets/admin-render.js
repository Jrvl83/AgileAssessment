// ── Toast ────────────────────────────────────────────────────────
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2800);
}

// ── Helpers de UI ────────────────────────────────────────────────
function prefillPlan(teamId, recKey, ciclo, dimension) {
  const activeCycle = (state.cycles.find(c => c.active) || {}).name || '';
  setState({
    newPlanTeamId:     teamId,
    newPlanIniciativa: state.recTexts[recKey] || '',
    newPlanCiclo:      (!ciclo || ciclo === 'Todos') ? activeCycle : ciclo,
    newPlanDimension:  dimension || '',
    activeTab:         'plan'
  });
  setTimeout(() => {
    const el = document.getElementById('plan-form');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 60);
}

// teamRoleFilter es un objeto anidado — helper para mutarlo y re-renderizar
function setTeamRole(tid, role) {
  state.teamRoleFilter[tid] = role;
  render();
}

function toggleTeamRecs(tid) {
  state.teamRecsExpanded[tid] = !state.teamRecsExpanded[tid];
  render();
}

function toggleTeamDetail(tid) {
  state.teamDetailExpanded[tid] = !state.teamDetailExpanded[tid];
  render();
}

// ── Detalle por pregunta con histogramas ─────────────────────────
function renderQuestionDetail(tid, selectedRole) {
  const teamResps = state.responses
    .filter(r => (r.fields.Equipo || []).includes(tid))
    .filter(r => state.cycleFilter === 'Todos' || r.fields.Ciclo === state.cycleFilter)
    .filter(r => selectedRole === 'Todos' || r.fields.Rol === selectedRole);

  if (!teamResps.length) {
    return `<div style="padding:12px 0;font-size:13px;color:var(--ink-faint);text-align:center;">Sin respuestas para este filtro.</div>`;
  }

  return SECTIONS.map(sec => {
    const dim = DIMS.find(d => d.key === sec.id);
    const color = dim ? dim.color : '#374151';

    const questions = sec.questions.map((q, qi) => {
      const key = `${sec.id}_${qi}`;
      const counts = [0, 0, 0, 0];
      teamResps.forEach(r => {
        const val = (r.fields.Answers || {})[key];
        if (val !== undefined && val >= 0 && val <= 3) counts[val]++;
      });
      const maxCount = Math.max(...counts, 1);

      const bars = counts.map((c, i) => {
        const widthPct = Math.round(c / maxCount * 100);
        const isTop = c > 0 && c === Math.max(...counts);
        return `
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
            <span style="font-size:10px;color:var(--ink-faint);width:12px;flex-shrink:0;text-align:right;">${i + 1}</span>
            <div style="flex:1;background:#f3f4f6;border-radius:3px;height:9px;overflow:hidden;">
              <div style="width:${widthPct}%;height:100%;background:${isTop ? color : color + '55'};border-radius:3px;"></div>
            </div>
            <span style="font-size:10px;color:var(--ink-faint);width:20px;flex-shrink:0;">${c}</span>
          </div>`;
      }).join('');

      return `
        <div style="margin-bottom:14px;">
          <div style="font-size:11px;font-weight:500;color:var(--ink);margin-bottom:6px;line-height:1.45;">
            P${qi + 1}. ${q.text}
          </div>
          ${bars}
        </div>`;
    }).join('');

    const secComments = teamResps
      .map(r => ((r.fields.Comments || {})[sec.id] || '').trim())
      .filter(c => c.length > 0);

    const commentsHtml = secComments.length > 0 ? `
      <div style="margin-top:14px;padding-top:12px;border-top:1px solid ${color}20;">
        <div style="font-size:10px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;">
          Comentarios (${secComments.length})
        </div>
        ${secComments.map(c => `
          <div style="background:${color}0d;border-left:3px solid ${color}55;border-radius:0 6px 6px 0;
            padding:8px 12px;margin-bottom:6px;font-size:12px;color:var(--ink);line-height:1.5;font-style:italic;">
            "${c.replace(/</g,'&lt;').replace(/>/g,'&gt;')}"
          </div>`).join('')}
      </div>` : '';

    return `
      <div style="margin-bottom:18px;">
        <div style="font-size:10px;font-weight:700;color:${color};text-transform:uppercase;
          letter-spacing:0.06em;margin-bottom:10px;padding-bottom:5px;
          border-bottom:2px solid ${color}25;">
          ${sec.title}
        </div>
        ${questions}
        ${commentsHtml}
      </div>`;
  }).join('');
}

// ── Radar charts ─────────────────────────────────────────────────
function initRadarCharts() {
  if (state.activeTab !== 'analysis') return;
  if (typeof Chart === 'undefined') return;

  const labels = DIMS.map(d => d.label);
  const colors = DIMS.map(d => d.color);

  Object.keys(window._radarData || {}).forEach(tid => {
    const canvas = document.getElementById('radar-' + tid);
    if (!canvas) return;

    // Destruir instancia previa si existe (re-renders)
    const existing = Chart.getChart(canvas);
    if (existing) existing.destroy();

    const values = window._radarData[tid].values;

    new Chart(canvas, {
      type: 'radar',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: 'rgba(26, 86, 219, 0.10)',
          borderColor:     'rgba(26, 86, 219, 0.75)',
          borderWidth: 2,
          pointBackgroundColor: colors,
          pointBorderColor:     '#fff',
          pointBorderWidth: 1.5,
          pointRadius: 4,
          pointHoverRadius: 5,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: { stepSize: 25, display: false, backdropColor: 'transparent' },
            grid:        { color: 'rgba(0,0,0,0.07)' },
            angleLines:  { color: 'rgba(0,0,0,0.07)' },
            pointLabels: {
              font: { size: 11, family: "'DM Sans', sans-serif" },
              color: '#374151',
            },
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.raw}%`
            }
          }
        },
        animation: { duration: 350 },
      }
    });
  });

  // Radar de comparación multi-equipo
  const compareCanvas = document.getElementById('radar-compare');
  if (compareCanvas && window._compareData && window._compareData.teams.length >= 2) {
    const existingCompare = Chart.getChart(compareCanvas);
    if (existingCompare) existingCompare.destroy();
    new Chart(compareCanvas, {
      type: 'radar',
      data: {
        labels,
        datasets: window._compareData.teams.map(t => ({
          label: t.name,
          data:  t.values,
          backgroundColor: t.color + '18',
          borderColor:     t.color,
          borderWidth: 2,
          pointBackgroundColor: t.color,
          pointBorderColor:     '#fff',
          pointBorderWidth: 1.5,
          pointRadius: 3,
          pointHoverRadius: 4,
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: { stepSize: 25, display: false, backdropColor: 'transparent' },
            grid:        { color: 'rgba(0,0,0,0.07)' },
            angleLines:  { color: 'rgba(0,0,0,0.07)' },
            pointLabels: {
              font: { size: 10, family: "'DM Sans', sans-serif" },
              color: '#374151',
            },
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.dataset.label}: ${ctx.raw}%`
            }
          }
        },
        animation: { duration: 350 },
      }
    });
  }
}

// ── Render ───────────────────────────────────────────────────────
function render() {
  const app = document.getElementById('app');
  const active = document.activeElement;
  const focusId  = active ? active.id : null;
  const selStart = active ? active.selectionStart : null;
  const selEnd   = active ? active.selectionEnd   : null;
  const isTyping = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT');

  if (!state.currentUser) { app.innerHTML = renderLogin(); return; }
  window._radarData = {};
  window._compareData = null;
  app.innerHTML = renderShell();
  requestAnimationFrame(initRadarCharts);

  // Solo animar en cambios de tab o carga inicial, no en cada tecla
  if (!isTyping) {
    app.classList.remove('fade-in');
    void app.offsetWidth;
    app.classList.add('fade-in');
  }

  // Restaurar foco y cursor después del render
  if (focusId) {
    const el = document.getElementById(focusId);
    if (el) {
      el.focus();
      if (selStart !== null) {
        try { el.setSelectionRange(selStart, selEnd); } catch(e) {
          // email/number/date no soportan setSelectionRange — forzar cursor al final
          const v = el.value; el.value = ''; el.value = v;
        }
      }
    }
  }
}

function renderLogin() {
  return `
    <div class="login-card fade-in">
      <h2>Acceso restringido</h2>
      <p>Ingresa tus credenciales para continuar.</p>
      <div class="field-group">
        <label>Email</label>
        <input class="field-input" type="email" id="emailInput" placeholder="tu@email.com"
          onkeydown="if(event.key==='Enter')document.getElementById('pwInput').focus()"/>
      </div>
      <div class="field-group">
        <label>Contraseña</label>
        <input class="field-input" type="password" id="pwInput" placeholder="••••••••"
          onkeydown="if(event.key==='Enter')login()"/>
      </div>
      <div id="loginError" class="login-error"></div>
      ${state.loginMessage ? `<div style="font-size:13px;color:var(--amber);background:var(--amber-light);padding:8px 12px;border-radius:var(--radius-sm);margin-top:8px;">${state.loginMessage}</div>` : ''}
      <div style="margin-top:16px;"><button class="btn primary" onclick="login()" id="loginBtn">Ingresar →</button></div>
    </div>`;
}

function renderShell() {
  const userLabel = state.currentUserName
    ? `<span style="font-size:12px;color:var(--ink-faint);margin-right:4px;">${state.currentUserName}</span>`
    : '';
  return `
    <div class="tab-bar">
      <div class="tabs">
        <button class="tab ${state.activeTab==='analysis'?'active':''}"  onclick="setState({activeTab:'analysis'})">Análisis</button>
        <button class="tab ${state.activeTab==='evolution'?'active':''}" onclick="setState({activeTab:'evolution'})">Evolución</button>
        <button class="tab ${state.activeTab==='plan'?'active':''}"      onclick="setState({activeTab:'plan'})">Plan de Acción</button>
        <button class="tab ${state.activeTab==='teams'?'active':''}"     onclick="setState({activeTab:'teams'})">Equipos</button>
        ${state.currentRole === 'super_admin' ? `<button class="tab ${state.activeTab==='usuarios'?'active':''}" onclick="setState({activeTab:'usuarios'})">Usuarios</button>` : ''}
      </div>
      <div class="tab-actions">
        ${userLabel}
        <button class="btn sm" onclick="fetchAllData()">↺ Actualizar</button>
        <button class="btn sm danger" onclick="logout()">Cerrar sesión</button>
      </div>
    </div>
    ${state.activeTab === 'analysis'  ? renderAnalysis()
    : state.activeTab === 'evolution' ? renderEvolution()
    : state.activeTab === 'plan'      ? renderPlan()
    : state.activeTab === 'usuarios'  ? renderUsuarios()
    : renderTeams()}`;
}

// ── Analysis tab ─────────────────────────────────────────────────
function renderAnalysis() {
  if (state.loading) return `<div class="empty-state">Cargando datos…</div>`;

  state.recTexts = {};
  const globalAvgs = computeGlobalDimAverages(state.cycleFilter, state.excludeOtro);
  const withData = Object.values(state.teamStats).filter(s => s.count > 0);
  const availOrgRoles = [...new Set(state.responses.map(r => r.fields.Rol).filter(Boolean))].sort();
  const filtByCycle = state.cycleFilter === 'Todos'
    ? state.responses
    : state.responses.filter(r => r.fields.Ciclo === state.cycleFilter);
  const otroCount = filtByCycle.filter(r => r.fields.Rol === 'Otro').length;

  const exOtro = state.excludeOtro && state.orgRoleFilter === 'Todos';
  const compData = withData.map(s => {
    const fs = getTeamFilteredStats(s.id, state.orgRoleFilter, state.cycleFilter, exOtro);
    return fs ? { id: s.id, name: s.name, ...fs } : null;
  }).filter(Boolean);
  const compSorted = [...compData].sort((a, b) => b.avgTotal - a.avgTotal);

  const orgAvg   = compData.length ? Math.round(compData.reduce((a, s) => a + s.avgTotal, 0) / compData.length) : 0;
  const orgLevel = compData.length ? getLevel(orgAvg) : null;
  const statLabel = state.orgRoleFilter === 'Todos' ? 'Promedio org' : 'Promedio · ' + state.orgRoleFilter;

  const stats = `
    <div class="stats-row">
      <div class="stat-card"><div class="stat-num">${state.teams.length}</div><div class="stat-label">Equipos</div></div>
      <div class="stat-card"><div class="stat-num">${state.responses.length}</div><div class="stat-label">Respuestas</div></div>
      <div class="stat-card"><div class="stat-num">${withData.length}</div><div class="stat-label">Con datos</div></div>
      <div class="stat-card">
        <div class="stat-num" style="color:${orgLevel ? orgLevel.color : 'var(--ink-faint)'}">
          ${compData.length ? orgAvg + '%' : '—'}
        </div>
        <div class="stat-label">${statLabel} · ${orgLevel ? orgLevel.label : 'Sin datos'}</div>
      </div>
    </div>`;

  if (!withData.length) {
    return stats + `<div class="empty-state" style="border:1.5px solid var(--border);border-radius:var(--radius);background:white;">
      Aún no hay respuestas. Comparte el assessment con los equipos para ver el análisis aquí.
    </div>`;
  }

  const exportRow = `
    <div class="no-print" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;">
      <button class="btn sm" onclick="exportPDF()">↓ Exportar PDF</button>
      <button class="btn sm" onclick="exportSummary()">↓ Resumen CSV</button>
      <button class="btn sm" onclick="exportRaw()">↓ Datos completos CSV</button>
    </div>`;

  const availCycles = state.cycles.length
    ? state.cycles.map(c => c.name)
    : [...new Set(state.responses.map(r => r.fields.Ciclo).filter(Boolean))].sort();
  const cyclePills = availCycles.length ? `
    <div class="no-print" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:20px;">
      <span style="font-size:11px;font-weight:600;color:var(--ink-faint);text-transform:uppercase;letter-spacing:0.06em;">Ciclo</span>
      ${['Todos', ...availCycles].map(c => `
        <button class="role-pill ${c === state.cycleFilter ? 'active' : ''}" onclick="setState({cycleFilter:'${c}'})">${c}</button>`
      ).join('')}
    </div>` : '';

  const roleOrgStats = [...new Set(filtByCycle.map(r => r.fields.Rol).filter(Boolean))].sort().map(role => {
    const rr = filtByCycle.filter(r => r.fields.Rol === role);
    const avg = Math.round(rr.reduce((sum, r) => sum + (r.fields['Score Total %'] || 0), 0) / rr.length);
    return { role, count: rr.length, avg, level: getLevel(avg) };
  }).sort((a, b) => b.avg - a.avg);

  const roleCard = roleOrgStats.length > 1 ? `
    <div class="section-card">
      <div class="section-title">Madurez por rol · toda la organización${state.cycleFilter !== 'Todos' ? ' · ' + state.cycleFilter : ''}</div>
      ${roleOrgStats.map(rs => `
        <div class="org-row">
          <div class="org-name">${rs.role}</div>
          <div class="org-bar-wrap"><div class="org-bar" style="width:${rs.avg}%;background:${rs.level.color}"></div></div>
          <div class="org-pct">${rs.avg}%</div>
          <span class="org-badge" style="background:${rs.level.bg};color:${rs.level.color}">${rs.level.label}</span>
          <span style="font-size:11px;color:var(--ink-faint);flex-shrink:0;min-width:52px;text-align:right;">${rs.count} resp.</span>
        </div>`).join('')}
    </div>` : '';

  const orgRoleCounts = { 'Todos': filtByCycle.length };
  availOrgRoles.forEach(r => { orgRoleCounts[r] = filtByCycle.filter(x => x.fields.Rol === r).length; });

  const orgRolePills = ['Todos', ...availOrgRoles].map(r => `
    <button class="role-pill ${r === state.orgRoleFilter ? 'active' : ''}" onclick="setState({orgRoleFilter:'${r}'})">
      ${r} <span style="font-size:10px;opacity:0.65;">(${orgRoleCounts[r]})</span>
    </button>`
  ).join('');

  const otroToggle = otroCount > 0 ? `
    <div class="no-print" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:20px;">
      <span style="font-size:11px;font-weight:600;color:var(--ink-faint);text-transform:uppercase;letter-spacing:0.06em;">Otro</span>
      <button class="role-pill ${state.excludeOtro ? 'active' : ''}"
        style="${state.excludeOtro ? 'background:#fce8e8;color:#c0282a;border-color:#c0282a40;' : ''}"
        onclick="setState({excludeOtro:${!state.excludeOtro}})">
        ${state.excludeOtro ? '✓ ' : ''}Excluir "Otro" <span style="font-size:10px;opacity:0.65;">(${otroCount})</span>
      </button>
      ${state.excludeOtro ? `<span style="font-size:12px;color:var(--ink-faint);">Promedios calculados sin respuestas "Otro"</span>` : ''}
    </div>` : '';

  const comparison = `
    <div class="section-card">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:16px;">
        <div class="section-title" style="margin-bottom:0;">Comparativo organizacional${state.cycleFilter !== 'Todos' ? ' · ' + state.cycleFilter : ''}</div>
        <div class="role-filter no-print" style="margin-bottom:0;padding-bottom:0;border-bottom:none;">${orgRolePills}</div>
      </div>
      ${compSorted.length
        ? compSorted.map(s => `
            <div class="org-row">
              <div class="org-name" title="${s.name}">${s.name}</div>
              <div class="org-bar-wrap"><div class="org-bar" style="width:${s.avgTotal}%;background:${s.level.color}"></div></div>
              <div class="org-pct">${s.avgTotal}%</div>
              <span class="org-badge" style="background:${s.level.bg};color:${s.level.color}">${s.level.label}</span>
            </div>`).join('')
        : `<div style="padding:16px 0;text-align:center;color:var(--ink-faint);font-size:13px;">No hay respuestas para los filtros seleccionados.</div>`}
    </div>`;

  const allSorted = [...withData].sort((a, b) => b.avgTotal - a.avgTotal);

  const cards = `
    <div class="section-title">Detalle por equipo</div>
    <div class="team-grid">
      ${allSorted.map(s => {
        const tid = s.id;
        const selectedRole = state.teamRoleFilter[tid] || 'Todos';
        const teamResps = state.responses.filter(r => (r.fields.Equipo || []).includes(tid));
        const teamAvailRoles = [...new Set(teamResps.map(r => r.fields.Rol).filter(Boolean))].sort();
        const roleCounts = {
          'Todos': state.excludeOtro
            ? teamResps.filter(r => r.fields.Rol !== 'Otro').length
            : teamResps.length
        };
        teamAvailRoles.forEach(r => { roleCounts[r] = teamResps.filter(x => x.fields.Rol === r).length; });
        const rolePills = ['Todos', ...teamAvailRoles].map(r => `
          <button class="role-pill ${r === selectedRole ? 'active' : ''}"
            onclick="setTeamRole('${tid}','${r}')">
            ${r} (${roleCounts[r]})
          </button>`).join('');

        const exOtroTeam = state.excludeOtro && selectedRole === 'Todos';
        const ds = getTeamFilteredStats(tid, selectedRole, state.cycleFilter, exOtroTeam) || s;

        const filteredByCycle = teamResps.filter(r => state.cycleFilter === 'Todos' || r.fields.Ciclo === state.cycleFilter);
        const majorityRole = selectedRole === 'Todos' ? getMajorityRole(filteredByCycle) : null;
        const roleForRec = selectedRole !== 'Todos' ? selectedRole : majorityRole;
        const recRoleNote = selectedRole === 'Todos' && majorityRole
          ? ` <span class="rec-role-note">(rol mayoritario: ${majorityRole})</span>` : '';

        const below80 = DIMS
          .filter(d => ds.avgDims[d.key].pct < 80)
          .sort((a, b) => ds.avgDims[a.key].pct - ds.avgDims[b.key].pct);
        const lowDims = below80.length > 0
          ? below80
          : DIMS.slice().sort((a, b) => ds.avgDims[a.key].pct - ds.avgDims[b.key].pct).slice(0, 4);

        const patterns = detectPatterns(ds.avgDims);
        const patternBlock = patterns.map(p => `
          <div class="pattern-block" style="background:${p.color}18;border-color:${p.color};">
            <div class="pattern-label" style="color:${p.color};">Patrón detectado · ${p.label}</div>
            <div class="pattern-text" style="color:${p.color}cc;">${p.text}</div>
          </div>`).join('');

        const sortedByPct = DIMS.slice().sort((a, b) => ds.avgDims[a.key].pct - ds.avgDims[b.key].pct);
        const criticalDim = sortedByPct[0] && ds.avgDims[sortedByPct[0].key].pct < 33 ? sortedByPct[0] : null;

        const recs = lowDims.length
          ? lowDims.map(d => {
              const ctxNote  = getContextNote(d.key, ds.avgDims[d.key].pct, ds.tamano, ds.tiempoScrum);
              const isCrit   = criticalDim && d.key === criticalDim.key;
              const recKey   = tid + '_' + d.key;
              state.recTexts[recKey] = `${d.label}: ` + getRec(d.key, ds.avgDims[d.key].pct, roleForRec);
              return `
              <div class="rec-item" style="align-items:flex-start;">
                <div class="rec-dot" style="background:${d.color};margin-top:5px;"></div>
                <div class="rec-text" style="flex:1;">
                  ${isCrit ? `<span class="badge-critical no-print">Crítica</span>` : ''}<strong>${d.label}:</strong> ${getRec(d.key, ds.avgDims[d.key].pct, roleForRec)}
                  ${ctxNote ? `<div class="rec-context">⚑ ${ctxNote}</div>` : ''}
                </div>
                <button class="btn-plan no-print" onclick="prefillPlan('${tid}','${recKey}','${state.cycleFilter}','${d.key}')">+ Plan</button>
              </div>`;
            }).join('')
          : `<div class="rec-item">
               <div class="rec-dot" style="background:#0d7a52"></div>
               <div class="rec-text">Buen nivel en todas las dimensiones. Explorar métricas de flujo avanzadas (cycle time, throughput).</div>
             </div>`;

        // Guardar datos del radar para inicializar Chart.js después del render
        window._radarData = window._radarData || {};
        window._radarData[tid] = { values: DIMS.map(d => ds.avgDims[d.key].pct) };

        const recsExpanded   = !!state.teamRecsExpanded[tid];
        const detailExpanded = !!state.teamDetailExpanded[tid];
        const recCount = lowDims.length;
        const commentCount = teamResps.reduce((n, r) =>
          n + SECTIONS.filter(sec => ((r.fields.Comments || {})[sec.id] || '').trim().length > 0).length, 0);

        return `
          <div class="tac">
            <div class="tac-header">
              <div>
                <div class="tac-name">${s.name}</div>
                <div class="tac-meta">${ds.count} respuesta${ds.count !== 1 ? 's' : ''}${selectedRole !== 'Todos' ? ' · ' + selectedRole : ''}${ds.dispersion && ds.dispersion.overall ? `<span style="font-size:10px;font-weight:600;padding:1px 7px;border-radius:99px;margin-left:6px;background:${ds.dispersion.overall.align.bg};color:${ds.dispersion.overall.align.color};">Alineación ${ds.dispersion.overall.align.label}</span>` : ''}</div>
              </div>
              <div class="tac-score">
                <div class="tac-score-num" style="color:${ds.level.color}">${ds.avgTotal}%</div>
                <span class="tac-level" style="background:${ds.level.bg};color:${ds.level.color}">${ds.level.label}</span>
              </div>
            </div>
            <div class="role-filter no-print">${rolePills}</div>
            <div class="no-print" style="display:flex;justify-content:flex-end;margin-bottom:4px;">
              <button class="btn sm" onclick="generateReport('${tid}','${state.cycleFilter||'Todos'}')">↗ Compartir reporte</button>
            </div>
            <canvas id="radar-${tid}" class="radar-canvas no-print"></canvas>
            ${DIMS.map(d => {
              const dp = ds.avgDims[d.key];
              const disp = ds.dispersion && ds.dispersion[d.key];
              const vsG  = globalAvgs ? dp.pct - globalAvgs[d.key] : null;
              const vsBadge = vsG !== null
                ? `<span class="dim-vs-avg ${vsG >= 0 ? 'dim-vs-avg-pos' : 'dim-vs-avg-neg'}">${vsG >= 0 ? '+' : ''}${vsG}% vs. media</span>`
                : '';
              return `<div class="dim-row">
                <div class="dim-row-header">
                  <span class="dim-label">${d.label}</span>
                  <span style="display:flex;align-items:center;gap:4px;"><span class="dim-pct-label">${dp.pct}%</span>${vsBadge}</span>
                </div>
                <div class="dim-bar-wrap">
                  <div class="dim-bar" style="width:${dp.pct}%;background:${d.color}"></div>
                </div>
                ${disp ? `<div style="display:flex;justify-content:space-between;margin-top:2px;">
                  <span style="font-size:10px;color:var(--ink-faint);">Rango: ${disp.min}%–${disp.max}%</span>
                  <span style="font-size:10px;color:${disp.align.color};">±${disp.sd}%</span>
                </div>` : ''}
              </div>`;
            }).join('')}
            <div class="collapse-section">
              <button class="collapse-toggle" onclick="toggleTeamRecs('${tid}')">
                <span class="collapse-toggle-label">
                  Recomendaciones${selectedRole !== 'Todos' ? ' para ' + selectedRole : ''}${recRoleNote}
                  ${recCount ? `<span class="collapse-count">${recCount}</span>` : ''}
                </span>
                <span class="collapse-chevron">${recsExpanded ? '▲' : '▼'}</span>
              </button>
              ${recsExpanded ? `<div class="collapse-body">${patternBlock}${recs}</div>` : ''}
            </div>
            <div class="collapse-section">
              <button class="collapse-toggle" onclick="toggleTeamDetail('${tid}')">
                <span class="collapse-toggle-label">
                  Detalle por pregunta
                  ${commentCount > 0 ? `<span class="collapse-count">${commentCount} comentario${commentCount !== 1 ? 's' : ''}</span>` : ''}
                </span>
                <span class="collapse-chevron">${detailExpanded ? '▲' : '▼'}</span>
              </button>
              ${detailExpanded ? `<div class="collapse-body">${renderQuestionDetail(tid, selectedRole)}</div>` : ''}
            </div>
          </div>`;
      }).join('')}
    </div>`;

  const TEAM_PALETTE = ['#1a4fd6','#0d7a52','#a05c0a','#7c3aed','#c0282a','#0891b2','#d97706','#65a30d'];
  const cellBg   = p => p >= 80 ? '#d4f0e5' : p >= 60 ? '#fdefd6' : '#fce8e8';
  const cellClr  = p => p >= 80 ? '#0d7a52' : p >= 60 ? '#a05c0a' : '#c0282a';

  const compareByDim = compData.length >= 2 ? (() => {
    window._compareData = {
      teams: compSorted.map((s, i) => ({
        name:   s.name,
        values: DIMS.map(d => s.avgDims[d.key].pct),
        color:  TEAM_PALETTE[i % TEAM_PALETTE.length]
      }))
    };
    return `
    <div class="section-card">
      <div class="section-title">Comparativa por dimensión${state.cycleFilter !== 'Todos' ? ' · ' + state.cycleFilter : ''}</div>
      <div style="display:flex;gap:20px;flex-wrap:wrap;align-items:flex-start;">
        <div class="no-print" style="flex:0 0 auto;width:240px;">
          <canvas id="radar-compare" style="display:block;width:100%;max-height:240px;"></canvas>
          <div style="display:flex;flex-direction:column;gap:4px;margin-top:8px;">
            ${compSorted.map((s, i) => `
              <span style="font-size:11px;display:flex;align-items:center;gap:5px;">
                <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${TEAM_PALETTE[i % TEAM_PALETTE.length]};flex-shrink:0;"></span>
                ${s.name}
              </span>`).join('')}
          </div>
        </div>
        <div style="flex:1;min-width:280px;overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead>
              <tr>
                <th style="text-align:left;padding:6px 8px 6px 0;font-size:11px;font-weight:600;color:var(--ink-faint);border-bottom:1.5px solid var(--border);white-space:nowrap;">Equipo</th>
                ${DIMS.map((d, i) => `<th style="text-align:center;padding:6px 4px;font-size:11px;font-weight:600;color:${d.color};border-bottom:1.5px solid var(--border);min-width:58px;">${d.label}</th>`).join('')}
                <th style="text-align:center;padding:6px 4px;font-size:11px;font-weight:600;color:var(--ink-faint);border-bottom:1.5px solid var(--border);min-width:52px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${compSorted.map((s, i) => `
                <tr>
                  <td style="padding:5px 8px 5px 0;font-size:12px;font-weight:500;color:var(--ink);white-space:nowrap;">
                    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${TEAM_PALETTE[i % TEAM_PALETTE.length]};margin-right:5px;vertical-align:middle;"></span>${s.name}
                  </td>
                  ${DIMS.map(d => {
                    const p = s.avgDims[d.key].pct;
                    return `<td style="text-align:center;padding:3px 2px;"><span style="display:inline-block;background:${cellBg(p)};color:${cellClr(p)};font-size:11px;font-weight:700;padding:2px 8px;border-radius:6px;min-width:38px;">${p}%</span></td>`;
                  }).join('')}
                  <td style="text-align:center;padding:3px 2px;"><span style="display:inline-block;background:${cellBg(s.avgTotal)};color:${cellClr(s.avgTotal)};font-size:12px;font-weight:700;padding:2px 8px;border-radius:6px;min-width:38px;">${s.avgTotal}%</span></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
  })() : '';

  return stats + exportRow + cyclePills + otroToggle + roleCard + comparison + compareByDim + cards;
}

// ── Evolution tab ─────────────────────────────────────────────────
function renderEvolution() {
  if (state.loading) return `<div class="empty-state">Cargando datos…</div>`;

  const withData = Object.values(state.teamStats).filter(s => s.count > 0);
  if (!withData.length) return `<div class="empty-state">Aún no hay respuestas para mostrar evolución.</div>`;

  const rolePills = ['Todos', 'Product Owner', 'Dev Team', 'Scrum Master'].map(r => `
    <button class="role-pill ${r === state.evolRole ? 'active' : ''}" onclick="setState({evolRole:'${r}'})">${r}</button>`
  ).join('');

  const selectors = `
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:20px;">
      <select class="field-input" style="max-width:220px;" onchange="setState({evolTeamId:this.value})">
        <option value="">— Seleccionar equipo —</option>
        ${withData.map(s => `<option value="${s.id}" ${s.id === state.evolTeamId ? 'selected' : ''}>${s.name}</option>`).join('')}
      </select>
      ${rolePills}
    </div>`;

  if (!state.evolTeamId) {
    return `
      <div class="section-card">
        <div class="section-title">Evolución por equipo</div>
        ${selectors}
        <div style="color:var(--ink-faint);font-size:13px;padding:8px 0;">Selecciona un equipo para ver su evolución entre ciclos.</div>
      </div>`;
  }

  const data = getEvolutionData(state.evolTeamId, state.evolRole);
  const teamName = withData.find(s => s.id === state.evolTeamId)?.name || '';

  if (!data.length) {
    return `
      <div class="section-card">
        <div class="section-title">Evolución · ${teamName}</div>
        ${selectors}
        <div style="color:var(--ink-faint);font-size:13px;padding:8px 0;">No hay datos para esta combinación.</div>
      </div>`;
  }

  const delta = (curr, prev) => {
    const d = curr - prev;
    if (d > 0) return `<span class="delta-up"> ▲ +${d}%</span>`;
    if (d < 0) return `<span class="delta-dn"> ▼ ${d}%</span>`;
    return `<span class="delta-eq"> → 0%</span>`;
  };

  const timeline = `
    <div class="evo-timeline">
      ${data.map((d, i) => {
        const prev = i > 0 ? data[i - 1] : null;
        return `
          <div class="evo-cycle-card" style="background:${d.level.bg};">
            <div class="evo-cycle-name" style="color:${d.level.color};">${d.cycleName}</div>
            <div class="evo-cycle-score" style="color:${d.level.color};">${d.avgTotal}%${prev ? delta(d.avgTotal, prev.avgTotal) : ''}</div>
            <div class="evo-cycle-meta" style="color:${d.level.color};">${d.level.label} · ${d.count} resp.</div>
          </div>`;
      }).join('')}
    </div>`;

  const dimTable = `
    <div style="overflow-x:auto;">
      <table class="evo-table">
        <thead>
          <tr>
            <th class="evo-th">Dimensión</th>
            ${data.map(d => `<th class="evo-th-c">${d.cycleName}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${DIMS.map(dim => `
            <tr>
              <td class="evo-td-dim">
                <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${dim.color};margin-right:6px;vertical-align:middle;"></span>${dim.label}
              </td>
              ${data.map((d, i) => {
                const pct = d.avgDims[dim.key].pct;
                const prev = i > 0 ? data[i - 1].avgDims[dim.key].pct : null;
                return `<td class="evo-td">
                  <div class="evo-bar-wrap"><div class="evo-bar" style="width:${pct}%;background:${dim.color};"></div></div>
                  <div style="font-weight:600;color:var(--ink);">${pct}%${prev !== null ? delta(pct, prev) : ''}</div>
                </td>`;
              }).join('')}
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;

  const latest = data[data.length - 1];
  const prevCycle = data.length > 1 ? data[data.length - 2] : null;
  const evolTeamResps = state.responses.filter(r => (r.fields.Equipo || []).includes(state.evolTeamId));
  const roleForRec = state.evolRole === 'Todos' ? getMajorityRole(evolTeamResps) : state.evolRole;

  const dimScores = DIMS.map(d => ({
    ...d, pct: latest.avgDims[d.key].pct,
    prevPct: prevCycle ? prevCycle.avgDims[d.key].pct : null
  }));
  const evolBelow80 = [...dimScores]
    .filter(d => d.pct < 80 || (d.prevPct !== null && d.pct < d.prevPct))
    .sort((a, b) => {
      const aR = a.prevPct !== null && a.pct < a.prevPct;
      const bR = b.prevPct !== null && b.pct < b.prevPct;
      if (aR && !bR) return -1;
      if (!aR && bR) return 1;
      return a.pct - b.pct;
    });
  const toFix = evolBelow80.length > 0
    ? evolBelow80
    : [...dimScores].sort((a, b) => a.pct - b.pct).slice(0, 4);

  const recs = toFix.length
    ? toFix.map(d => {
        const regressed = d.prevPct !== null && d.pct < d.prevPct;
        const improved  = d.prevPct !== null && d.pct > d.prevPct && d.pct < 60;
        const diff      = d.prevPct !== null ? Math.abs(d.pct - d.prevPct) : 0;
        const itemClass = regressed ? 'rec-item rec-item--urgent' : improved ? 'rec-item rec-item--improving' : 'rec-item';
        let trendBadge = '';
        if (regressed) trendBadge = `<div class="rec-trend" style="color:var(--red);">▼ Retroceso −${diff}% vs. ciclo anterior</div>`;
        else if (improved) trendBadge = `<div class="rec-trend" style="color:#0d7a52;">▲ Mejora +${diff}% vs. ciclo anterior — mantener el foco</div>`;
        const recKey = 'evol_' + d.key;
        state.recTexts[recKey] = `${d.label}: ` + getRec(d.key, d.pct, roleForRec);
        return `<div class="${itemClass}" style="align-items:flex-start;">
          <div class="rec-dot" style="background:${d.color};flex-shrink:0;margin-top:${regressed||improved?'14px':'5px'}"></div>
          <div class="rec-text" style="flex:1;">
            ${trendBadge}
            <strong>${d.label}:</strong> ${getRec(d.key, d.pct, roleForRec)}
          </div>
          <button class="btn-plan no-print" onclick="prefillPlan('${state.evolTeamId}','${recKey}','')">+ Plan</button>
        </div>`;
      }).join('')
    : `<div class="rec-item">
         <div class="rec-dot" style="background:#0d7a52"></div>
         <div class="rec-text">Excelente progreso en todas las dimensiones. Mantener el ritmo de mejora continua.</div>
       </div>`;

  let qDetailCard = '';
  if (data.length > 1 && latest.avgQuestions && prevCycle && prevCycle.avgQuestions) {
    const qRows = SECTIONS.flatMap(sec =>
      sec.questions.map((q, qi) => {
        const key = sec.id + '_' + qi;
        const latestPct = Math.round((latest.avgQuestions[key] || 0) / 3 * 100);
        const prevPct   = Math.round((prevCycle.avgQuestions[key] || 0) / 3 * 100);
        return { key, text: q.text, secId: sec.id, latestPct, prevPct, delta: latestPct - prevPct };
      })
    );
    const dimSections = DIMS.map(d => {
      const qs = qRows.filter(q => q.secId === d.key);
      if (!qs.length) return '';
      return `
        <div style="margin-bottom:20px;">
          <div style="font-size:11px;font-weight:600;color:${d.color};text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${d.color};margin-right:6px;vertical-align:middle;"></span>${d.label}
          </div>
          ${qs.map((q, i) => `
            <div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--border);">
              <div style="font-size:11px;font-weight:600;color:var(--ink-faint);width:22px;flex-shrink:0;">P${i+1}</div>
              <div style="flex:1;font-size:12px;color:var(--ink-muted);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${q.text}">${q.text.length > 72 ? q.text.slice(0,72)+'…' : q.text}</div>
              <div style="font-size:12px;font-weight:600;color:var(--ink);flex-shrink:0;min-width:36px;text-align:right;">${q.latestPct}%</div>
              <div style="flex-shrink:0;min-width:54px;text-align:right;">
                ${q.delta > 0 ? `<span class="delta-up">▲ +${q.delta}%</span>`
                : q.delta < 0 ? `<span class="delta-dn">▼ ${q.delta}%</span>`
                : `<span class="delta-eq">→ 0%</span>`}
              </div>
            </div>`).join('')}
        </div>`;
    }).join('');
    qDetailCard = `
      <div class="section-card" style="margin-top:0;">
        <div class="section-title">Detalle por pregunta · ${prevCycle.cycleName} → ${latest.cycleName}</div>
        <p style="font-size:12px;color:var(--ink-faint);margin-bottom:16px;line-height:1.5;">Puntaje promedio de cada pregunta en el último ciclo y variación respecto al anterior.</p>
        ${dimSections}
      </div>`;
  }

  // Acciones del Plan de Acción vinculadas a dimensiones para este equipo
  const STATUS_MAP = {
    'pendiente':  { label:'Pendiente',  color:'#a05c0a', bg:'#fdefd6' },
    'en-curso':   { label:'En curso',   color:'#1a4fd6', bg:'#dce6ff' },
    'completado': { label:'Completado', color:'#0d7a52', bg:'#d4f0e5' },
  };
  const teamPlans = state.plans.filter(p => p.equipoId === state.evolTeamId && p.dimension);
  const linkedPlansSection = teamPlans.length && data.length > 1 ? `
    <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border);">
      <div style="font-size:12px;font-weight:700;color:var(--ink-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:14px;">
        Acciones vinculadas a dimensiones
      </div>
      ${DIMS.map(dim => {
        const dimPlans = teamPlans.filter(p => p.dimension === dim.key);
        if (!dimPlans.length) return '';
        const latestPct = latest.avgDims[dim.key].pct;
        const prevPct   = prevCycle ? prevCycle.avgDims[dim.key].pct : null;
        const diff = prevPct !== null ? latestPct - prevPct : null;
        const deltaChip = diff !== null
          ? (diff > 0 ? `<span class="delta-up">▲ +${diff}%</span>`
            : diff < 0 ? `<span class="delta-dn">▼ ${diff}%</span>`
            : `<span class="delta-eq">→ 0%</span>`)
          : '';
        return `
          <div style="margin-bottom:16px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
              <span style="width:8px;height:8px;border-radius:50%;background:${dim.color};flex-shrink:0;display:inline-block;"></span>
              <span style="font-size:12px;font-weight:600;color:${dim.color};">${dim.label}</span>
              ${deltaChip}
            </div>
            ${dimPlans.map(p => {
              const st = STATUS_MAP[p.estado] || { label: p.estado, color:'#374151', bg:'#f3f4f6' };
              return `
                <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;
                  background:var(--surface);border:1px solid var(--border);
                  border-radius:var(--radius-sm);margin-bottom:6px;">
                  <div style="flex:1;font-size:12px;color:var(--ink);min-width:0;">${p.iniciativa}</div>
                  ${p.responsable ? `<span style="font-size:11px;color:var(--ink-faint);flex-shrink:0;">${p.responsable}</span>` : ''}
                  <span style="font-size:10px;font-weight:600;padding:2px 8px;border-radius:99px;
                    background:${st.bg};color:${st.color};flex-shrink:0;">${st.label}</span>
                </div>`;
            }).join('')}
          </div>`;
      }).filter(Boolean).join('')}
    </div>` : '';

  return `
    <div class="section-card">
      <div class="section-title">Evolución · ${teamName}${state.evolRole !== 'Todos' ? ' · ' + state.evolRole : ''}</div>
      ${selectors}
      ${data.length === 1 ? `<p style="font-size:13px;color:var(--amber);background:var(--amber-light);border-radius:var(--radius-sm);padding:10px 14px;margin-bottom:16px;">Solo hay un ciclo con datos. La comparación aparecerá cuando haya más de un ciclo completado.</p>` : ''}
      ${timeline}
      ${data.length > 1 ? dimTable : ''}
      ${linkedPlansSection}
      <div class="recs-section" style="margin-top:16px;">
        <div class="recs-label">Recomendaciones · ${data[data.length-1].cycleName}${state.evolRole !== 'Todos' ? ' · ' + state.evolRole : ''}</div>
        ${recs}
      </div>
    </div>
    ${qDetailCard}`;
}

// ── Teams tab ─────────────────────────────────────────────────────
function renderTeams() {
  const cyclesSection = `
    <div class="section-card">
      <div class="section-title">Gestión de ciclos</div>
      <div class="add-row" style="margin-bottom:16px;">
        <div class="field-group" style="flex:1;margin-bottom:0;">
          <label>Nombre del ciclo</label>
          <input class="field-input" type="text" id="inputNewCycleName" placeholder="Ej. Q1 2026"
            value="${state.newCycleName}" oninput="setState({newCycleName:this.value})"
            onkeydown="if(event.key==='Enter')addCycle()"/>
        </div>
        <button class="btn primary" onclick="addCycle()" style="flex-shrink:0;margin-bottom:1px;">Crear</button>
      </div>
      ${state.cycles.length === 0
        ? `<div style="font-size:13px;color:var(--ink-faint);padding:8px 0;">No hay ciclos creados aún.</div>`
        : `<div class="team-list">
            ${state.cycles.map(c => {
              const esc = c.name.replace(/'/g, "\\'");
              return `<div class="cycle-row">
                <div class="cycle-row-name">${c.name}</div>
                <span class="${c.active ? 'badge-active' : 'badge-inactive'}">${c.active ? 'Activo' : 'Cerrado'}</span>
                <div style="display:flex;gap:6px;">
                  <button class="btn sm" onclick="toggleCycle('${c.id}','${esc}',${c.active})">
                    ${c.active ? 'Cerrar' : 'Activar'}
                  </button>
                  <button class="btn sm danger" onclick="deleteCycle('${c.id}','${esc}')">✕</button>
                </div>
              </div>`;
            }).join('')}
          </div>`}
      <p style="font-size:12px;color:var(--ink-faint);margin-top:12px;line-height:1.5;">Solo un ciclo puede estar activo a la vez. Las nuevas respuestas del assessment se asignan automáticamente al ciclo activo.</p>
    </div>`;

  const addForm = `
    <div class="section-card">
      <div class="section-title">Agregar equipo</div>
      <div class="add-row">
        <div class="field-group">
          <label>Nombre del equipo</label>
          <input class="field-input" type="text" id="inputNewTeamName" placeholder="Ej. Equipo Phoenix"
            value="${state.newTeamName}" oninput="setState({newTeamName:this.value})"
            onkeydown="if(event.key==='Enter')addTeam()"/>
        </div>
        <button class="btn primary" onclick="addTeam()" style="flex-shrink:0;margin-bottom:1px;">Agregar</button>
      </div>
    </div>`;

  const list = state.loading
    ? `<div class="empty-state">Cargando equipos…</div>`
    : state.teams.length === 0
      ? `<div class="empty-state">No hay equipos aún. Agrega el primero.</div>`
      : `<div class="team-list">
          ${state.teams.map(t => {
            const count = state.teamStats[t.id] ? state.teamStats[t.id].count : 0;
            const esc   = t.name.replace(/'/g, "\\'");
            const ownerUser = state.currentRole === 'super_admin' && t.ownerId
              ? state.users.find(u => u.id === t.ownerId) : null;
            const ownerLabel = ownerUser
              ? `<span style="font-size:10px;background:var(--accent-light);color:var(--accent);padding:1px 7px;border-radius:99px;margin-left:6px;">${ownerUser.nombre || ownerUser.email}</span>`
              : '';
            return `<div class="team-row">
              <div class="team-row-name">${t.name}${ownerLabel}</div>
              <span class="team-count-badge">${count} respuesta${count !== 1 ? 's' : ''}</span>
              <span class="${t.active ? 'badge-on' : 'badge-off'}">${t.active ? 'Activo' : 'Inactivo'}</span>
              <div style="display:flex;gap:6px;">
                <button class="btn sm" onclick="showQR('${t.id}','${esc}')">QR</button>
                <button class="btn sm" onclick="toggleActive('${t.id}','${esc}',${t.active})">
                  ${t.active ? 'Desactivar' : 'Activar'}
                </button>
                <button class="btn sm danger" onclick="deleteTeam('${t.id}','${esc}')">✕</button>
              </div>
            </div>`;
          }).join('')}
        </div>`;

  return cyclesSection + addForm + `
    <div class="section-card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <div class="section-title" style="margin-bottom:0;">Equipos registrados</div>
        <a href="https://console.firebase.google.com/project/agile-assessment-5a117/firestore" target="_blank" class="btn sm">Ver en Firebase ↗</a>
      </div>
      ${list}
    </div>`;
}

// ── Reporte compartible ───────────────────────────────────────────
function showReportLink(url, teamName, ciclo) {
  const modal = document.getElementById('qr-modal');
  modal.style.display = 'flex';
  const cicloLabel = ciclo && ciclo !== 'Todos' ? ` · ${ciclo}` : '';
  const escapedUrl = url.replace(/'/g, "\\'");
  modal.innerHTML = `
    <div style="background:white;border-radius:var(--radius);padding:28px;max-width:480px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.2);" onclick="event.stopPropagation()">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <div style="font-size:16px;font-weight:600;color:var(--ink);">Reporte para stakeholders</div>
        <button onclick="closeQR()" style="background:none;border:none;font-size:20px;line-height:1;cursor:pointer;color:var(--ink-faint);padding:0 2px;">✕</button>
      </div>
      <div style="font-size:13px;color:var(--ink-muted);margin-bottom:16px;">
        Link de <strong>solo lectura</strong> para <strong>${teamName}${cicloLabel}</strong>.
        Sin login ni controles de edición. Válido 30 días.
      </div>
      <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 12px;font-size:11px;color:var(--ink-muted);word-break:break-all;margin-bottom:16px;">${url}</div>
      <div style="display:flex;gap:8px;">
        <button class="btn primary" onclick="copyQRUrl('${escapedUrl}')" style="flex:1;">Copiar link</button>
        <button class="btn" onclick="closeQR()">Cerrar</button>
      </div>
    </div>`;
  modal.onclick = e => { if (e.target === modal) closeQR(); };
}

// ── QR Code ──────────────────────────────────────────────────────
function showQR(teamId, teamName) {
  const url = window.location.origin + '/?teamId=' + teamId + '&workspaceId=' + state.currentUser.uid;
  const modal = document.getElementById('qr-modal');
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div style="background:white;border-radius:var(--radius);padding:28px;max-width:380px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.2);" onclick="event.stopPropagation()">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <div style="font-size:16px;font-weight:600;color:var(--ink);">Compartir assessment</div>
        <button onclick="closeQR()" style="background:none;border:none;font-size:20px;line-height:1;cursor:pointer;color:var(--ink-faint);padding:0 2px;">✕</button>
      </div>
      <div style="font-size:13px;color:var(--ink-muted);margin-bottom:20px;">Comparte este QR con el equipo <strong>${teamName}</strong> para que accedan al assessment con el equipo pre-seleccionado.</div>
      <div id="qr-canvas" style="display:flex;justify-content:center;margin-bottom:20px;"></div>
      <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 12px;font-size:11px;color:var(--ink-muted);word-break:break-all;margin-bottom:16px;">${url}</div>
      <div style="display:flex;gap:8px;">
        <button class="btn primary" onclick="copyQRUrl('${url}')" style="flex:1;">Copiar link</button>
        <button class="btn" onclick="closeQR()">Cerrar</button>
      </div>
    </div>`;
  modal.onclick = e => { if (e.target === modal) closeQR(); };
  if (typeof QRCode !== 'undefined') {
    new QRCode(document.getElementById('qr-canvas'), {
      text: url, width: 180, height: 180,
      colorDark: '#0f1117', colorLight: '#ffffff'
    });
  } else {
    document.getElementById('qr-canvas').innerHTML =
      `<div style="font-size:12px;color:var(--ink-faint);text-align:center;padding:16px;">Copia el link de arriba para compartir.</div>`;
  }
}

function closeQR() {
  const modal = document.getElementById('qr-modal');
  modal.style.display = 'none';
  modal.innerHTML = '';
}

function copyQRUrl(url) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => toast('Link copiado'));
  } else {
    const ta = document.createElement('textarea');
    ta.value = url; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    toast('Link copiado');
  }
}

// ── Plan de Acción tab ────────────────────────────────────────────
function renderPlan() {
  if (state.loading) return `<div class="empty-state">Cargando datos…</div>`;

  const STATE = {
    'pendiente': { label:'Pendiente', color:'#a05c0a', bg:'#fdefd6' },
    'en-curso':  { label:'En curso',  color:'#1a4fd6', bg:'#dce6ff' },
    'completado':{ label:'Completado',color:'#0d7a52', bg:'#d4f0e5' }
  };

  const activeTeams = state.teams.filter(t => t.active);
  const availCycles = state.cycles.map(c => c.name);

  const filtered = state.plans
    .filter(p => state.planTeamFilter === 'Todos' || p.equipoNombre === state.planTeamFilter)
    .filter(p => state.planCycleFilter === 'Todos' || p.ciclo === state.planCycleFilter);

  const counts = { pendiente:0, 'en-curso':0, completado:0 };
  filtered.forEach(p => { if (counts[p.estado] !== undefined) counts[p.estado]++; });

  const teamNames = [...new Set(state.plans.map(p => p.equipoNombre).filter(Boolean))].sort();
  const teamPills = teamNames.length > 1 ? `
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
      <span style="font-size:11px;font-weight:600;color:var(--ink-faint);text-transform:uppercase;letter-spacing:0.06em;flex-shrink:0;">Equipo</span>
      ${['Todos', ...teamNames].map(n => `<button class="role-pill ${n===state.planTeamFilter?'active':''}" onclick="setState({planTeamFilter:'${n.replace(/'/g,"\\'")}'})">${n}</button>`).join('')}
    </div>` : '';

  const cyclePills = availCycles.length ? `
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
      <span style="font-size:11px;font-weight:600;color:var(--ink-faint);text-transform:uppercase;letter-spacing:0.06em;flex-shrink:0;">Ciclo</span>
      ${['Todos', ...availCycles].map(c => `<button class="role-pill ${c===state.planCycleFilter?'active':''}" onclick="setState({planCycleFilter:'${c.replace(/'/g,"\\'")}'})">${c}</button>`).join('')}
    </div>` : '';

  const exportBtn = filtered.length ? `
    <div class="no-print" style="margin-bottom:16px;">
      <button class="btn sm" onclick="exportPlanPDF()">↓ Exportar Plan PDF</button>
    </div>` : '';

  const addForm = `
    <div class="section-card" id="plan-form">
      <div class="section-title">Nueva acción de mejora</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
        <div class="field-group" style="margin-bottom:0;">
          <label>Equipo</label>
          <select class="field-input" onchange="setState({newPlanTeamId:this.value})">
            <option value="">— Seleccionar equipo —</option>
            ${activeTeams.map(t => `<option value="${t.id}" ${state.newPlanTeamId===t.id?'selected':''}>${t.name}</option>`).join('')}
          </select>
        </div>
        <div class="field-group" style="margin-bottom:0;">
          <label>Ciclo</label>
          <select class="field-input" onchange="setState({newPlanCiclo:this.value})">
            <option value="">— Ciclo activo —</option>
            ${state.cycles.map(c => `<option value="${c.name}" ${state.newPlanCiclo===c.name?'selected':''}>${c.name}${c.active?' (activo)':''}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="field-group">
        <label>Iniciativa / Acción</label>
        <input class="field-input" type="text" id="inputNewPlanIniciativa" placeholder="Ej. Definir Definition of Done con el equipo"
          value="${state.newPlanIniciativa.replace(/"/g,'&quot;')}" oninput="setState({newPlanIniciativa:this.value})"
          onkeydown="if(event.key==='Enter')addPlan()"/>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px;">
        <div class="field-group" style="margin-bottom:0;">
          <label>Responsable</label>
          <input class="field-input" type="text" id="inputNewPlanResponsable" placeholder="Ej. Scrum Master"
            value="${state.newPlanResponsable.replace(/"/g,'&quot;')}" oninput="setState({newPlanResponsable:this.value})"/>
        </div>
        <div class="field-group" style="margin-bottom:0;">
          <label>Fecha objetivo</label>
          <input class="field-input" type="date" id="inputNewPlanFecha" value="${state.newPlanFecha}" oninput="setState({newPlanFecha:this.value})"/>
        </div>
        <div class="field-group" style="margin-bottom:0;">
          <label>Dimensión <span style="color:var(--ink-faint);font-weight:400">(opcional)</span></label>
          <select class="field-input" onchange="setState({newPlanDimension:this.value})">
            <option value="">— General —</option>
            ${DIMS.map(d => `<option value="${d.key}" ${state.newPlanDimension===d.key?'selected':''}>${d.label}</option>`).join('')}
          </select>
        </div>
      </div>
      <button class="btn primary" onclick="addPlan()" ${(!state.newPlanTeamId||!state.newPlanIniciativa.trim())?'disabled':''}>+ Agregar acción</button>
    </div>`;

  const statsRow = `
    <div class="stats-row" style="grid-template-columns:repeat(3,1fr);margin-bottom:16px;">
      ${Object.entries(STATE).map(([k,v]) => `
        <div class="stat-card">
          <div class="stat-num" style="color:${v.color}">${counts[k]}</div>
          <div class="stat-label">${v.label}</div>
        </div>`).join('')}
    </div>`;

  const list = filtered.length === 0
    ? `<div class="empty-state" style="padding:24px 0;">No hay acciones para los filtros seleccionados.</div>`
    : `<div style="display:flex;flex-direction:column;gap:10px;">
        ${filtered.map(p => {
          const sc = STATE[p.estado] || STATE['pendiente'];
          const otherStates = Object.entries(STATE).filter(([k]) => k !== p.estado);
          return `
            <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:var(--radius-sm);padding:14px 16px;">
              <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
                <div style="flex:1;min-width:0;">
                  <div style="font-size:14px;font-weight:500;color:var(--ink);margin-bottom:6px;">${p.iniciativa}</div>
                  <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
                    ${p.equipoNombre ? `<span style="font-size:11px;font-weight:500;color:var(--ink-muted);">${p.equipoNombre}</span>` : ''}
                    ${p.responsable ? `<span style="font-size:11px;color:var(--ink-faint);">· ${p.responsable}</span>` : ''}
                    ${p.ciclo ? `<span style="font-size:11px;color:var(--ink-faint);background:var(--surface-2);border:1px solid var(--border);padding:1px 7px;border-radius:99px;">${p.ciclo}</span>` : ''}
                    ${p.fechaObjetivo ? `<span style="font-size:11px;color:var(--ink-faint);">Fecha: ${p.fechaObjetivo}</span>` : ''}
                    ${(()=>{ const dim = p.dimension ? DIMS.find(d=>d.key===p.dimension) : null; return dim ? `<span class="plan-dim-badge" style="border-color:${dim.color};color:${dim.color};">${dim.label}</span>` : ''; })()}
                  </div>
                </div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0;">
                  <span style="font-size:11px;font-weight:600;padding:3px 10px;border-radius:99px;background:${sc.bg};color:${sc.color};">${sc.label}</span>
                  <div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end;">
                    ${otherStates.map(([k,v]) => `<button class="btn sm" onclick="updatePlanStatus('${p.id}','${k}')" style="padding:3px 8px;font-size:11px;">${v.label}</button>`).join('')}
                    <button class="btn sm danger" onclick="deletePlan('${p.id}')" style="padding:3px 8px;font-size:11px;">✕</button>
                  </div>
                </div>
              </div>
            </div>`;
        }).join('')}
      </div>`;

  return addForm + exportBtn + `
    <div class="section-card">
      <div class="section-title">Acciones en seguimiento</div>
      <div class="no-print">${teamPills}${cyclePills}</div>
      ${statsRow}
      ${list}
    </div>`;
}

// ── Usuarios tab ─────────────────────────────────────────────────
function renderUsuarios() {
  if (state.currentRole !== 'super_admin') return `<div class="empty-state">Acceso no autorizado.</div>`;

  const addForm = `
    <div class="section-card">
      <div class="section-title">Nuevo workspace admin</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
        <div class="field-group" style="margin-bottom:0;">
          <label>Nombre</label>
          <input class="field-input" type="text" id="inputNewUserNombre" placeholder="Nombre del cliente"
            value="${state.newUserNombre.replace(/"/g,'&quot;')}" oninput="setState({newUserNombre:this.value})"/>
        </div>
        <div class="field-group" style="margin-bottom:0;">
          <label>Email</label>
          <input class="field-input" type="text" id="inputNewUserEmail" placeholder="cliente@empresa.com"
            value="${state.newUserEmail.replace(/"/g,'&quot;')}" oninput="setState({newUserEmail:this.value})"
            onkeydown="if(event.key==='Enter')createUser()"/>
        </div>
      </div>
      <p style="font-size:12px;color:var(--ink-faint);margin-bottom:12px;">Se creará la cuenta y se enviará automáticamente un correo con un link para que el cliente defina su contraseña.</p>
      <button class="btn primary" onclick="createUser()" ${(!state.newUserNombre.trim()||!state.newUserEmail.trim())?'disabled':''}>Crear usuario y enviar invitación</button>
    </div>`;

  const list = state.users.length === 0
    ? `<div class="empty-state" style="padding:24px 0;">Aún no has creado ningún workspace admin.</div>`
    : `<div style="display:flex;flex-direction:column;gap:10px;">
        ${state.users.map(u => {
          const esc = (u.nombre || '').replace(/'/g, "\\'");
          const escEmail = (u.email || '').replace(/'/g, "\\'");
          return `
            <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:var(--radius-sm);padding:14px 16px;">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
                <div>
                  <div style="font-size:14px;font-weight:500;color:var(--ink);">${u.nombre || '—'}</div>
                  <div style="font-size:12px;color:var(--ink-faint);">${u.email || ''}</div>
                  ${u.creadoEn ? `<div style="font-size:11px;color:var(--ink-faint);margin-top:2px;">Creado: ${u.creadoEn.toDate ? u.creadoEn.toDate().toLocaleDateString('es') : ''}</div>` : ''}
                </div>
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                  <span style="font-size:11px;font-weight:600;padding:3px 10px;border-radius:99px;background:${u.activo?'var(--green-light)':'var(--red-light)'};color:${u.activo?'var(--green)':'var(--red)'};">
                    ${u.activo ? 'Activo' : 'Suspendido'}
                  </span>
                  ${u.activo
                    ? `<button class="btn sm" onclick="suspendUser('${u.id}','${esc}')">Suspender</button>`
                    : `<button class="btn sm" onclick="reactivateUser('${u.id}','${esc}')">Reactivar</button>`}
                  <button class="btn sm" onclick="resendInvite('${escEmail}','${esc}')">Reenviar invitación</button>
                  <button class="btn sm danger" onclick="deleteUser('${u.id}','${esc}')">Eliminar</button>
                </div>
              </div>
            </div>`;
        }).join('')}
      </div>`;

  return addForm + `
    <div class="section-card">
      <div class="section-title">Workspace admins (${state.users.length})</div>
      ${list}
    </div>`;
}
