// charts.js — Chart.js integration

const Charts = {
    _instance: null,

    // FIX: truncating all labels to 15 chars causes collision when two subjects
    // share the same first 15 characters. Deduplicate by appending a counter.
    _makeLabels(subjects) {
        const seen = {};
        return subjects.map(s => {
            const base = s.name.length > 14 ? s.name.substring(0, 14) + '…' : s.name;
            if (seen[base] === undefined) {
                seen[base] = 0;
                return base;
            } else {
                seen[base]++;
                return `${base} (${seen[base]})`;
            }
        });
    },

    render(subjects, threshold) {
        const canvas = document.getElementById('attendance-chart');
        if (!canvas || subjects.length === 0) return;

        const labels = this._makeLabels(subjects);
        const data = subjects.map(s => Calculator.percentage(s.attended, s.delivered));
        const colors = data.map(p => {
            const status = Calculator.status(p, threshold);
            if (status === 'safe')    return '#059669';
            if (status === 'warning') return '#d97706';
            if (status === 'danger')  return '#dc2626';
            return '#7f1d1d';
        });

        if (this._instance) {
            this._instance.destroy();
            this._instance = null;
        }

        this._instance = new Chart(canvas, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Attendance %',
                    data,
                    backgroundColor: colors.map(c => c + '22'),
                    borderColor: colors,
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title: ctx => subjects[ctx[0].dataIndex]?.name || ctx[0].label,
                            label: ctx => `${ctx.parsed.y}%`
                        }
                    }
                },
                scales: {
                    y: {
                        min: 0, max: 100,
                        grid: { color: '#f0f0f0' },
                        ticks: { callback: val => val + '%', font: { size: 11, family: "'DM Mono', monospace" } }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 11 } }
                    }
                },
                animation: { duration: 500, easing: 'easeInOutQuart' }
            },
            plugins: [{
                id: 'threshold-line',
                afterDraw(chart) {
                    const { ctx, chartArea: { left, right }, scales: { y } } = chart;
                    const yPos = y.getPixelForValue(threshold);
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(left, yPos);
                    ctx.lineTo(right, yPos);
                    ctx.strokeStyle = '#1a6bcc';
                    ctx.lineWidth = 1.5;
                    ctx.setLineDash([5, 4]);
                    ctx.stroke();
                    ctx.fillStyle = '#1a6bcc';
                    ctx.font = "11px 'DM Mono', monospace";
                    ctx.fillText(`${threshold}% min`, right - 58, yPos - 5);
                    ctx.restore();
                }
            }]
        });
    },

    destroy() {
        if (this._instance) {
            this._instance.destroy();
            this._instance = null;
        }
    }
};