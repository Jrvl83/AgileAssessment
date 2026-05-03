import { mount, flushPromises } from '@vue/test-utils';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

vi.mock('../../src/firebase.js', () => ({ db: {}, auth: {} }));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({})),
  query: vi.fn(() => ({})),
  where: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({ docs: [] })),
  getDoc: vi.fn(() => Promise.resolve({ exists: () => false, data: () => ({}) })),
  doc: vi.fn(() => ({})),
  addDoc: vi.fn(() => Promise.resolve({ id: 'test-id' })),
  serverTimestamp: vi.fn(() => new Date()),
}));

import { getDocs, getDoc } from 'firebase/firestore';
import AssessmentApp from '../../src/components/AssessmentApp.vue';

function setSearch(search) {
  Object.defineProperty(globalThis, 'location', {
    value: { search, href: 'http://localhost/' + search },
    configurable: true,
    writable: true,
  });
}

describe('AssessmentApp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.scrollTo = vi.fn();
    setSearch('');
  });

  afterEach(() => {
    setSearch('');
  });

  it('muestra estado "Cargando" al montar', () => {
    const wrapper = mount(AssessmentApp);
    expect(wrapper.html()).toContain('Cargando');
  });

  it('muestra "Link incompleto" cuando no hay workspaceId en la URL', async () => {
    const wrapper = mount(AssessmentApp);
    await flushPromises();
    expect(wrapper.text()).toContain('Link incompleto');
  });

  it('muestra pantalla intro cuando workspace no tiene briefing', async () => {
    setSearch('?workspaceId=test-ws');
    vi.mocked(getDoc).mockResolvedValue({ exists: () => true, data: () => ({ briefingTexto: '' }) });
    const wrapper = mount(AssessmentApp);
    await flushPromises();
    expect(wrapper.text()).toContain('Comenzar assessment');
  });

  it('muestra pantalla briefing cuando workspace tiene briefingTexto', async () => {
    setSearch('?workspaceId=test-ws');
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({ briefingTexto: 'Bienvenido al assessment de tu equipo.' }),
    });
    const wrapper = mount(AssessmentApp);
    await flushPromises();
    expect(wrapper.text()).toContain('Bienvenido al assessment de tu equipo.');
    expect(wrapper.text()).toContain('Entendido, comenzar');
  });

  it('botón "Comenzar assessment" está deshabilitado sin rol ni equipo', async () => {
    setSearch('?workspaceId=test-ws');
    vi.mocked(getDoc).mockResolvedValue({ exists: () => true, data: () => ({ briefingTexto: '' }) });
    vi.mocked(getDocs).mockResolvedValue({
      docs: [{ id: 'eq1', data: () => ({ nombre: 'Fénix', activo: true }) }],
    });
    const wrapper = mount(AssessmentApp);
    await flushPromises();
    const btn = wrapper.get('button.btn.primary');
    expect(btn.attributes('disabled')).toBeDefined();
  });

  it('clic en botón de rol lo marca como seleccionado', async () => {
    setSearch('?workspaceId=test-ws');
    vi.mocked(getDoc).mockResolvedValue({ exists: () => true, data: () => ({ briefingTexto: '' }) });
    const wrapper = mount(AssessmentApp);
    await flushPromises();
    const devTeamBtn = wrapper.findAll('button.role-btn').find((b) => b.text() === 'Dev Team');
    expect(devTeamBtn).toBeDefined();
    await devTeamBtn.trigger('click');
    expect(devTeamBtn.classes()).toContain('selected');
  });

  it('"Entendido, comenzar" lleva a pantalla intro', async () => {
    setSearch('?workspaceId=test-ws');
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({ briefingTexto: 'Intro texto' }),
    });
    const wrapper = mount(AssessmentApp);
    await flushPromises();
    await wrapper.get('button.btn.primary').trigger('click');
    expect(wrapper.text()).toContain('Comenzar assessment');
  });

  it('navega a pantalla context después de seleccionar rol y equipo', async () => {
    setSearch('?workspaceId=test-ws');
    vi.mocked(getDoc).mockResolvedValue({ exists: () => true, data: () => ({ briefingTexto: '' }) });
    vi.mocked(getDocs).mockResolvedValue({
      docs: [{ id: 'eq1', data: () => ({ nombre: 'Fénix', activo: true }) }],
    });
    const wrapper = mount(AssessmentApp);
    await flushPromises();

    await wrapper.findAll('button.role-btn')[0].trigger('click');
    await wrapper.get('select.field-input').setValue('eq1');
    const btn = wrapper.get('button.btn.primary');
    expect(btn.attributes('disabled')).toBeUndefined();
    await btn.trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Contexto del equipo');
  });
});
