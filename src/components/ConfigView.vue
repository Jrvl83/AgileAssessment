<template>
  <div v-if="state.loading" class="empty-state">Cargando…</div>
  <div v-else>
    <!-- Anonimato y privacidad -->
    <div class="section-card">
      <div class="section-title">Anonimato y privacidad</div>
      <p style="font-size:13px;color:var(--ink-muted);line-height:1.6;margin-bottom:16px;">
        Define qué información del participante se recolecta y cómo se comunica en el formulario.
        El modo aplica a todas las respuestas nuevas de este workspace.
      </p>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
        <label v-for="m in ANON_MODES" :key="m.key"
          :style="`display:flex;align-items:flex-start;gap:10px;padding:10px 14px;border:1.5px solid ${state.anonymityMode === m.key ? 'var(--accent)' : 'var(--border)'};border-radius:var(--radius-sm);background:${state.anonymityMode === m.key ? 'var(--accent-light)' : 'white'};cursor:pointer;`">
          <input type="radio" name="anonymityMode" :value="m.key"
            :checked="state.anonymityMode === m.key"
            @change="saveAnonymityMode(m.key)"
            style="margin-top:2px;accent-color:var(--accent);flex-shrink:0;" />
          <div>
            <div :style="`font-size:13px;font-weight:600;color:${state.anonymityMode === m.key ? 'var(--accent-dark)' : 'var(--ink)'};`">
              {{ m.label }}
              <span v-if="m.key === 'full'" style="font-size:10px;font-weight:500;background:var(--surface-3);color:var(--ink-faint);padding:1px 6px;border-radius:99px;">Por defecto</span>
            </div>
            <div style="font-size:12px;color:var(--ink-muted);margin-top:2px;">{{ m.desc }}</div>
          </div>
        </label>
      </div>

      <div style="padding-top:14px;border-top:1px solid var(--border);">
        <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;">
          <input type="checkbox" :checked="state.aiEnabled" @change="saveAiEnabled($event.target.checked)"
            style="margin-top:3px;accent-color:var(--accent);flex-shrink:0;" />
          <div>
            <div style="font-size:13px;font-weight:600;color:var(--ink);">
              Análisis con IA
              <span style="font-size:10px;font-weight:500;background:#f0fdf4;color:#0d7a52;padding:1px 6px;border-radius:99px;margin-left:4px;">Próximamente</span>
            </div>
            <div style="font-size:12px;color:var(--ink-muted);margin-top:2px;">Si está activo, el formulario avisa a los participantes que sus comentarios pueden analizarse de forma agregada por IA para generar recomendaciones. Nunca se identifican autores individuales.</div>
          </div>
        </label>
      </div>

      <div style="padding-top:14px;border-top:1px solid var(--border);margin-top:14px;">
        <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;">
          <input type="checkbox" :checked="state.teamHealthEnabled" @change="saveTeamHealthEnabled($event.target.checked)"
            style="margin-top:3px;accent-color:var(--green);flex-shrink:0;" />
          <div>
            <div style="font-size:13px;font-weight:600;color:var(--ink);">Preguntas de salud del equipo</div>
            <div style="font-size:12px;color:var(--ink-muted);margin-top:2px;">Añade 3 preguntas opcionales de seguridad psicológica al final del formulario. El resultado se guarda como <code style="background:var(--surface-2);padding:1px 4px;border-radius:3px;">teamHealthScore</code> independiente del score de madurez Scrum.</div>
          </div>
        </label>
      </div>

      <div style="padding-top:14px;border-top:1px solid var(--border);margin-top:14px;">
        <div style="font-size:13px;font-weight:600;color:var(--ink);margin-bottom:6px;">Mensaje de llenado individual</div>
        <div style="font-size:12px;color:var(--ink-muted);margin-bottom:8px;">Texto que aparece en la pantalla de inicio del formulario. Deja en blanco para usar el mensaje por defecto.</div>
        <textarea class="field-input" rows="2"
          placeholder="Este assessment está diseñado para completarse de forma individual…"
          style="font-size:13px;resize:vertical;"
          :value="state.guidanceText || ''"
          @input="saveGuidanceText($event.target.value)"></textarea>
      </div>
    </div>

    <!-- Cadencia de ciclos -->
    <div class="section-card">
      <div class="section-title">Cadencia de ciclos</div>
      <p style="font-size:13px;color:var(--ink-muted);line-height:1.6;margin-bottom:14px;">
        Recibe un recordatorio en el panel cuando ha pasado más tiempo del esperado sin nuevas respuestas.
      </p>
      <div style="display:flex;align-items:center;gap:12px;">
        <label style="font-size:13px;color:var(--ink);font-weight:500;white-space:nowrap;">Recordar cada</label>
        <select class="field-input" style="width:auto;font-size:13px;padding:6px 10px;"
          :value="state.assessmentCadenceWeeks" @change="saveCadenceWeeks($event.target.value)">
          <option :value="0">Desactivado</option>
          <option :value="1">1 semana</option>
          <option :value="2">2 semanas</option>
          <option :value="3">3 semanas</option>
          <option :value="4">4 semanas</option>
          <option :value="6">6 semanas</option>
          <option :value="8">8 semanas</option>
        </select>
      </div>
    </div>

    <!-- Webhook -->
    <div class="section-card">
      <div class="section-title">Webhook</div>
      <p style="font-size:12px;color:var(--ink-faint);margin-bottom:14px;line-height:1.5;">
        Recibe un HTTP POST en tu URL cuando ocurren eventos clave. Útil para integraciones con Slack, Zapier, n8n, etc.
      </p>
      <div style="display:flex;gap:8px;align-items:center;">
        <input class="field-input" type="url" placeholder="https://tu-endpoint.com/webhook"
          style="flex:1;font-size:13px;"
          :value="state.webhookUrl || ''"
          @input="saveWebhookUrl($event.target.value)" />
        <button class="btn sm" @click="testWebhook">Probar</button>
      </div>
      <p style="font-size:11px;color:var(--ink-faint);margin-top:10px;line-height:1.6;">
        Eventos:
        <code style="background:var(--surface-2);padding:1px 5px;border-radius:3px;">ciclo.abierto</code>
        <code style="background:var(--surface-2);padding:1px 5px;border-radius:3px;">ciclo.cerrado</code>
        <code style="background:var(--surface-2);padding:1px 5px;border-radius:3px;">reporte.generado</code>
        <code style="background:var(--surface-2);padding:1px 5px;border-radius:3px;">plan.actualizado</code>
      </p>
    </div>

    <!-- Configuración de preguntas (cabecera) -->
    <div class="section-card">
      <div class="section-title">Configuración de preguntas</div>
      <p style="font-size:13px;color:var(--ink-muted);line-height:1.6;">
        Personaliza el formulario para este workspace. Los cambios aplican a partir del próximo assessment.
        <strong>Las preguntas personalizadas no afectan el score total</strong> — sus respuestas se guardan por separado.
      </p>
    </div>

    <!-- Editor de preguntas por sección -->
    <div v-for="sec in SECTIONS" :key="sec.id" class="section-card">
      <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:6px;">
        <div class="section-title" style="margin-bottom:0;">{{ sec.title }}</div>
        <span style="font-size:11px;color:var(--ink-faint);">{{ activeCount(sec) }}/{{ sec.questions.length }} activas</span>
      </div>
      <p style="font-size:12px;color:var(--ink-faint);margin-bottom:12px;line-height:1.5;">
        Activa/desactiva preguntas o edita su texto. Guardado automático.
      </p>

      <!-- Preguntas estándar -->
      <div v-for="(q, qi) in sec.questions" :key="qi"
        :style="`padding:14px 0;border-bottom:1px solid var(--border);${isDisabled(sec.id, qi) ? 'opacity:0.5;' : ''}`">
        <div style="display:flex;align-items:flex-start;gap:10px;">
          <button @click="toggleQuestionDisabled(qKey(sec.id, qi))"
            :title="isDisabled(sec.id, qi) ? 'Activar' : 'Desactivar'"
            :style="`flex-shrink:0;margin-top:3px;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600;cursor:pointer;border:1.5px solid ${isDisabled(sec.id, qi) ? 'var(--border)' : 'var(--accent)'};background:${isDisabled(sec.id, qi) ? 'white' : 'var(--accent-light)'};color:${isDisabled(sec.id, qi) ? 'var(--ink-faint)' : 'var(--accent)'};`">
            {{ isDisabled(sec.id, qi) ? 'Desactivada' : 'Activa' }}
          </button>
          <div style="flex:1;min-width:0;">
            <div style="font-size:10px;font-weight:600;color:var(--ink-faint);letter-spacing:0.06em;text-transform:uppercase;margin-bottom:4px;">P{{ qi + 1 }}</div>
            <textarea class="field-input" rows="2"
              style="font-size:13px;resize:vertical;min-height:52px;"
              :disabled="isDisabled(sec.id, qi)"
              :value="displayText(sec.id, qi, q.text)"
              @input="saveQuestionText(qKey(sec.id, qi), $event.target.value)"></textarea>
            <button v-if="hasCustomText(sec.id, qi, q.text)"
              @click="restoreQuestionText(qKey(sec.id, qi))"
              style="font-size:11px;color:var(--ink-faint);background:none;border:none;cursor:pointer;text-decoration:underline;padding:0;margin-top:2px;">
              Restaurar texto original
            </button>
          </div>
        </div>
      </div>

      <!-- Preguntas personalizadas -->
      <div v-for="(cq, cqi) in customQuestions(sec.id)" :key="cqi"
        style="background:var(--surface-2);border:1.5px solid var(--border);border-radius:var(--radius-sm);padding:14px;margin-top:10px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <span style="font-size:11px;font-weight:600;color:var(--accent);text-transform:uppercase;letter-spacing:0.06em;">Pregunta personalizada {{ cqi + 1 }}</span>
          <button @click="removeCustomQuestion(sec.id, cqi)"
            style="background:none;border:none;font-size:18px;cursor:pointer;color:var(--ink-faint);padding:0;line-height:1;">✕</button>
        </div>
        <textarea class="field-input" rows="2" placeholder="Texto de la pregunta…"
          style="font-size:13px;resize:vertical;margin-bottom:10px;"
          :value="cq.texto"
          @input="saveCustomQuestionField(sec.id, cqi, 'texto', $event.target.value)"></textarea>
        <div style="font-size:11px;color:var(--ink-faint);margin-bottom:6px;font-weight:500;">4 opciones de respuesta (de menor a mayor):</div>
        <input v-for="(opt, oi) in cq.opts" :key="oi"
          class="field-input" type="text" :placeholder="`Opción ${oi + 1}`"
          style="font-size:12px;padding:6px 10px;margin-bottom:6px;"
          :value="opt"
          @input="saveCustomQuestionField(sec.id, cqi, `opt${oi}`, $event.target.value)" />
      </div>

      <!-- Agregar pregunta personalizada -->
      <button v-if="canAddCustom(sec.id)" class="btn sm" style="margin-top:14px;"
        @click="addCustomQuestion(sec.id)">+ Agregar pregunta personalizada</button>
      <p v-else style="font-size:12px;color:var(--ink-faint);margin-top:10px;">
        Máximo 3 preguntas personalizadas por sección.
      </p>
    </div>
  </div>
