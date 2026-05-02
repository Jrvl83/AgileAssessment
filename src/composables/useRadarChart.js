import { watch, onUnmounted } from 'vue';
import {
  Chart,
  RadarController,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js';

Chart.register(RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip);

export function useRadarChart(canvasRef, dataRef) {
  let chart = null;

  function create(canvas, data) {
    if (chart) { chart.destroy(); chart = null; }
    if (!canvas || !data?.radarValues?.length) return;
    chart = new Chart(canvas, {
      type: 'radar',
      data: {
        labels: data.radarLabels,
        datasets: [{
          data: data.radarValues,
          backgroundColor: 'rgba(26, 86, 219, 0.10)',
          borderColor: 'rgba(26, 86, 219, 0.75)',
          borderWidth: 2,
          pointBackgroundColor: data.radarColors,
          pointBorderColor: '#fff',
          pointBorderWidth: 1.5,
          pointRadius: 4,
          pointHoverRadius: 5,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          r: {
            min: 0, max: 100,
            ticks: { stepSize: 25, display: false, backdropColor: 'transparent' },
            grid: { color: 'rgba(0,0,0,0.07)' },
            angleLines: { color: 'rgba(0,0,0,0.07)' },
            pointLabels: { font: { size: 10, family: "'DM Sans', sans-serif" }, color: '#374151' },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => ' ' + ctx.raw + '%' } },
        },
        animation: { duration: 350 },
      },
    });
  }

  watch([canvasRef, dataRef], ([canvas, data]) => create(canvas, data), { flush: 'post' });

  onUnmounted(() => { if (chart) { chart.destroy(); chart = null; } });
}
