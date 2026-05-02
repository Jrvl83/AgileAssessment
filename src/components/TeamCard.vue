<template>
  <div class="tac">
    <!-- Encabezado -->
    <div class="tac-header">
      <div>
        <div class="tac-name">{{ teamStat.name }}</div>
        <div class="tac-meta">
          {{ ds.count }} respuesta{{ ds.count !== 1 ? 's' : '' }}{{ selectedRole !== 'Todos' ? ' · ' + selectedRole : '' }}
          <span v-if="ds.dispersion?.overall"
            :style="`font-size:10px;font-weight:600;padding:1px 7px;border-radius:99px;margin-left:6px;background:${ds.dispersion.overall.align.bg};color:${ds.dispersion.overall.align.color};`">
            Alineación {{ ds.dispersion.overall.align.label }}
          </span>
          <!-- countBadge -->
          <template v-if="countBadge">
            <span v-if="countBadge.prevCount !== null && countBadge.activeCount < countBadge.prevCount"
              :style="`font-size:10px;background:#fce8e8;color:#c0282a;padding:1px 7px;border-radius:99px;margin-left:6px;`"
              :title="`${countBadge.activeName}: ${countBadge.activeCount} resp. · ${countBadge.prevName}: ${countBadge.prevCount} resp.`">
              ↓ ciclo activo: {{ countBadge.activeCount }} resp.
            </span>
            <span v-else-if="countBadge.activeCount > 0"
              style="font-size:10px;background:#eef2ff;color:#1a4fd6;padding:1px 7px;border-radius:99px;margin-left:6px;">
              {{ countBadge.activeName }}: {{ countBadge.activeCount }} resp.
            </span>
            <span v-else
              style="font-size:10px;background:#f3f4f6;color:var(--ink-faint);padding:1px 7px;border-radius:99px;margin-left:6px;">
              {{ countBadge.activeName }}: sin respuestas
            </span>
          </template>
          <!-- healthBadge -->
          <span v-if="healthBadge"
            :style="`background:${healthBadge.bg};color:${healthBadge.color};font-size:10px;font-weight:700;padding:1px 7px;border-radius:99px;margin-left:6px;`"
            :title="`Seguridad psicológica · ${healthBadge.count} resp.`">
            Salud {{ healthBadge.label }} · {{ healthBadge.avg }}%
          </span>
        </div>
        <div v-if="ctxParts.length" style="font-size:11px;color:var(--ink-faint);margin-top:2px;">{{ ctxParts.join(' · ') }}</div>
        <div v-if="teamCat" style="margin-top:3px;">
          <span style="background:#f3f4f6;color:#374151;font-size:10px;font-weight:600;padding:1px 7px;border-radius:99px;">{{ teamCat }}</span>
        </div>
      </div>
      <div class="tac-score">
        <div class="tac-score-num" :style="`color:${ds.level.color}`">{{ ds.avgTotal }}%</div>
        <span class="tac-level" :style="`background:${ds.level.bg};color:${ds.level.color}`">{{ ds.level.label }}</span>
        <!-- Benchmark delta -->
        <div v-if="radarBenchmark && benchmarkPool.length >= 2" style="font-size:10px;margin-top:2px;text-align:right;font-weight:600;"
          :style="`color:${ds.avgTotal - catOrgAvg > 0 ? '#0d7a52' : ds.avgTotal - catOrgAvg < 0 ? '#c0282a' : '#6b7280'};`"
          :title="`vs. promedio ${hasCatBenchmark ? teamCat.toLowerCase() : 'org'} (${catOrgAvg}%)`">
          {{ ds.avgTotal - catOrgAvg > 0 ? '+' : '' }}{{ ds.avgTotal - catOrgAvg }}% {{ hasCatBenchmark ? teamCat.toLowerCase() : 'org' }}
        </div>
        <!-- Momentum -->
        <div v-if="momentum" style="font-size:10px;margin-top:3px;text-align:right;font-weight:600;"
          :style="`color:${momentum.direction === 'up' ? '#0d7a52' : momentum.direction === 'down' ? '#c0282a' : '#6b7280'}`"
          :title="`Momentum: delta promedio en los últimos ${momentum.cycles} ciclos`">
          {{ momentum.direction === 'up' ? '↗ +' : momentum.direction === 'down' ? '↘ ' : '→ ' }}{{ momentum.direction !== 'stable' ? momentum.avg + ' pts/ciclo' : 'Estable' }}
        </div>
      </div>
    </div>

    <!-- Role pills -->
    <div class="role-filter no-print">
      <button v-for="r in ['Todos', ...teamAvailRoles]" :key="r"
        class="role-pill" :class="{ active: r === selectedRole }"
        :title="r !== 'Todos' && (filteredRoleCounts[r] || 0) < MIN_ROLE_RESPONSES ? 'Menos de ' + MIN_ROLE_RESPONSES + ' respuestas — anonimato limitado' : ''"
        @click="setTeamRole(tid, r)">
        {{ r }} ({{ roleCounts[r] || 0 }}){{ r !== 'Todos' && (filteredRoleCounts[r] || 0) < MIN_ROLE_RESPONSES ? ' ⚠' : '' }}
      </button>
    </div>

    <!-- Aviso anonimato -->
    <div v-if="anonWarning" class="no-print"
      style="background:#fef3c7;border:1.5px solid #f59e0b;border-radius:var(--radius-sm);padding:8px 12px;margin-bottom:10px;font-size:12px;color:#92400e;">
      ⚠ Solo {{ filteredRoleCounts[selectedRole] || 0 }} respuesta{{ (filteredRoleCounts[selectedRole] || 0) !== 1 ? 's' : '' }} de
      <strong>{{ selectedRole }}</strong> en este ciclo. Con menos de {{ MIN_ROLE_RESPONSES }} respuestas, el desglose por rol puede comprometer el anonimato.
    </div>

    <!-- Brechas de percepción -->
    <div v-if="gaps.length" class="collapse-section no-print">
      <button class="collapse-toggle" @click="toggleTeamGaps(tid)"
        style="background:#fff8ed;border-color:#f59e0b;">
        <span class="collapse-toggle-label" style="color:#92400e;">
          ⚡ Brechas de percepción detectadas
          <span class="collapse-count" style="background:#f59e0b;color:#fff;">{{ gaps.length }}</span>
        </span>
        <span class="collapse-chevron" style="color:#92400e;">{{ state.teamGapsExpanded[tid] ? '▲' : '▼' }}</span>
      </button>
      <div v-if="state.teamGapsExpanded[tid]" class="collapse-body" style="padding-top:4px;">
        <div v-for="g in gaps" :key="g.dimKey"
          style="display:flex;align-items:baseline;gap:8px;padding:6px 0;"
          :style="`border-bottom:1px solid ${g.dimColor}15;`">
          <span :style="`display:inline-block;width:8px;height:8px;border-radius:50%;background:${g.dimColor};flex-shrink:0;margin-top:3px;`"></span>
          <div style="flex:1;font-size:12px;color:var(--ink);">
            <strong>{{ g.dimLabel }}:</strong>
            {{ g.roleHigh }} <span :style="`font-weight:700;color:${g.dimColor};`">{{ g.pctHigh }}%</span>
            · {{ g.roleLow }} <span :style="`font-weight:700;color:${g.dimColor};`">{{ g.pctLow }}%</span>
          </div>
          <span :style="`background:${g.diff >= 40 ? '#fce8e8' : '#fdefd6'};color:${g.diff >= 40 ? '#c0282a' : '#a05c0a'};font-size:10px;font-weight:700;padding:2px 7px;border-radius:99px;white-space:nowrap;flex-shrink:0;`">
            {{ g.diff }} pts
          </span>
        </div>
      </div>
    </div>

    <!-- Botones de acción -->
    <div class="no-print" style="display:flex;justify-content:flex-end;gap:8px;margin-bottom:4px;">
      <button class="btn sm secondary" @click="showDebriefGuide(tid, state.cycleFilter || 'Todos')">Guía de facilitación</button>
      <button class="btn sm secondary" @click="exportPPT(tid)">↓ PPT</button>
      <button class="btn sm" @click="generateReport(tid, state.cycleFilter || 'Todos')">↗ Compartir reporte</button>
    </div>

    <!-- Panel de participación (v-html — display only) -->
    <div v-html="participationHtml"></div>

    <!-- Radar canvas -->
    <canvas ref="radarCanvas" class="radar-canvas no-print"></canvas>

    <!-- Dimensiones -->
    <div v-for="d in DIMS" :key="d.key" class="dim-row">
      <div class="dim-row-header">
        <span class="dim-label">
          {{ d.label }}
          <span v-if="gapMap.get(d.key)"
            :style="`font-size:9px;font-weight:700;padding:1px 5px;border-radius:99px;background:${gapMap.get(d.key).diff >= 40 ? '#fce8e8' : '#fdefd6'};color:${gapMap.get(d.key).diff >= 40 ? '#c0282a' : '#a05c0a'};margin-left:4px;white-space:nowrap;`"
            :title="`${gapMap.get(d.key).roleHigh}: ${gapMap.get(d.key).pctHigh}% · ${gapMap.get(d.key).roleLow}: ${gapMap.get(d.key).pctLow}%`">
            ⚡ {{ gapMap.get(d.key).diff }}pts
          </span>
        </span>
        <span style="display:flex;align-items:center;gap:4px;">
          <span class="dim-pct-label">{{ ds.avgDims[d.key].pct }}%</span>
          <span v-if="globalAvgs" :class="['dim-vs-avg', ds.avgDims[d.key].pct - globalAvgs[d.key] >= 0 ? 'dim-vs-avg-pos' : 'dim-vs-avg-neg']">
            {{ ds.avgDims[d.key].pct - globalAvgs[d.key] >= 0 ? '+' : '' }}{{ ds.avgDims[d.key].pct - globalAvgs[d.key] }}% vs. media
          </span>
        </span>
      </div>
      <div class="dim-bar-wrap">
        <div class="dim-bar" :style="`width:${ds.avgDims[d.key].pct}%;background:${d.color}`"></div>
      </div>
      <div v-if="ds.dispersion?.[d.key]" style="display:flex;justify-content:space-between;margin-top:2px;">
        <span style="font-size:10px;color:var(--ink-faint);">Rango: {{ ds.dispersion[d.key].min }}%–{{ ds.dispersion[d.key].max }}%</span>
        <span :style="`font-size:10px;color:${ds.dispersion[d.key].align.color};`">±{{ ds.dispersion[d.key].sd }}%</span>
      </div>
    </div>

    <!-- Análisis con IA -->
    <div v-if="state.aiEnabled" class="collapse-section no-print">
      <button class="collapse-toggle" @click="toggleTeamAI(tid)" style="color:#1a4fd6;">
        <span class="collapse-toggle-label" style="color:#1a4fd6;">
          Análisis con IA
          <span v-if="aiEntry?.loading" class="collapse-count" style="background:#1a4fd6;color:#fff;">…</span>
          <span v-else-if="aiEntry?.data" class="collapse-count" style="background:#d4f0e5;color:#0d7a52;">✓</span>
          <span v-else-if="aiEntry?.error" class="collapse-count" style="background:#fce8e8;color:#c0282a;">!</span>
        </span>
        <span class="collapse-chevron">{{ state.teamAIExpanded[tid] ? '▲' : '▼' }}</span>
      </button>

      <div v-if="state.teamAIExpanded[tid]" class="collapse-body">
        <div style="border:1.5px solid #dce6ff;border-radius:var(--radius-sm);overflow:hidden;">
          <!-- Cabecera de la sección IA -->
          <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#f0f5ff;">
            <span style="font-size:12px;font-weight:700;color:#1a4fd6;">Analizar con IA</span>
            <button
              :disabled="!canAnalyze || !!aiEntry?.loading"
              :title="!canAnalyze ? 'Se necesitan al menos 3 respuestas' : ''"
              :style="`font-size:11px;padding:4px 14px;border-radius:99px;cursor:${!canAnalyze || aiEntry?.loading ? 'not-allowed' : 'pointer'};border:1.5px solid ${!canAnalyze || aiEntry?.loading ? '#e5e7eb' : '#1a4fd6'};color:${!canAnalyze || aiEntry?.loading ? '#9ca3af' : '#fff'};background:${!canAnalyze || aiEntry?.loading ? 'transparent' : '#1a4fd6'};`"
              @click="canAnalyze && !aiEntry?.loading && callAnalyzeTeamWithClaude(tid)">
              {{ aiEntry?.loading ? 'Analizando…' : aiEntry?.error ? 'Reintentar' : aiEntry?.data && aiEntry.newResponsesCount > 0 ? `Actualizar (${aiEntry.newResponsesCount} nueva${aiEntry.newResponsesCount !== 1 ? 's' : ''})` : aiEntry?.data ? 'Regenerar' : 'Analizar con IA' }}
            </button>
          </div>

          <!-- Contexto del coach -->
          <div style="padding:10px 14px;border-top:1px solid #dce6ff;background:#f8fbff;">
            <label style="font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--ink-faint);display:block;margin-bottom:5px;">
              Contexto para el análisis <span style="font-weight:400;text-transform:none;letter-spacing:0">(opcional)</span>
            </label>
            <textarea rows="2"
              placeholder="Ej: El equipo cambió de Scrum Master hace 3 semanas. Están bajo presión de un deadline externo en mayo."
              :value="aiCtxVal"
              @input="updateAiCtx(aiKey, $event.target.value)"
              style="width:100%;border:1.5px solid #dce6ff;border-radius:6px;padding:7px 10px;font-size:12px;font-family:inherit;color:var(--ink);background:white;resize:vertical;outline:none;min-height:52px;"></textarea>

            <!-- Adjuntar docx -->
            <div style="margin-top:10px;padding-top:10px;border-top:1px dashed #dce6ff;">
              <label style="font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--ink-faint);display:block;margin-bottom:4px;">
                Documento adicional <span style="font-weight:400;text-transform:none;letter-spacing:0">(opcional, solo .docx)</span>
              </label>
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                <label style="display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:6px;border:1.5px solid #dce6ff;background:white;font-size:12px;color:var(--ink-muted);cursor:pointer;font-family:inherit;">
                  📎 Adjuntar .docx
                  <input :id="'docx-input-' + safeAiKey" type="file" accept=".docx"
                    style="display:none" @change="handleDocxUpload(aiKey, $event.target)" />
                </label>
                <button v-if="aiDocCtx" @click="removeDocxUpload(aiKey)"
                  style="font-size:11px;padding:4px 10px;border-radius:6px;border:1.5px solid #fce8e8;background:#fce8e8;color:#c0282a;cursor:pointer;font-family:inherit;">
                  ✕ Quitar
                </button>
              </div>
              <p style="font-size:11px;color:var(--ink-faint);margin:5px 0 0;line-height:1.5;">
                Máx. ~5 páginas / 2.500 palabras. El archivo no se almacena — su contenido se incluye solo en el prompt de análisis.
              </p>
              <div :id="'docx-status-' + safeAiKey" style="font-size:12px;margin-top:4px;min-height:16px;">
                <span v-if="aiDocCtx" style="color:#0d7a52;">
                  ✓ {{ aiDocCtx.name }} · {{ aiDocCtx.chars.toLocaleString() }} caracteres
                  <span v-if="aiDocCtx.truncated" style="color:#a05c0a;">(truncado al límite)</span>
                </span>
              </div>
            </div>

            <!-- Imágenes -->
            <div style="margin-top:10px;padding-top:10px;border-top:1px dashed #dce6ff;">
              <label style="font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--ink-faint);display:block;margin-bottom:4px;">
                Imágenes (gráficos) <span style="font-weight:400;text-transform:none;letter-spacing:0">(opcional · máx. {{ IMG_MAX_COUNT }} · PNG/JPG)</span>
              </label>
              <div v-if="aiImages.length" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;">
                <div v-for="(img, i) in aiImages" :key="i"
                  style="display:inline-flex;align-items:center;gap:4px;padding:3px 6px 3px 8px;background:#f0f4ff;border:1px solid #dce6ff;border-radius:6px;font-size:11px;color:var(--ink-muted);">
                  🖼 {{ img.name }}
                  <button @click="removeImage(aiKey, i)"
                    style="background:none;border:none;cursor:pointer;color:#c0282a;font-size:13px;line-height:1;padding:0 2px;font-family:inherit;">✕</button>
                </div>
              </div>
              <label v-if="aiImages.length < IMG_MAX_COUNT"
                style="display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:6px;border:1.5px solid #dce6ff;background:white;font-size:12px;color:var(--ink-muted);cursor:pointer;font-family:inherit;">
                🖼 Añadir imagen
                <input :id="'img-input-' + safeAiKey" type="file" accept=".png,.jpg,.jpeg" multiple
                  style="display:none" @change="handleImageUpload(aiKey, $event.target)" />
              </label>
              <p style="font-size:11px;color:var(--ink-faint);margin:5px 0 0;line-height:1.5;">
                Sube capturas de gráficos o tablas del equipo. Claude las analizará con visión. Máx. 2 MB c/u. No se almacenan.
              </p>
              <div :id="'img-status-' + safeAiKey" style="font-size:12px;margin-top:4px;min-height:16px;"></div>
            </div>
          </div>

          <!-- Resultados del análisis IA -->
          <div v-if="aiEntry && (aiEntry.loading || aiEntry.data || aiEntry.error)"
            style="padding:12px 14px;border-top:1px solid #dce6ff;">
            <!-- Loading -->
            <div v-if="aiEntry.loading" style="padding:16px;text-align:center;font-size:13px;color:var(--ink-faint);">
              Analizando con IA… puede tardar unos segundos.
            </div>
            <!-- Error -->
            <div v-else-if="aiEntry.error"
              style="padding:12px 16px;background:#fce8e8;border-radius:var(--radius-sm);font-size:12px;color:#c0282a;">
              Error: {{ aiEntry.error }}
            </div>
            <!-- Data -->
            <template v-else-if="aiEntry.data">
              <!-- Meta header -->
              <div style="font-size:11px;color:var(--ink-faint);margin-bottom:10px;display:flex;align-items:center;flex-wrap:wrap;gap:6px;">
                <span>{{ aiEntry.data.generadoEn ? 'Análisis generado ' + new Date(aiEntry.data.generadoEn).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' }) : '' }}</span>
                <span v-if="aiEntry.fromCache" style="font-size:10px;background:#e0e7ff;color:#1a4fd6;padding:1px 7px;border-radius:99px;">Caché</span>
                <span v-else style="font-size:10px;background:#d4f0e5;color:#0d7a52;padding:1px 7px;border-radius:99px;">Nuevo</span>
                <span v-if="aiEntry.newResponsesCount > 0" style="font-size:10px;background:#fdefd6;color:#a05c0a;padding:1px 7px;border-radius:99px;">
                  {{ aiEntry.newResponsesCount }} resp. nueva{{ aiEntry.newResponsesCount !== 1 ? 's' : '' }} — actualiza el análisis
                </span>
                <button @click="exportAnalisisPDF(tid)"
                  style="margin-left:auto;font-size:11px;padding:3px 10px;border-radius:6px;border:1.5px solid #dce6ff;background:white;color:#1a4fd6;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:4px;">
                  ↓ Descargar informe
                </button>
              </div>
              <!-- Alertas -->
              <div v-if="aiEntry.data.alertas?.length"
                style="margin-bottom:14px;background:#fce8e8;border-left:3px solid #c0282a;border-radius:0 6px 6px 0;padding:10px 14px;">
                <div style="font-size:10px;font-weight:700;color:#c0282a;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">Alertas</div>
                <div v-for="(a, i) in aiEntry.data.alertas" :key="i"
                  style="font-size:12px;color:#7f1d1d;margin-bottom:4px;">⚠ {{ a }}</div>
              </div>
              <!-- Narrativa -->
              <div v-if="aiEntry.data.narrativa"
                style="font-size:13px;color:var(--ink);line-height:1.65;margin-bottom:4px;white-space:pre-wrap;">{{ aiEntry.data.narrativa }}</div>
              <!-- Dimensiones prioritarias -->
              <div v-if="aiEntry.data.focusSesion?.length" style="margin-top:14px;">
                <div style="font-size:10px;font-weight:700;color:var(--ink-faint);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;">Dimensiones prioritarias</div>
                <div v-for="(f, i) in aiEntry.data.focusSesion.slice(0, 3)" :key="i"
                  style="display:flex;gap:10px;align-items:flex-start;margin-bottom:8px;">
                  <span :style="`flex-shrink:0;width:20px;height:20px;border-radius:50%;background:${dimColorFor(f.dimension)};color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;`">{{ i + 1 }}</span>
                  <div>
                    <span :style="`font-size:12px;font-weight:600;color:${dimColorFor(f.dimension)};`">{{ dimLabelFor(f.dimension) }}</span>
                    <span style="font-size:12px;color:var(--ink);"> — {{ f.razon }}</span>
                  </div>
                </div>
              </div>
              <!-- Síntesis de comentarios -->
              <div v-if="Object.keys(aiEntry.data.sintesisComentarios || {}).length" style="margin-top:14px;">
                <div style="font-size:10px;font-weight:700;color:var(--ink-faint);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;">Síntesis de comentarios</div>
                <div v-for="[secId, text] in Object.entries(aiEntry.data.sintesisComentarios)" :key="secId" style="margin-bottom:8px;">
                  <span :style="`font-size:10px;font-weight:700;color:${dimColorFor(secId)};`">{{ dimLabelFor(secId) }}:</span>
                  <span style="font-size:12px;color:var(--ink);"> {{ text }}</span>
                </div>
              </div>
              <!-- Agenda -->
              <div v-if="aiEntry.data.agendaSesion"
                style="margin-top:14px;padding:12px 14px;background:#f8faff;border:1px solid #dce6ff;border-radius:var(--radius-sm);">
                <div style="font-size:10px;font-weight:700;color:#1a4fd6;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">Agenda de debrief (borrador 90 min)</div>
                <div style="font-size:12px;color:var(--ink);line-height:1.6;white-space:pre-wrap;">{{ aiEntry.data.agendaSesion }}</div>
              </div>
              <!-- Resumen ejecutivo -->
              <div v-if="aiEntry.data.resumenEjecutivo"
                style="margin-top:14px;padding:12px 14px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:var(--radius-sm);">
                <div style="font-size:10px;font-weight:700;color:#0d7a52;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">Resumen ejecutivo</div>
                <div style="font-size:12px;color:var(--ink);line-height:1.6;white-space:pre-wrap;">{{ aiEntry.data.resumenEjecutivo }}</div>
                <button @click="copyText(aiEntry.data.resumenEjecutivo)"
                  style="margin-top:8px;font-size:11px;padding:3px 10px;border:1px solid #0d7a52;color:#0d7a52;background:transparent;border-radius:99px;cursor:pointer;">
                  Copiar
                </button>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Recomendaciones -->
    <div class="collapse-section">
      <button class="collapse-toggle" @click="toggleTeamRecs(tid)">
        <span class="collapse-toggle-label">
          Recomendaciones{{ selectedRole !== 'Todos' ? ' para ' + selectedRole : '' }}
          <span v-if="majorityRole && selectedRole === 'Todos'" class="rec-role-note">(rol mayoritario: {{ majorityRole }})</span>
          <span v-if="recItems.length" class="collapse-count">{{ recItems.length }}</span>
        </span>
        <span class="collapse-chevron">{{ state.teamRecsExpanded[tid] ? '▲' : '▼' }}</span>
      </button>
      <div v-if="state.teamRecsExpanded[tid]" class="collapse-body">
        <div v-for="p in patterns" :key="p.label"
          :style="`background:${p.color}18;border-color:${p.color};`" class="pattern-block">
          <div class="pattern-label" :style="`color:${p.color};`">Patrón detectado · {{ p.label }}</div>
          <div class="pattern-text" :style="`color:${p.color}cc;`">{{ p.text }}</div>
        </div>
        <template v-if="recItems.length">
          <div v-for="item in recItems" :key="item.recKey" class="rec-item" style="align-items:flex-start;">
            <div class="rec-dot" :style="`background:${item.color};margin-top:5px;`"></div>
            <div class="rec-text" style="flex:1;">
              <span v-if="item.isCrit" class="badge-critical no-print">Crítica</span>
              <strong>{{ item.label }}:</strong> {{ item.text }}
              <div v-if="item.ctxNote" class="rec-context">⚑ {{ item.ctxNote }}</div>
            </div>
            <button class="btn-plan no-print" @click="prefillPlan(tid, item.recKey, state.cycleFilter, item.key)">+ Plan</button>
          </div>
        </template>
        <div v-else class="rec-item">
          <div class="rec-dot" style="background:#0d7a52"></div>
          <div class="rec-text">Buen nivel en todas las dimensiones. Explorar métricas de flujo avanzadas (cycle time, throughput).</div>
        </div>
      </div>
    </div>

    <!-- Detalle por pregunta -->
    <div class="collapse-section">
      <button class="collapse-toggle" @click="toggleTeamDetail(tid)">
        <span class="collapse-toggle-label">
          Detalle por pregunta
          <span v-if="commentCount > 0" class="collapse-count">{{ commentCount }} comentario{{ commentCount !== 1 ? 's' : '' }}</span>
        </span>
        <span class="collapse-chevron">{{ state.teamDetailExpanded[tid] ? '▲' : '▼' }}</span>
      </button>
      <div v-if="state.teamDetailExpanded[tid]" class="collapse-body" v-html="questionDetailHtml"></div>
    </div>

    <!-- Comentarios -->
    <div v-if="commentCount > 0" class="collapse-section">
      <button class="collapse-toggle" @click="toggleTeamComments(tid)">
        <span class="collapse-toggle-label">
          Comentarios del equipo
          <span class="collapse-count">{{ commentCount }}</span>
        </span>
        <span class="collapse-chevron">{{ state.teamCommentsExpanded[tid] ? '▲' : '▼' }}</span>
      </button>
      <div v-if="state.teamCommentsExpanded[tid]" class="collapse-body" v-html="commentsHtml"></div>
    </div>

    <!-- Notas del coach -->
    <div class="no-print" style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);">
      <div style="font-size:10px;font-weight:700;color:var(--ink-faint);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">
        Notas del coach · {{ noteCicloLabel }}
      </div>
      <textarea :id="'coach-note-' + tid"
        placeholder="Contexto de sesión, observaciones, situación del equipo…"
        :value="coachNote"
        @input="saveCoachNote(tid, state.cycleFilter, $event.target.value)"
        style="width:100%;box-sizing:border-box;min-height:72px;font-size:12px;font-family:inherit;color:var(--ink);border:1.5px solid var(--border);border-radius:var(--radius-sm);padding:8px 10px;resize:vertical;background:#f9fafb;line-height:1.5;"></textarea>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onUnmounted } from 'vue';