</template>

<script setup>
import { state } from '../../assets/admin-state.js';
import {
  saveAnonymityMode, saveAiEnabled, saveTeamHealthEnabled, saveGuidanceText,
  saveCadenceWeeks, saveWebhookUrl, testWebhook,
  toggleQuestionDisabled, saveQuestionText, restoreQuestionText,
  addCustomQuestion, removeCustomQuestion, saveCustomQuestionField,
} from '../../assets/admin-api.js';
import { SECTIONS } from '../../assessment-config.js';

const ANON_MODES = [
  { key: 'full',    label: 'Anónimo total',  desc: 'Solo se guarda el rol. El campo nombre no aparece en el formulario.' },
  { key: 'semi',    label: 'Semi-anónimo',   desc: 'El participante puede escribir un identificador (Dev1, Dev2). El coach lo ve.' },
  { key: 'nominal', label: 'Nominal',        desc: 'El participante escribe su nombre. Recomendado solo para autoevaluaciones individuales.' },
];

function qKey(secId, qi) { return `${secId}_${qi}`; }

function overrideOf(secId, qi) { return (state.configOverrides || {})[qKey(secId, qi)] || {}; }

function isDisabled(secId, qi)            { return !!overrideOf(secId, qi).disabled; }
function displayText(secId, qi, orig)     { return overrideOf(secId, qi).texto || orig; }
function hasCustomText(secId, qi, orig)   { const ov = overrideOf(secId, qi); return ov.texto && ov.texto !== orig; }
function activeCount(sec)                 { return sec.questions.filter((_, qi) => !isDisabled(sec.id, qi)).length; }
function customQuestions(secId)           { return (state.configCustom || {})[secId] || []; }
function canAddCustom(secId)              { return customQuestions(secId).length < 3; }
</script>
