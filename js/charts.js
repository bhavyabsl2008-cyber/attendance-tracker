// charts.js — Chart.js integration

const Charts = {
    _instance: null,

    render(subjects, threshold) {
        const canvas = document.getElementById('attendance-chart');
        if (!canvas || subjects.length === 0) return;

        const labels = subjects.map(s => s.name.length > 15 ? s.name.substring(0, 15) + '...' : s.name);
        const data = subjects.map(s => Calculator.percentage(s.attended, s.delivered));
        const colors = data.map(p => {
            const status = Calculator.status(p, threshold);
            if (status === 'safe') return '#1D9E75';
            if (status === 'warning') return '#BA7517';
            if (status === 'danger') return '#a32d2d';
            return '#500000';
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
                    backgroundColor: colors.map(c => c + '33'),
                    borderColor: colors,
                    borderWidth: 2,
                    borderRadius: 8,
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
                            label: ctx => `${ctx.parsed.y}%`
                        }
                    }
                },
                scales: {
                    y: {
                        min: 0,
                        max: 100,
                        grid: { color: '#f0f0f0' },
                        ticks: {
                            callback: val => val + '%',
                            font: { size: 11 }
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 11 } }
                    }
                },
                animation: { duration: 600, easing: 'easeInOutQuart' }
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
                    ctx.strokeStyle = '#185FA5';
                    ctx.lineWidth = 1.5;
                    ctx.setLineDash([6, 4]);
                    ctx.stroke();
                    ctx.fillStyle = '#185FA5';
                    ctx.font = '11px Segoe UI';
                    ctx.fillText(`${threshold}% min`, right - 60, yPos - 6);
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