import Chart from 'chart.js/auto';
import { state } from '../../assets/admin-state.js';
import { MIN_ROLE_RESPONSES } from '../../assets/admin-state.js';
import {
  getTeamFilteredStats, getMajorityRole, detectRoleGaps, calcMomentum,
  generateReport, saveCoachNote,
} from '../../assets/admin-api.js';
import {
  setTeamRole, toggleTeamRecs, toggleTeamAI, toggleTeamDetail, toggleTeamComments,
  toggleTeamGaps, prefillPlan, showDebriefGuide,
  callAnalyzeTeamWithClaude, handleDocxUpload, handleImageUpload, removeDocxUpload, removeImage,
  updateAiCtx, renderParticipationPanel, renderCommentsPanel, renderQuestionDetail,
} from '../../assets/admin-render.js';
import { exportPPT, exportAnalisisPDF } from '../../assets/admin-export.js';
import { toast } from '../../assets/admin-toast.js';
import { DIMS, SECTIONS, detectPatterns, getContextNote, getRec } from '../../assessment-config.js';

const IMG_MAX_COUNT = 3;

const props = defineProps({
  tid:       { type: String, required: true },
  teamStat:  { type: Object, required: true },
  compData:  { type: Array,  required: true },
  orgAvg:    { type: Number, required: true },
  globalAvgs:{ type: Object, default: null },
});

