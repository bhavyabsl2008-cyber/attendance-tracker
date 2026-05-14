// darkmode.js — Dark mode toggle with localStorage persistence

const DarkMode = {
    STORAGE_KEY: 'att-tracker-dark-mode',

    init() {
        // Check localStorage first, then system preference
        const saved = localStorage.getItem(this.STORAGE_KEY);
        let isDark;

        if (saved !== null) {
            // User explicitly chose, respect that
            isDark = saved === 'true';
        } else {
            // First time, check system preference
            isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }

        this.set(isDark);

        // Listen for system theme changes (if user hasn't explicitly chosen)
        if (saved === null) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                this.set(e.matches);
            });
        }
    },

    set(isDark) {
        const root = document.documentElement;
        if (isDark) {
            root.classList.add('dark-mode');
        } else {
            root.classList.remove('dark-mode');
        }
        
        // Update button icon - show sun when dark mode on, moon when off
        const btn = document.getElementById('dark-mode-btn');
        if (btn) {
            const icon = btn.querySelector('.dark-mode-icon');
            if (icon) {
                icon.textContent = isDark ? '☀️' : '🌙';
            }
        }
        
        // Save choice to localStorage
        localStorage.setItem(this.STORAGE_KEY, isDark.toString());
    },

    toggle() {
        const isDark = document.documentElement.classList.contains('dark-mode');
        this.set(!isDark);
    },

    isDark() {
        return document.documentElement.classList.contains('dark-mode');
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => DarkMode.init());