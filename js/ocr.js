// ocr.js — chalkpad screenshot upload. Reads the university's "Attendance
// Subjectwise" screen (fixed layout: Subject Name + Code, Delivered, Attended,
// From/To dates) via in-browser OCR (Tesseract.js, loaded from CDN on first
// use — not bundled, so students who never use this feature never download it).
//
// Design choices, deliberate:
//  - Matches subjects by their CHALKPAD CODE (e.g. 25CSE0204), not by name —
//    codes are stable, names get typed inconsistently by students.
//  - NEVER auto-applies parsed numbers. OCR is fallible (bad lighting, crop,
//    compression). Every upload lands on a review screen where the student
//    sees exactly what was read and can correct any field before saving.
//  - The screenshot's "To" date becomes that subject's dataAsOf, shown as a
//    staleness badge on the card — so a subject not re-uploaded in weeks
//    visibly says so instead of silently looking current.

const OCR = {
    _tesseractLoaded: false,

    async _ensureTesseract() {
        if (this._tesseractLoaded || typeof Tesseract !== 'undefined') {
            this._tesseractLoaded = true;
            return;
        }
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
            script.onload = resolve;
            script.onerror = () => reject(new Error('Could not load OCR engine'));
            document.head.appendChild(script);
        });
        this._tesseractLoaded = true;
    },

    triggerUpload() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) this._processImage(file);
        };
        input.click();
    },

    async _processImage(file) {
        UI.toast('Reading screenshot…', 'info', 60000);
        try {
            await this._ensureTesseract();
            const result = await Tesseract.recognize(file, 'eng');
            const text = result.data.text;
            const parsed = this._parse(text);

            if (parsed.length === 0) {
                UI.toast("Couldn't find any subjects in that screenshot — try a clearer crop of the Attendance Subjectwise screen", 'error', 5000);
                return;
            }
            this._showReview(parsed);
        } catch (err) {
            console.error('OCR failed:', err);
            UI.toast("Couldn't read that screenshot — try again", 'error');
        }
    },

    // Splits the OCR'd text on chalkpad subject codes (e.g. 25CSE0204) and
    // extracts each block's name/delivered/attended/to-date independently.
    _parse(text) {
        const codePattern = /\b(\d{2}[A-Z]{2,5}\d{3,4})\b/g;
        const codeMatches = [...text.matchAll(codePattern)];
        if (codeMatches.length === 0) return [];

        const results = [];
        for (let i = 0; i < codeMatches.length; i++) {
            const start = codeMatches[i].index;
            const end = i + 1 < codeMatches.length ? codeMatches[i + 1].index : text.length;
            const block = text.slice(start, end);
            const code = codeMatches[i][1];

            // subject name = text on the same line as the code, before the code
            const codeLine = text.slice(0, start).split('\n').pop() || '';
            const name = codeLine.replace(/[^A-Za-z0-9 &\-]/g, '').trim();

            const deliveredMatch = block.match(/Delivered\s*:?\s*(\d+)/i);
            const attendedMatch = block.match(/Attended\s*:?\s*(\d+)/i);
            const toMatch = block.match(/TO\s*:?\s*([\d]{1,2}\s*[A-Za-z]{3,9}\s*\d{4})/i);

            if (!deliveredMatch || !attendedMatch) continue; // block too garbled to trust

            results.push({
                code,
                name: name || code,
                delivered: parseInt(deliveredMatch[1], 10),
                attended: parseInt(attendedMatch[1], 10),
                dataAsOf: toMatch ? this._normalizeDate(toMatch[1]) : null,
            });
        }
        return results;
    },

    _normalizeDate(raw) {
        const cleaned = raw.replace(/\s+/g, ' ').trim();
        const d = new Date(cleaned);
        return isNaN(d) ? null : d.toISOString().slice(0, 10);
    },

    // ─── REVIEW MODAL — nothing is saved until the student confirms ───
    _showReview(parsed) {
        document.getElementById('ui-modal')?.remove();
        const modal = document.createElement('div');
        modal.id = 'ui-modal';
        modal.className = 'ui-modal-overlay';

        const rowsHtml = parsed.map((p, i) => {
            const existing = App.subjects.find(s => s.chalkpadCode === p.code);
            const matchNote = existing
                ? `<span class="ocr-match-tag">Will update "${this._escape(existing.name)}"</span>`
                : `<span class="ocr-new-tag">New subject</span>`;
            return `
                <div class="ocr-row" data-idx="${i}">
                    <div class="ocr-row-head">
                        <input class="ocr-field-name" value="${this._escape(p.name)}">
                        ${matchNote}
                    </div>
                    <div class="ocr-row-fields">
                        <label>Delivered <input class="ocr-field-delivered" type="number" min="0" value="${p.delivered}"></label>
                        <label>Attended <input class="ocr-field-attended" type="number" min="0" value="${p.attended}"></label>
                        <label class="ocr-field-skip"><input type="checkbox" class="ocr-field-include" checked> Include</label>
                    </div>
                </div>`;
        }).join('');

        modal.innerHTML = `
            <div class="ui-modal-box ocr-review-box" role="dialog" aria-modal="true">
                <div class="ui-modal-title">Review before saving</div>
                <div class="cgpa-disclaimer">OCR isn't perfect — check these numbers against your actual chalkpad before confirming. Matched by subject code, so re-uploading updates the same subject even if you've renamed it.</div>
                <div id="ocr-rows">${rowsHtml}</div>
                <div class="ui-modal-actions">
                    <button class="ui-modal-cancel" id="ocr-cancel">Cancel</button>
                    <button class="ui-modal-confirm" id="ocr-confirm">Save</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('ui-modal-show'));

        const close = () => {
            modal.classList.remove('ui-modal-show');
            setTimeout(() => modal.remove(), 200);
        };
        modal.querySelector('#ocr-cancel').addEventListener('click', close);
        modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

        modal.querySelector('#ocr-confirm').addEventListener('click', () => {
            this._commit(parsed, modal);
            close();
        });
    },

    _commit(parsed, modal) {
        let addedCount = 0, updatedCount = 0;
        modal.querySelectorAll('.ocr-row').forEach((row, i) => {
            if (!row.querySelector('.ocr-field-include').checked) return;
            const p = parsed[i];
            const name = row.querySelector('.ocr-field-name').value.trim();
            const delivered = parseInt(row.querySelector('.ocr-field-delivered').value, 10) || 0;
            const attended = parseInt(row.querySelector('.ocr-field-attended').value, 10) || 0;

            const existing = App.subjects.find(s => s.chalkpadCode === p.code);
            if (existing) {
                existing.name = name;
                existing.delivered = delivered;
                existing.attended = attended;
                if (p.dataAsOf) existing.dataAsOf = p.dataAsOf;
                updatedCount++;
            } else {
                App.subjects.push({
                    id: crypto.randomUUID(),
                    name,
                    delivered,
                    attended,
                    chalkpadCode: p.code,
                    dataAsOf: p.dataAsOf,
                });
                addedCount++;
            }
        });

        Storage.saveSubjects(App.subjects);
        Storage.appendHistory({ type: 'chalkpad-upload' });
        App.render();
        UI.toast(`${addedCount} added, ${updatedCount} updated from screenshot`, 'success');
    },

    _escape(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    },
};