const radarCanvas = ref(null);
let radarChart = null;

// ── Computed ──────────────────────────────────────────────────────
const team           = computed(() => state.teams.find((t) => t.id === props.tid) || null);
const selectedRole   = computed(() => state.teamRoleFilter[props.tid] || 'Todos');
const teamResps      = computed(() => state.responses.filter((r) => (r.fields.Equipo || []).includes(props.tid)));
const teamAvailRoles = computed(() => [...new Set(teamResps.value.map((r) => r.fields.Rol).filter(Boolean))].sort());

const filteredByCycle = computed(() =>
  teamResps.value.filter((r) => state.cycleFilter === 'Todos' || r.fields.Ciclo === state.cycleFilter)
);
const filteredRoleCounts = computed(() => {
  const c = {};
  filteredByCycle.value.forEach((r) => { if (r.fields.Rol) c[r.fields.Rol] = (c[r.fields.Rol] || 0) + 1; });
  return c;
});
const roleCounts = computed(() => {
  const c = { Todos: state.excludeOtro ? filteredByCycle.value.filter((r) => r.fields.Rol !== 'Otro').length : filteredByCycle.value.length };
  teamAvailRoles.value.forEach((r) => { c[r] = filteredRoleCounts.value[r] || 0; });
  return c;
});
const anonWarning = computed(() =>
  selectedRole.value !== 'Todos' && (filteredRoleCounts.value[selectedRole.value] || 0) < MIN_ROLE_RESPONSES
);
const exOtroTeam = computed(() => state.excludeOtro && selectedRole.value === 'Todos');
const ds = computed(() =>
  getTeamFilteredStats(props.tid, selectedRole.value, state.cycleFilter, exOtroTeam.value) || props.teamStat
);
const majorityRole = computed(() => selectedRole.value === 'Todos' ? getMajorityRole(filteredByCycle.value) : null);
const roleForRec   = computed(() => selectedRole.value !== 'Todos' ? selectedRole.value : majorityRole.value);
const gaps         = computed(() => detectRoleGaps(props.tid, state.cycleFilter));
const gapMap       = computed(() => new Map(gaps.value.map((g) => [g.dimKey, g])));
const momentum     = computed(() => calcMomentum(props.tid, selectedRole.value));

