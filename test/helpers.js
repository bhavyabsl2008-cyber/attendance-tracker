// test/helpers.js — Loads the app's plain <script>-style files (which define
// global `const Calculator = {...}` etc, not ES modules) into a vm context so
// tests can exercise the exact same code that ships to the browser, with zero
// build step and zero new dependencies.

const vm = require('vm');
const fs = require('fs');
const path = require('path');

function loadApp() {
    const context = {
        localStorage: {
            _data: {},
            getItem(key) { return this._data[key] ?? null; },
            setItem(key, val) { this._data[key] = val; },
            removeItem(key) { delete this._data[key]; },
        },
        console,
    };
    vm.createContext(context);

    const files = ['calculator.js', 'timetable.js'];
    for (const file of files) {
        const src = fs.readFileSync(path.join(__dirname, '..', 'js', file), 'utf8');
        vm.runInContext(src, context, { filename: file });
    }
    // Calculator.js references Timetable.SEMESTER at call-time, and timetable.js
    // is plain `const`, so neither attaches to the context object automatically —
    // pull them out explicitly.
    vm.runInContext('globalThis.Calculator = Calculator; globalThis.Timetable = Timetable;', context);

    return { Calculator: context.Calculator, Timetable: context.Timetable, _context: context };
}

// Freezes "today" inside a loaded app's vm context, for testing functions that
// call `new Date()` internally (like getRemainingClassesForSubject) without
// needing to pass a date parameter through the whole call chain.
function freezeToday(app, isoDateStr) {
    const fixed = isoDateStr;
    vm.runInContext(`
        globalThis.__RealDate = Date;
        globalThis.Date = class extends __RealDate {
            constructor(...args) {
                if (args.length === 0) super('${fixed}T00:00:00');
                else super(...args);
            }
            static now() { return new __RealDate('${fixed}T00:00:00').getTime(); }
        };
    `, app._context);
}

function unfreezeToday(app) {
    vm.runInContext('if (globalThis.__RealDate) globalThis.Date = globalThis.__RealDate;', app._context);
}

module.exports = { loadApp, freezeToday, unfreezeToday };
