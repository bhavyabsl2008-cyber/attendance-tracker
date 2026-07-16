// medical-leave.js — Guide + fillable letter generator for Medical Leave applications.
// Content sourced directly from the official Chitkara CSE ML request form.
// Anything NOT explicitly on that form (e.g. a minimum-day eligibility rule) is
// deliberately left out rather than guessed — see the caveat shown in the modal.

const MedicalLeave = {
    show() {
        document.getElementById('ml-guide-modal')?.remove();

        const modal = document.createElement('div');
        modal.id = 'ml-guide-modal';
        modal.className = 'tt-modal-overlay';
        modal.innerHTML = `
            <div class="tt-modal-box tt-modal-wide">
                <div class="tt-modal-header">
                    <div>
                        <div class="tt-modal-title">Medical Leave Guide</div>
                        <div class="tt-modal-sub">Based on the official CSE department ML form</div>
                    </div>
                    <button class="tt-close-btn" onclick="MedicalLeave._close()">✕</button>
                </div>

                <div class="ml-guide-body">
                    <div class="ml-guide-section">
                        <div class="ml-guide-step-title">1. What you actually need</div>
                        <ul class="ml-guide-list">
                            <li><strong>Minimum 5 working days</strong> of absence — per mentor guidance, this is when an ML application actually gets processed. This isn't written on the official form itself, so if you're close to the line, confirm with your own mentor.</li>
                            <li><strong>A medical certificate</strong> from the doctor you consulted — the form explicitly requires this to be attached.</li>
                            <li><strong>The signed application letter</strong> (generator below) — addressed to the Dean, CSE, routed through your Mentor.</li>
                        </ul>
                        <p class="ml-guide-caveat">
                            ⚠️ The 5-day rule above comes from direct mentor guidance, not the written form —
                            policies can vary by mentor or change over time, so if your situation is borderline,
                            confirm with your own mentor before assuming it applies. I also could not confirm
                            a requirement for separate admission/blood reports — the form only asks for
                            "the medical certificate."
                        </p>
                    </div>

                    <div class="ml-guide-section">
                        <div class="ml-guide-step-title">2. Who actually signs it</div>
                        <p>This form is signed by your <strong>parent or guardian</strong>, not you —
                        it's written in their voice ("kindly grant my ward..."). Get their signature
                        before submitting.</p>
                    </div>

                    <div class="ml-guide-section">
                        <div class="ml-guide-step-title">3. Where it goes</div>
                        <p>Submitted <strong>through your Mentor</strong>, addressed to the
                        <strong>Dean, Department of CSE</strong>. Your mentor fills in remarks and
                        signs before it's processed.</p>
                    </div>

                    <div class="ml-guide-section">
                        <div class="ml-guide-step-title">4. Fill in your letter</div>
                        <div class="ml-form-grid">
                            <input type="text" id="ml-student-name" placeholder="Your full name" class="ml-form-input">
                            <input type="text" id="ml-roll-no" placeholder="University Roll No." class="ml-form-input">
                            <input type="text" id="ml-sem" placeholder="Semester (e.g. 3rd)" class="ml-form-input">
                            <input type="date" id="ml-from-date" class="ml-form-input">
                            <input type="date" id="ml-to-date" class="ml-form-input">
                            <input type="text" id="ml-disease" placeholder="Illness / reason" class="ml-form-input">
                            <input type="text" id="ml-parent-name" placeholder="Parent/Guardian full name" class="ml-form-input">
                            <input type="tel" id="ml-parent-mobile" placeholder="Parent/Guardian mobile no." class="ml-form-input">
                        </div>
                        <button class="tt-toolbar-btn" style="margin-top:12px" onclick="MedicalLeave.generateLetter()">Generate Letter →</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('tt-modal-show'));
        modal.addEventListener('click', e => { if (e.target === modal) this._close(); });
    },

    _close() {
        document.getElementById('ml-guide-modal')?.remove();
    },

    generateLetter() {
        const get = id => document.getElementById(id)?.value?.trim() || '________________';
        const formatDate = id => {
            const val = document.getElementById(id)?.value;
            if (!val) return '________________';
            const d = new Date(val + 'T00:00:00');
            return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        };

        const name = get('ml-student-name');
        const roll = get('ml-roll-no');
        const sem = get('ml-sem');
        const fromDate = formatDate('ml-from-date');
        const toDate = formatDate('ml-to-date');
        const disease = get('ml-disease');
        const parentName = get('ml-parent-name');
        const parentMobile = get('ml-parent-mobile');
        const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

        const letterWindow = window.open('', '_blank');
        letterWindow.document.write(`
            <html>
            <head>
                <title>Medical Leave Application — ${name}</title>
                <style>
                    body { font-family: 'Times New Roman', serif; max-width: 700px; margin: 40px auto; line-height: 1.8; font-size: 14px; color: #000; }
                    .bold { font-weight: bold; }
                    .section { margin-bottom: 24px; }
                    .signature-block { margin-top: 60px; }
                    .office-use { margin-top: 60px; border-top: 2px solid #000; padding-top: 16px; }
                    .blank-line { border-bottom: 1px solid #000; display: inline-block; min-width: 220px; }
                    @media print { body { margin: 20px; } }
                </style>
            </head>
            <body>
                <p class="bold">To,</p>
                <p class="bold">Dean<br>Department of Computer Science &amp; Engineering<br>Chitkara University Institute of Engineering &amp; Technology,<br>Punjab</p>
                <p>Through,<br>Dr./Ms./Mr. <span class="blank-line">&nbsp;</span> (Mentor)<br>Department of Computer Science &amp; Engineering<br>Chitkara University Institute of Engineering &amp; Technology,<br>Punjab</p>
                <p>Date: ${today}</p>

                <p class="bold">Subject: Request for Medical Leave</p>

                <p>Dear Sir/Madam,</p>

                <p>This is to request you to kindly grant my ward <span class="bold">${name}</span>,
                University Roll No. <span class="bold">${roll}</span>, Sem <span class="bold">${sem}</span>,
                Medical Leave from <span class="bold">${fromDate}</span> to <span class="bold">${toDate}</span>
                as per the norms of University. He/She is suffering from <span class="bold">${disease}</span> disease.</p>

                <p>I hope you will consider my request. The medical certificate is attached herewith.</p>

                <div class="signature-block">
                    <p class="bold">Your's truly,</p>
                    <p class="bold">(Signature of Parent/Guardian)</p>
                    <p class="bold">${parentName}</p>
                    <p class="bold">Mobile No.: ${parentMobile}</p>
                </div>

                <div class="office-use">
                    <p class="bold" style="text-decoration: underline;">For Office Use</p>
                    <p class="bold">Mentor's Remarks: ______________________________________________</p>
                    <br><br>
                    <p class="bold">Signature of Mentor &nbsp;&nbsp;&nbsp;&nbsp; Dated: ____________</p>
                    <p class="bold">(Full Name)</p>
                </div>
            </body>
            </html>
        `);
        letterWindow.document.close();
        UI.toast('Letter ready — use your browser\'s Print → Save as PDF', 'success');
    },
};