const teamCat = computed(() => team.value?.category || '');
const catCompData = computed(() =>
  teamCat.value
    ? props.compData.filter((s) => (state.teams.find((t) => t.id === s.id)?.category || '') === teamCat.value)
    : []
);
const hasCatBenchmark = computed(() => !!teamCat.value && catCompData.value.length >= 2);
const benchmarkPool   = computed(() => hasCatBenchmark.value ? catCompData.value : props.compData);
const catOrgAvg       = computed(() =>
  hasCatBenchmark.value
    ? Math.round(catCompData.value.reduce((a, s) => a + s.avgTotal, 0) / catCompData.value.length)
    : props.orgAvg
);
const radarBenchmark = computed(() =>
  benchmarkPool.value.length >= 2
    ? DIMS.map((d) => Math.round(benchmarkPool.value.reduce((sum, s) => sum + s.avgDims[d.key].pct, 0) / benchmarkPool.value.length))
    : null
);

const ctxParts = computed(() => {
  const c = ds.value.ctx;
  if (!c) return [];
  return [
    c.teamSize   ? c.teamSize + ' personas' : null,
    c.teamAge    ? c.teamAge + ' con Scrum'  : null,
    c.dedicatedPO ? 'PO ' + (c.dedicatedPO === 'Sí' ? 'dedicado' : c.dedicatedPO === 'No' ? 'no dedicado' : 'compartido') : null,
    c.workMode   || null,
  ].filter(Boolean);
});

