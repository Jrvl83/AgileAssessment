import { mount, flushPromises } from '@vue/test-utils';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../../src/firebase.js', () => ({ db: {}, auth: {} }));
vi.mock('../../src/composables/useRadarChart.js', () => ({ useRadarChart: vi.fn() }));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  onSnapshot: vi.fn(() => vi.fn()),
  updateDoc: vi.fn(() => Promise.resolve()),
  serverTimestamp: vi.fn(() => new Date()),
}));

import { onSnapshot, updateDoc } from 'firebase/firestore';
import EquipoApp from '../../src/components/EquipoApp.vue';

function setSearch(search) {
  Object.defineProperty(globalThis, 'location', {
    value: { search, href: 'http://localhost/' + search },
    configurable: true,
    writable: true,
  });
}

function fireSnapshot(data) {
  const calls = vi.mocked(onSnapshot).mock.calls;
  if (calls.length === 0) return;
  const [, onNext] = calls[calls.length - 1];
  onNext?.(data);
}

const portalData = {
  teamName: 'Equipo Fénix',
  branding: {},
  updatedAt: null,
  data: {
    avgTotal: 72,
    level: { label: 'Maduro', color: '#1a4fd6', bg: '#dce6ff', desc: '' },
    count: 5,
    activeCycle: 'Q2-2026',
    dims: [{ key: 'eventos', label: 'Ceremonias', color: '#1a4fd6' }],
    avgDims: { eventos: { pct: 75 } },
    evolutionData: [],
    plans: [],
  },
};

describe('EquipoApp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setSearch('?t=tok123');
  });

  it('muestra estado "Cargando" al montar', () => {
    const wrapper = mount(EquipoApp);
    expect(wrapper.text()).toContain('Cargando');
  });

  it('muestra error cuando no hay token en la URL', async () => {
    setSearch('');
    const wrapper = mount(EquipoApp);
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Link inválido');
  });

  it('muestra error cuando el portal no existe en Firestore', async () => {
    const wrapper = mount(EquipoApp);
    await wrapper.vm.$nextTick();
    fireSnapshot({ exists: () => false, data: () => ({}) });
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('no existe');
  });

  it('muestra contenido del equipo cuando el portal existe', async () => {
    const wrapper = mount(EquipoApp);
    await wrapper.vm.$nextTick();
    fireSnapshot({ exists: () => true, data: () => portalData });
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Equipo Fénix');
    expect(wrapper.text()).toContain('72%');
    expect(wrapper.text()).toContain('Maduro');
  });

  it('llama a updateDoc al cambiar el estado de un plan', async () => {
    const dataConPlan = {
      ...portalData,
      data: {
        ...portalData.data,
        plans: [{ id: 'plan-1', iniciativa: 'Mejorar daily', estado: 'pendiente' }],
      },
    };
    const wrapper = mount(EquipoApp);
    await wrapper.vm.$nextTick();
    fireSnapshot({ exists: () => true, data: () => dataConPlan });
    await wrapper.vm.$nextTick();

    const statusBtn = wrapper.findAll('button').find((b) => b.text() === 'En curso');
    expect(statusBtn).toBeDefined();
    await statusBtn.trigger('click');
    await flushPromises();

    expect(vi.mocked(updateDoc)).toHaveBeenCalledOnce();
    const [, patch] = vi.mocked(updateDoc).mock.calls[0];
    expect(patch).toMatchObject({ estado: 'en-curso', updatedByTeam: true });
  });
});
