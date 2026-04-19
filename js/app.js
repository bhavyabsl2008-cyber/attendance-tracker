// app.js - Main application logic

let subjects = loadSubjects();

function addSubject() {
    let name = document.getElementById("subject-name").value.trim();
    let delivered = parseInt(document.getElementById("delivered").value);
    let attended = parseInt(document.getElementById("attended").value);

    if (!name || isNaN(delivered) || isNaN(attended)) {
        alert("Please fill all fields!");
        return;
    }

    if (attended > delivered) {
        alert("Attended cannot be more than delivered!");
        return;
    }

    let subject = {
        id: Date.now(),
        name: name,
        delivered: delivered,
        attended: attended
    };

    subjects.push(subject);
    saveSubjects(subjects);
    renderSubjects();
    clearForm();
}

function clearForm() {
    document.getElementById("subject-name").value = "";
    document.getElementById("delivered").value = "";
    document.getElementById("attended").value = "";
}

function deleteSubject(id) {
    subjects = subjects.filter(s => s.id !== id);
    saveSubjects(subjects);
    renderSubjects();
}

function clearAll() {
    if (confirm("Delete all subjects?")) {
        subjects = [];
        clearAllData();
        renderSubjects();
    }
}

function renderSubjects() {
    let container = document.getElementById("subjects-container");
    container.innerHTML = "";

    if (subjects.length === 0) {
        container.innerHTML = "<p class='empty-msg'>No subjects added yet. Add your first subject above!</p>";
        document.getElementById("summary-bar").classList.add("hidden");
        document.getElementById("clear-btn").classList.add("hidden");
        return;
    }

    document.getElementById("summary-bar").classList.remove("hidden");
    document.getElementById("clear-btn").classList.remove("hidden");

    let safeCount = 0, warningCount = 0, dangerCount = 0;

    subjects.forEach(subject => {
        let percentage = calculatePercentage(subject.attended, subject.delivered);
        let status = getStatus(parseFloat(percentage));
        let skips = safeSkips(subject.attended, subject.delivered);
        let needed = classesNeededToReach75(subject.attended, subject.delivered);
        let prediction = predictEndSem(subject.attended, subject.delivered, 20);

        if (status === "safe") safeCount++;
        else if (status === "warning") warningCount++;
        else dangerCount++;

        let card = `
        <div class="subject-card ${status}">
            <div class="card-header">
                <h3>${subject.name}</h3>
                <button class="delete-btn" onclick="deleteSubject(${subject.id})">✕</button>
            </div>
            <div class="attendance-bar">
                <div class="bar-fill ${status}" style="width: ${Math.min(percentage, 100)}%"></div>
            </div>
            <div class="percentage">${percentage}%</div>
            <div class="card-stats">
                <div class="stat">
                    <span>${subject.attended}/${subject.delivered}</span>
                    <label>Attended</label>
                </div>
                <div class="stat">
                    <span>${skips}</span>
                    <label>Can miss</label>
                </div>
                <div class="stat">
                    <span>${needed > 0 ? needed : "✓"}</span>
                    <label>Need to attend</label>
                </div>
            </div>
            <div class="prediction">
                Best case: ${prediction.bestCase}% | Worst case: ${prediction.worstCase}%
            </div>
        </div>`;

        container.innerHTML += card;
    });

    document.getElementById("total-subjects").textContent = subjects.length;
    document.getElementById("safe-count").textContent = safeCount;
    document.getElementById("warning-count").textContent = warningCount;
    document.getElementById("danger-count").textContent = dangerCount;
}

renderSubjects();