const below80 = computed(() =>
  DIMS.filter((d) => ds.value.avgDims[d.key].pct < 80)
    .sort((a, b) => ds.value.avgDims[a.key].pct - ds.value.avgDims[b.key].pct)
);
const lowDims = computed(() =>
  below80.value.length > 0
    ? below80.value
    : DIMS.slice().sort((a, b) => ds.value.avgDims[a.key].pct - ds.value.avgDims[b.key].pct).slice(0, 4)
);
const sortedByPct  = computed(() => DIMS.slice().sort((a, b) => ds.value.avgDims[a.key].pct - ds.value.avgDims[b.key].pct));
const criticalDim  = computed(() => sortedByPct.value[0] && ds.value.avgDims[sortedByPct.value[0].key].pct < 33 ? sortedByPct.value[0] : null);
const patterns     = computed(() => detectPatterns(ds.value.avgDims));

const recItems = computed(() =>
  lowDims.value.map((d) => {
    const recKey  = props.tid + '_' + d.key;
    const text    = getRec(d.key, ds.value.avgDims[d.key].pct, roleForRec.value);
    const ctxNote = getContextNote(d.key, ds.value.avgDims[d.key].pct, ds.value.ctx?.teamSize, ds.value.ctx?.teamAge);
    state.recTexts[recKey] = `${d.label}: ${text}`;
    return { ...d, recKey, text, ctxNote, isCrit: criticalDim.value?.key === d.key };
  })
);

const healthBadge = computed(() => {
  const hr = filteredByCycle.value.filter((r) => r.fields.HealthScore != null);
  if (!hr.length) return null;
  const avg = Math.round(hr.reduce((a, r) => a + r.fields.HealthScore, 0) / hr.length);
  const hl  = avg >= 70 ? { label: 'Alta',  color: '#0d7a52', bg: '#d4f0e5' }
            : avg >= 40 ? { label: 'Media', color: '#a05c0a', bg: '#fdefd6' }
            :             { label: 'Baja',  color: '#c0282a', bg: '#fce8e8' };
  return { ...hl, avg, count: hr.length };
});

const activeCycleObj = computed(() => state.cycles.find((c) => c.active) || null);
const prevCycleObj   = computed(() => { const i = state.cycles.findIndex((c) => c.active); return i > 0 ? state.cycles[i - 1] : null; });
const countBadge     = computed(() => {
  if (!activeCycleObj.value || state.cycleFilter !== 'Todos') return null;
  const activeCount = teamResps.value.filter((r) => r.fields.Ciclo === activeCycleObj.value.name).length;
  const prevCount   = prevCycleObj.value ? teamResps.value.filter((r) => r.fields.Ciclo === prevCycleObj.value.name).length : null;
  return { activeCount, prevCount, activeName: activeCycleObj.value.name, prevName: prevCycleObj.value?.name };
});

const nKey          = computed(() => state.cycleFilter === 'Todos' ? '_general' : state.cycleFilter.replace(/[^a-zA-Z0-9]/g, '_'));
const noteCicloLabel = computed(() => state.cycleFilter === 'Todos' ? 'general' : state.cycleFilter);
const coachNote     = computed(() => (team.value?.notas || {})[nKey.value] || '');

const aiKey    = computed(() => `${props.tid}__${state.cycleFilter || 'Todos'}`);
const safeAiKey = computed(() => aiKey.value.replace(/[^a-zA-Z0-9]/g, '_'));
const aiEntry  = computed(() => state.aiAnalysis[aiKey.value] || null);
const aiCount  = computed(() => filteredByCycle.value.length);
const canAnalyze = computed(() => aiCount.value >= 3);
const aiImages  = computed(() => state.aiImages[aiKey.value] || []);
const aiDocCtx  = computed(() => state.aiDocContext[aiKey.value] || null);
const aiCtxVal  = computed(() =>
  state.aiContext[aiKey.value] !== undefined
    ? state.aiContext[aiKey.value]
    : (aiEntry.value?.data?.contextoCoach || '')
);

const commentCount = computed(() =>
  teamResps.value.reduce((n, r) =>
    n + SECTIONS.filter((sec) => ((r.fields.Comments || {})[sec.id] || '').trim().length > 0).length, 0)
);

// v-html panels (pure display, no onclick handlers)
const participationHtml = computed(() => renderParticipationPanel(props.tid, state.cycleFilter));
const questionDetailHtml = computed(() => state.teamDetailExpanded[props.tid] ? renderQuestionDetail(props.tid, selectedRole.value) : '');
const commentsHtml       = computed(() => state.teamCommentsExpanded[props.tid] ? renderCommentsPanel(props.tid, state.cycleFilter) : '');

// ── Chart radar ───────────────────────────────────────────────────
const radarKey = computed(() => {
  const vals  = DIMS.map((d) => ds.value.avgDims[d.key].pct).join(',');
  const bench = radarBenchmark.value ? radarBenchmark.value.join(',') : 'none';
  return `${props.tid}/${vals}/${bench}`;
});

watch([radarCanvas, radarKey], ([canvas]) => {
  if (radarChart) { radarChart.destroy(); radarChart = null; }
  if (!canvas) return;
  const labels  = DIMS.map((d) => d.label);
  const colors  = DIMS.map((d) => d.color);
  const values  = DIMS.map((d) => ds.value.avgDims[d.key].pct);
  const datasets = [{
    label: 'Equipo', data: values,
    backgroundColor: 'rgba(26,86,219,0.10)', borderColor: 'rgba(26,86,219,0.75)', borderWidth: 2,
    pointBackgroundColor: colors, pointBorderColor: '#fff', pointBorderWidth: 1.5, pointRadius: 4, pointHoverRadius: 5,
  }];
  if (radarBenchmark.value) {
    datasets.push({
      label: 'Promedio org', data: radarBenchmark.value,
      backgroundColor: 'transparent', borderColor: 'rgba(107,114,128,0.50)', borderWidth: 1.5,
      borderDash: [4, 3], pointRadius: 0, pointHoverRadius: 3, pointHoverBackgroundColor: 'rgba(107,114,128,0.7)',
    });
  }
  radarChart = new Chart(canvas, {
    type: 'radar',
    data: { labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: true,
      scales: { r: { min: 0, max: 100, ticks: { stepSize: 25, display: false, backdropColor: 'transparent' }, grid: { color: 'rgba(0,0,0,0.07)' }, angleLines: { color: 'rgba(0,0,0,0.07)' }, pointLabels: { font: { size: 11, family: "'DM Sans', sans-serif" }, color: '#374151' } } },
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => ` ${ctx.raw}%` } } },
      animation: { duration: 350 },
    },
  });
}, { flush: 'post' });

onUnmounted(() => { if (radarChart) radarChart.destroy(); });

// ── Helpers ───────────────────────────────────────────────────────
function dimColorFor(key) { return DIMS.find((d) => d.key === key)?.color || '#374151'; }
function dimLabelFor(key) { return DIMS.find((d) => d.key === key)?.label || key; }

function copyText(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => toast('Copiado al portapapeles'));
  } else {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    toast('Copiado al portapapeles');
  }
}
</script>
