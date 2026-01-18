// DS2 Intelligence Model - Questionnaire Application

// ============================================
// Theme Toggle
// ============================================

function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('ds2-theme', newTheme);
}

function loadTheme() {
    const savedTheme = localStorage.getItem('ds2-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

// ============================================
// State
// ============================================

let questionPool = {};      // Full pool: { marker: [variants] }
let sessionQuestions = [];  // Selected questions for this session
let currentQuestionIndex = 0;
let answers = {};
let probChart = null;
let userAge = null;
let questionTimings = {};   // { questionId: { start, end, duration } }
let currentQuestionStart = null;

// ============================================
// Age Adjustment Curves
// ============================================

const AGE_ADJUSTMENT = {
    // AMI: steep curve (processing-dependent, degrades faster with age)
    AMI: {
        // [minAge, maxAge, adjustment]
        ranges: [
            [0, 24, 0.30],      // Developing
            [25, 44, 0.00],     // Baseline (peak)
            [45, 54, 0.40],     // Early decline
            [55, 64, 0.80],     // Moderate decline
            [65, 100, 1.20]     // Significant decline
        ]
    },
    // CMI: shallow curve (degrades slower, peaks later)
    CMI: {
        ranges: [
            [0, 24, 0.15],      // Developing
            [25, 49, 0.00],     // Baseline (longer peak window)
            [50, 59, 0.20],     // Early decline
            [60, 100, 0.40]     // Moderate decline
        ]
    }
};

function getAgeAdjustment(age, dimension) {
    if (!age || age < 12) return 0;

    const curve = AGE_ADJUSTMENT[dimension];
    if (!curve) return 0;

    for (const [minAge, maxAge, adjustment] of curve.ranges) {
        if (age >= minAge && age <= maxAge) {
            return adjustment;
        }
    }
    return 0;
}

const DSS_TYPES = {
    'DSS-I': { name: 'Systematic Analytical', color: '#ef4444' },
    'DSS-II': { name: 'Creative Conceptual', color: '#8b5cf6' },
    'DSS-III': { name: 'Integrated Polymathic', color: '#10b981' },
    'DSS-IV': { name: 'Developing Foundational', color: '#f59e0b' }
};

const MARKER_LABELS = {
    // AMI markers
    symbolic_consistency: 'Symbolic Consistency',
    multivariable_manipulation: 'Multi-variable Manipulation',
    first_principles: 'First Principles Derivation',
    boundary_checking: 'Boundary Condition Checking',
    formal_proof_construction: 'Formal Proof Construction',
    algorithmic_decomposition: 'Algorithmic Decomposition',
    error_propagation: 'Error Propagation Tracing',
    symmetry_exploitation: 'Symmetry Exploitation',
    logical_consistency: 'Logical Consistency Detection',
    quantitative_estimation: 'Quantitative Estimation',
    // CMI markers
    ontology_generation: 'Ontology Generation',
    reference_frame_shift: 'Reference Frame Shifting',
    paradox_tolerance: 'Paradox Tolerance',
    concept_compression: 'Concept Compression',
    analogical_transfer: 'Analogical Transfer',
    emergence_recognition: 'Emergence Recognition',
    abstraction_level_fluidity: 'Abstraction Level Fluidity',
    generative_metaphor: 'Generative Metaphor',
    conceptual_boundary_dissolution: 'Conceptual Boundary Dissolution',
    problem_space_transformation: 'Problem Space Transformation'
};

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    loadTheme();
    await loadQuestions();
    // Set initial count based on number of markers (will be 20 with current pool)
    document.getElementById('totalQ').textContent = Object.keys(questionPool).length;
});

async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        const data = await response.json();

        // Build question pool by marker
        questionPool = {};
        data.questions.forEach(q => {
            if (!questionPool[q.marker]) {
                questionPool[q.marker] = [];
            }
            questionPool[q.marker].push(q);
        });

        console.log('Question pool loaded:', Object.keys(questionPool).length, 'markers');
    } catch (error) {
        console.error('Failed to load questions:', error);
    }
}

function selectSessionQuestions() {
    // Select one question per marker (random when variants exist)
    sessionQuestions = [];

    Object.keys(questionPool).forEach(marker => {
        const variants = questionPool[marker];
        // Random selection from variants
        const selected = variants[Math.floor(Math.random() * variants.length)];
        sessionQuestions.push(selected);
    });

    // Sort: AMI questions first, then CMI
    sessionQuestions.sort((a, b) => {
        if (a.dimension === b.dimension) return a.id - b.id;
        return a.dimension === 'AMI' ? -1 : 1;
    });

    console.log('Session questions selected:', sessionQuestions.length);
    return sessionQuestions;
}

// ============================================
// Screen Management
// ============================================

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

// ============================================
// Assessment Flow
// ============================================

function startAssessment() {
    // Capture age from input
    const ageInput = document.getElementById('userAge');
    userAge = ageInput && ageInput.value ? parseInt(ageInput.value) : null;

    // Reset state
    currentQuestionIndex = 0;
    answers = {};
    questionTimings = {};
    currentQuestionStart = null;

    // Select questions for this session (random from pool)
    selectSessionQuestions();

    // Update UI
    document.getElementById('totalQ').textContent = sessionQuestions.length;
    showScreen('questionScreen');
    displayQuestion();
    updateProgress();
}

function displayQuestion() {
    const question = sessionQuestions[currentQuestionIndex];
    if (!question) return;

    // Start timing for this question
    currentQuestionStart = Date.now();

    // Update header
    const dimEl = document.getElementById('questionDimension');
    dimEl.textContent = question.dimension;
    dimEl.className = `question-dimension ${question.dimension}`;

    document.getElementById('questionMarker').textContent = MARKER_LABELS[question.marker] || question.marker;

    // Update question content
    document.getElementById('questionText').textContent = question.text;
    document.getElementById('questionContext').textContent = question.context || '';

    // Generate options
    const container = document.getElementById('optionsContainer');
    container.innerHTML = question.options.map((opt, idx) => `
        <div class="option ${answers[question.id] === idx ? 'selected' : ''}"
             onclick="selectOption(${question.id}, ${idx}, ${opt.score})">
            <div class="option-radio"></div>
            <div class="option-text">${opt.text}</div>
        </div>
    `).join('');

    // Update navigation buttons
    document.getElementById('prevBtn').disabled = currentQuestionIndex === 0;

    const nextBtn = document.getElementById('nextBtn');
    if (currentQuestionIndex === sessionQuestions.length - 1) {
        nextBtn.textContent = 'Complete Assessment';
    } else {
        nextBtn.textContent = 'Next Question';
    }
    nextBtn.disabled = answers[question.id] === undefined;

    updateProgress();
}

function selectOption(questionId, optionIndex, score) {
    // Record timing for this question
    if (currentQuestionStart && !questionTimings[questionId]) {
        const endTime = Date.now();
        questionTimings[questionId] = {
            start: currentQuestionStart,
            end: endTime,
            duration: endTime - currentQuestionStart
        };
    }

    answers[questionId] = optionIndex;
    answers[`${questionId}_score`] = score;
    answers[`${questionId}_dimension`] = sessionQuestions.find(q => q.id === questionId).dimension;
    answers[`${questionId}_marker`] = sessionQuestions.find(q => q.id === questionId).marker;

    // Update UI
    document.querySelectorAll('.option').forEach((opt, idx) => {
        opt.classList.toggle('selected', idx === optionIndex);
    });

    // Enable next button
    document.getElementById('nextBtn').disabled = false;
}

function nextQuestion() {
    if (currentQuestionIndex < sessionQuestions.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
    } else {
        completeAssessment();
    }
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
    }
}

function updateProgress() {
    const answered = Object.keys(answers).filter(k => !k.includes('_')).length;
    document.getElementById('currentQ').textContent = currentQuestionIndex + 1;
    document.getElementById('progressFill').style.width = `${(answered / sessionQuestions.length) * 100}%`;
}

// ============================================
// Assessment Computation
// ============================================

function completeAssessment() {
    const profile = computeDS2Profile();
    showScreen('resultsScreen');
    displayResults(profile);
}

function computeDS2Profile() {
    const amiMarkers = {};
    const cmiMarkers = {};

    // Aggregate scores by marker
    sessionQuestions.forEach(q => {
        const score = answers[`${q.id}_score`];
        if (score !== undefined) {
            if (q.dimension === 'AMI') {
                amiMarkers[q.marker] = score;
            } else {
                cmiMarkers[q.marker] = score;
            }
        }
    });

    // Calculate aggregate scores (average of all markers)
    const amiScores = Object.values(amiMarkers);
    const cmiScores = Object.values(cmiMarkers);

    const amiRaw = amiScores.length > 0
        ? amiScores.reduce((a, b) => a + b, 0) / amiScores.length
        : 0;
    const cmiRaw = cmiScores.length > 0
        ? cmiScores.reduce((a, b) => a + b, 0) / cmiScores.length
        : 0;

    // Scale to 0-10 (raw scores)
    const amiRawScaled = amiRaw * 10;
    const cmiRawScaled = cmiRaw * 10;

    // Apply age adjustment (adds handicap for age-related decline)
    const amiAdjustment = getAgeAdjustment(userAge, 'AMI');
    const cmiAdjustment = getAgeAdjustment(userAge, 'CMI');

    // Adjusted scores (capped at 10)
    const ami = Math.min(10, amiRawScaled + amiAdjustment);
    const cmi = Math.min(10, cmiRawScaled + cmiAdjustment);

    // Determine type using adjusted scores
    const dssType = determineDSSType(ami, cmi);

    // Calculate probabilities
    const probs = calculateTypeProbabilities(ami, cmi);

    // Calculate total timing
    const totalTime = Object.values(questionTimings).reduce((sum, t) => sum + t.duration, 0);
    const avgTime = Object.keys(questionTimings).length > 0
        ? totalTime / Object.keys(questionTimings).length
        : 0;

    return {
        DS2_Profile: {
            AMI: parseFloat(ami.toFixed(2)),
            CMI: parseFloat(cmi.toFixed(2)),
            AMI_Raw: parseFloat(amiRawScaled.toFixed(2)),
            CMI_Raw: parseFloat(cmiRawScaled.toFixed(2)),
            Age_Adjustment: userAge ? {
                age: userAge,
                AMI: parseFloat(amiAdjustment.toFixed(2)),
                CMI: parseFloat(cmiAdjustment.toFixed(2))
            } : null,
            DSS_Type: dssType,
            Summary: generateSummary(ami, cmi, dssType)
        },
        DS2_Bayesian: {
            AMI: {
                value: parseFloat(ami.toFixed(2)),
                likelihood: calculateLikelihood(amiScores)
            },
            CMI: {
                value: parseFloat(cmi.toFixed(2)),
                likelihood: calculateLikelihood(cmiScores)
            },
            Type_Probabilities: probs
        },
        DS2_Timing: {
            total_ms: totalTime,
            avg_per_question_ms: Math.round(avgTime),
            questions: questionTimings
        },
        markers: {
            AMI: amiMarkers,
            CMI: cmiMarkers
        }
    };
}

function determineDSSType(ami, cmi) {
    const highThreshold = 5.5;
    const boundaryMargin = 0.5;
    const dominanceThreshold = 3.0;

    const amiHigh = ami >= highThreshold;
    const cmiHigh = cmi >= highThreshold;
    const amiAtBoundary = Math.abs(ami - highThreshold) <= boundaryMargin;
    const cmiAtBoundary = Math.abs(cmi - highThreshold) <= boundaryMargin;
    const gap = Math.abs(ami - cmi);

    // Clear cases: both clearly high or both clearly low
    if (amiHigh && cmiHigh) return 'DSS-III';
    if (!amiHigh && !cmiHigh && !amiAtBoundary && !cmiAtBoundary) return 'DSS-IV';

    // Dominance override
    if (gap >= dominanceThreshold) {
        if (cmi > ami) {
            return cmi >= highThreshold && ami >= (highThreshold - boundaryMargin) ? 'DSS-III' : 'DSS-II';
        } else {
            return ami >= highThreshold && cmi >= (highThreshold - boundaryMargin) ? 'DSS-III' : 'DSS-I';
        }
    }

    // Standard classification for non-dominant cases
    if (amiHigh && !cmiHigh) return 'DSS-I';
    if (!amiHigh && cmiHigh) return 'DSS-II';

    // Boundary case
    if (amiAtBoundary && cmiHigh) return 'DSS-III';
    if (cmiAtBoundary && amiHigh) return 'DSS-III';

    return 'DSS-IV';
}

function calculateTypeProbabilities(ami, cmi) {
    const centers = {
        'DSS-I': { ami: 8, cmi: 3 },
        'DSS-II': { ami: 3, cmi: 8 },
        'DSS-III': { ami: 8, cmi: 8 },
        'DSS-IV': { ami: 3, cmi: 3 }
    };

    const gap = cmi - ami;
    const gapMagnitude = Math.abs(gap);

    // Base distances
    const distances = {};
    for (const [type, center] of Object.entries(centers)) {
        distances[type] = Math.sqrt(Math.pow(ami - center.ami, 2) + Math.pow(cmi - center.cmi, 2));
    }

    // Apply gap pressure
    const pressure = gapMagnitude * 0.15;

    if (gap > 0) {
        distances['DSS-II'] += (ami > 4.5) ? pressure * 1.5 : 0;
        distances['DSS-III'] -= pressure;
        distances['DSS-I'] += pressure * 2;
        distances['DSS-IV'] += pressure;
    } else if (gap < 0) {
        distances['DSS-I'] -= pressure * 0.5;
        distances['DSS-III'] -= pressure;
        distances['DSS-II'] += pressure * 2;
        distances['DSS-IV'] += pressure;
    }

    // Ensure no negative distances
    for (const type of Object.keys(distances)) {
        distances[type] = Math.max(0.1, distances[type]);
    }

    // Convert to probabilities via inverse distance
    let totalInverse = 0;
    for (const type of Object.keys(centers)) {
        totalInverse += 1 / (distances[type] + 0.1);
    }

    const probs = {};
    for (const type of Object.keys(centers)) {
        probs[type] = parseFloat(((1 / (distances[type] + 0.1)) / totalInverse).toFixed(4));
    }

    return probs;
}

function calculateLikelihood(scores) {
    if (scores.length === 0) return 0.5;

    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    const consistencyFactor = Math.max(0, 1 - (stdDev * 2));
    const strengthFactor = mean;

    return parseFloat((consistencyFactor * 0.6 + strengthFactor * 0.4).toFixed(4));
}

function generateSummary(ami, cmi, dssType) {
    const typeInfo = DSS_TYPES[dssType];
    const amiLevel = ami >= 7 ? 'strong' : ami >= 4 ? 'moderate' : 'developing';
    const cmiLevel = cmi >= 7 ? 'strong' : cmi >= 4 ? 'moderate' : 'developing';
    const delta = cmi - ami;
    const deltaStr = delta >= 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1);
    const dominance = Math.abs(delta) >= 2
        ? (delta > 0 ? 'CMI-dominant' : 'AMI-dominant')
        : 'balanced';

    return `${typeInfo.name} architecture. ${amiLevel} AMI (${ami.toFixed(1)}), ${cmiLevel} CMI (${cmi.toFixed(1)}). Delta=${deltaStr} (${dominance}).`;
}

// ============================================
// Display Results
// ============================================

function displayResults(profile) {
    const p = profile.DS2_Profile;
    const b = profile.DS2_Bayesian;
    const m = profile.markers;

    // DSS Type
    const badge = document.getElementById('resultDSSBadge');
    badge.textContent = p.DSS_Type;
    badge.className = `dss-badge ${p.DSS_Type}`;
    document.getElementById('resultDSSName').textContent = DSS_TYPES[p.DSS_Type].name;

    // Scores with animated rings
    document.getElementById('resultAMI').textContent = p.AMI.toFixed(1);
    document.getElementById('resultCMI').textContent = p.CMI.toFixed(1);

    // Animate score rings (circumference = 2 * PI * 45 = ~283)
    const circumference = 283;

    // Calculate potential growth for each dimension
    const delta = p.CMI - p.AMI;
    const amiHeadroom = 10 - p.AMI;
    const cmiHeadroom = 10 - p.CMI;
    const amiPotential = p.AMI + amiHeadroom * 0.7;
    const cmiPotential = p.CMI + cmiHeadroom * 0.7;

    // Get age adjustments for visualization
    const amiAgeAdj = p.Age_Adjustment ? p.Age_Adjustment.AMI : 0;
    const cmiAgeAdj = p.Age_Adjustment ? p.Age_Adjustment.CMI : 0;
    const amiAgeRing = document.getElementById('amiAgeRing');
    const cmiAgeRing = document.getElementById('cmiAgeRing');

    const amiPotentialLabel = document.getElementById('amiPotentialLabel');
    const cmiPotentialLabel = document.getElementById('cmiPotentialLabel');
    const amiPotentialRing = document.getElementById('amiPotentialRing');
    const cmiPotentialRing = document.getElementById('cmiPotentialRing');

    amiPotentialLabel.textContent = '';
    cmiPotentialLabel.textContent = '';

    const innerCircumference = 239;

    setTimeout(() => {
        const amiRawPct = p.AMI_Raw / 10;
        const cmiRawPct = p.CMI_Raw / 10;
        document.getElementById('amiRing').style.strokeDashoffset = circumference - amiRawPct * circumference;
        document.getElementById('cmiRing').style.strokeDashoffset = circumference - cmiRawPct * circumference;

        if (amiAgeAdj > 0) {
            const amiAdjustedPct = p.AMI / 10;
            amiAgeRing.style.strokeDashoffset = circumference - amiAdjustedPct * circumference;
        } else {
            amiAgeRing.style.strokeDashoffset = circumference;
        }

        if (cmiAgeAdj > 0) {
            const cmiAdjustedPct = p.CMI / 10;
            cmiAgeRing.style.strokeDashoffset = circumference - cmiAdjustedPct * circumference;
        } else {
            cmiAgeRing.style.strokeDashoffset = circumference;
        }

        if (Math.abs(delta) <= 1) {
            amiPotentialRing.style.strokeDashoffset = innerCircumference - (amiPotential / 10) * innerCircumference;
            cmiPotentialRing.style.strokeDashoffset = innerCircumference - (cmiPotential / 10) * innerCircumference;
            amiPotentialLabel.textContent = `+${(amiHeadroom * 0.7).toFixed(1)}`;
            cmiPotentialLabel.textContent = `+${(cmiHeadroom * 0.7).toFixed(1)}`;
        } else if (delta > 0) {
            amiPotentialRing.style.strokeDashoffset = innerCircumference - (amiPotential / 10) * innerCircumference;
            cmiPotentialRing.style.strokeDashoffset = innerCircumference;
            amiPotentialLabel.textContent = `+${(amiHeadroom * 0.7).toFixed(1)}`;
        } else {
            cmiPotentialRing.style.strokeDashoffset = innerCircumference - (cmiPotential / 10) * innerCircumference;
            amiPotentialRing.style.strokeDashoffset = innerCircumference;
            cmiPotentialLabel.textContent = `+${(cmiHeadroom * 0.7).toFixed(1)}`;
        }
    }, 100);

    // Display IQ Range
    displayIQRange(p.AMI, p.CMI, p.Age_Adjustment);

    // Position marker on grid
    const marker = document.getElementById('resultMarker');
    marker.style.left = `${(p.CMI / 10) * 100}%`;
    marker.style.top = `${(1 - p.AMI / 10) * 100}%`;

    // Marker breakdown
    displayMarkers('amiMarkers', m.AMI);
    displayMarkers('cmiMarkers', m.CMI);

    // Probability chart
    displayProbChart(b.Type_Probabilities);

    // Profile interpretation
    displayInterpretation(p.AMI, p.CMI, p.DSS_Type);

    // Compatibility matrix
    displayCompatibility(p.DSS_Type);

    // Domain fit & vectors
    displayDomainFit(p.AMI, p.CMI, p.DSS_Type);

    // JSON output
    const jsonOutput = {
        DS2_Profile: p,
        DS2_Bayesian: b
    };
    document.getElementById('jsonOutput').textContent = JSON.stringify(jsonOutput, null, 2);
}

function displayMarkers(containerId, markers) {
    const container = document.getElementById(containerId);

    container.innerHTML = Object.entries(markers).map(([marker, score]) => {
        const scoreClass = score >= 0.7 ? 'high' : score >= 0.4 ? 'medium' : 'low';
        const displayScore = (score * 10).toFixed(1);

        return `
            <div class="marker-item">
                <span class="marker-name">${MARKER_LABELS[marker] || marker}</span>
                <span class="marker-score ${scoreClass}">${displayScore}</span>
            </div>
        `;
    }).join('');
}

function displayProbChart(probs) {
    const ctx = document.getElementById('probChart').getContext('2d');

    if (probChart) {
        probChart.destroy();
    }

    probChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(probs).map(k => `${k}: ${DSS_TYPES[k].name.split(' ')[0]}`),
            datasets: [{
                data: Object.values(probs),
                backgroundColor: [
                    'rgba(239, 68, 68, 0.7)',
                    'rgba(139, 92, 246, 0.7)',
                    'rgba(16, 185, 129, 0.7)',
                    'rgba(245, 158, 11, 0.7)'
                ],
                borderColor: ['#ef4444', '#8b5cf6', '#10b981', '#f59e0b'],
                borderWidth: 2,
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${(ctx.raw * 100).toFixed(1)}%`
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    max: 1,
                    grid: { color: 'rgba(148, 163, 184, 0.1)' },
                    ticks: {
                        color: '#94a3b8',
                        callback: (v) => `${(v * 100).toFixed(0)}%`
                    }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8', font: { size: 11 } }
                }
            }
        }
    });
}

function displayIQRange(ami, cmi, ageAdjustment) {
    const mapToIQ = (score) => Math.round(85 + (score / 10) * 90);

    const iqAmi = mapToIQ(ami);
    const iqCmi = mapToIQ(cmi);
    const iqLower = Math.min(iqAmi, iqCmi);
    const iqUpper = Math.max(iqAmi, iqCmi);
    const iqNominal = Math.round((iqAmi + iqCmi) / 2);
    const bandwidth = iqUpper - iqLower;

    let aai = 0;
    let rawIqNominal = iqNominal;
    if (ageAdjustment && (ageAdjustment.AMI > 0 || ageAdjustment.CMI > 0)) {
        const rawAmi = ami - ageAdjustment.AMI;
        const rawCmi = cmi - ageAdjustment.CMI;
        rawIqNominal = Math.round((mapToIQ(rawAmi) + mapToIQ(rawCmi)) / 2);
        aai = iqNominal - rawIqNominal;
    }

    const totalStr = String(iqNominal);
    const dqAAIElement = document.getElementById('dqAAIValue');
    if (aai > 0 && totalStr.length > 1) {
        const brightPart = totalStr.slice(0, -1);
        const mutedPart = totalStr.slice(-1);
        document.getElementById('dqRawValue').textContent = brightPart;
        dqAAIElement.textContent = mutedPart;
        const saturation = Math.max(0.2, Math.min(1, 1 - (aai * 0.08)));
        const opacity = Math.max(0.5, Math.min(1, 1 - (aai * 0.05)));
        dqAAIElement.style.setProperty('--aai-saturation', saturation);
        dqAAIElement.style.setProperty('--aai-opacity', opacity);
    } else {
        document.getElementById('dqRawValue').textContent = iqNominal;
        dqAAIElement.textContent = '';
    }

    const delta = cmi - ami;
    const amiHeadroom = 10 - ami;
    const cmiHeadroom = 10 - cmi;

    let potentialIQGain;
    if (Math.abs(delta) <= 1) {
        const amiGain = mapToIQ(ami + amiHeadroom * 0.7) - iqAmi;
        const cmiGain = mapToIQ(cmi + cmiHeadroom * 0.7) - iqCmi;
        potentialIQGain = Math.round((amiGain + cmiGain) / 2);
    } else if (delta > 0) {
        potentialIQGain = mapToIQ(ami + amiHeadroom * 0.7) - iqAmi;
    } else {
        potentialIQGain = mapToIQ(cmi + cmiHeadroom * 0.7) - iqCmi;
    }

    document.getElementById('iqPopoverFloor').textContent = iqLower;
    document.getElementById('iqPopoverNominal').textContent = iqNominal;
    document.getElementById('iqPopoverCeiling').textContent = iqUpper;
    document.getElementById('iqPopoverBandwidth').textContent = bandwidth;

    const aaiRow = document.getElementById('iqPopoverAAIRow');
    const aaiValue = document.getElementById('iqPopoverAAI');
    if (aai > 0) {
        aaiValue.textContent = `+${aai}`;
        aaiRow.classList.remove('hidden');
    } else {
        aaiRow.classList.add('hidden');
    }

    const circumference = 283;

    const iqMin = 85;
    const iqMax = 175;
    const iqRange = iqMax - iqMin;

    const floorPct = (iqLower - iqMin) / iqRange;
    const ceilingPct = (iqUpper - iqMin) / iqRange;

    const floorRing = document.getElementById('iqFloorRing');
    const ceilingRing = document.getElementById('iqCeilingRing');

    const floorAngle = floorPct * 360;
    const ceilingAngle = ceilingPct * 360;
    const nominalPct = (iqNominal - iqMin) / iqRange;
    const nominalAngle = nominalPct * 360;

    const floorMark = document.getElementById('iqFloorMark');
    const ceilingMark = document.getElementById('iqCeilingMark');
    const nominalDot = document.getElementById('iqNominalDot');

    setTimeout(() => {
        floorRing.style.strokeDashoffset = circumference - (floorPct * circumference);
        ceilingRing.style.strokeDashoffset = circumference - (ceilingPct * circumference);

        floorMark.style.transform = `rotate(${floorAngle}deg)`;
        ceilingMark.style.transform = `rotate(${ceilingAngle}deg)`;
        nominalDot.style.transform = `rotate(${nominalAngle}deg)`;
    }, 100);

    const growthContainer = document.getElementById('iqGrowthPotential');
    const potentialAmiIQ = mapToIQ(Math.min(10, ami + amiHeadroom * 0.7));
    const potentialCmiIQ = mapToIQ(Math.min(10, cmi + cmiHeadroom * 0.7));

    if (Math.abs(delta) >= 2) {
        const isDominantCMI = delta > 0;
        const developDimension = isDominantCMI ? 'AMI' : 'CMI';
        const developLabel = isDominantCMI ? 'Analytical Mechanics' : 'Conceptual Morphogenesis';
        const currentLow = isDominantCMI ? ami : cmi;
        const headroom = isDominantCMI ? amiHeadroom : cmiHeadroom;
        const newNominal = isDominantCMI
            ? Math.round((potentialAmiIQ + iqCmi) / 2)
            : Math.round((iqAmi + potentialCmiIQ) / 2);

        growthContainer.innerHTML = `
            <div class="iq-growth-header">Development Vector (Delta=${delta > 0 ? '+' : ''}${delta.toFixed(1)})</div>
            <div class="iq-growth-text">
                ${isDominantCMI
                    ? `CMI near ceiling (${cmi.toFixed(1)}/10). Primary growth opportunity: <strong>${developLabel}</strong>.`
                    : `AMI near ceiling (${ami.toFixed(1)}/10). Primary growth opportunity: <strong>${developLabel}</strong>.`
                }
            </div>
            <div class="iq-growth-vector">
                <span class="vector-direction">${developDimension} ${currentLow.toFixed(1)} -> ${(currentLow + headroom * 0.7).toFixed(1)}</span>
                <span class="vector-impact">+${potentialIQGain} IQ -> Nominal ~${newNominal}</span>
            </div>
        `;
    } else {
        growthContainer.innerHTML = `
            <div class="iq-growth-header">Balanced Development (Delta=${delta > 0 ? '+' : ''}${delta.toFixed(1)})</div>
            <div class="iq-growth-text">
                Relatively balanced architecture. Development in either dimension raises the overall range.
            </div>
            <div class="iq-growth-vector">
                <span class="vector-direction">Both dimensions have growth potential</span>
                <span class="vector-impact">+${potentialIQGain} IQ potential</span>
            </div>
        `;
    }
}

function displayDomainFit(ami, cmi, dssType) {
    const domainProfiles = {
        'DSS-I': {
            breakthrough: ['Formal Verification', 'Compiler Design', 'Cryptography', 'Mathematical Proof'],
            highFit: ['Systems Engineering', 'Quantitative Finance', 'Algorithm Design', 'Security Analysis', 'Scientific Computing'],
            innovationVector: 'Optimization',
            innovationDesc: 'Breakthrough via rigorous refinement - finding the provably optimal solution',
            productivity: { type: 'deep', pct: 85, label: 'Deep Work' },
            productivityDesc: 'Peak output in extended uninterrupted sessions. Struggles with frequent context switches.'
        },
        'DSS-II': {
            breakthrough: ['Paradigm Shifts', 'New Market Creation', 'Artistic Innovation', 'Framework Design'],
            highFit: ['Strategic Consulting', 'Product Vision', 'Research Direction', 'Creative Direction', 'Venture Capital'],
            innovationVector: 'Disruption',
            innovationDesc: 'Breakthrough via reconceptualization - seeing what others cannot imagine',
            productivity: { type: 'burst', pct: 70, label: 'Burst Creative' },
            productivityDesc: 'High-intensity creative bursts followed by integration periods. Non-linear output pattern.'
        },
        'DSS-III': {
            breakthrough: ['Cross-Domain Synthesis', 'First-Principles Innovation', 'Systems Reconceptualization', 'Novel Theory'],
            highFit: ['Research Leadership', 'Technical Architecture', 'Deep Tech Founding', 'Complex Problem Solving', 'Interdisciplinary Science'],
            innovationVector: 'Synthesis',
            innovationDesc: 'Breakthrough via integration - combining rigorous analysis with conceptual leaps',
            productivity: { type: 'variable', pct: 80, label: 'Adaptive' },
            productivityDesc: 'Flexes between deep analytical work and creative exploration. Optimizes mode to problem type.'
        },
        'DSS-IV': {
            breakthrough: ['Incremental Improvement', 'Process Refinement', 'Practical Application'],
            highFit: ['Implementation', 'Operations', 'Quality Assurance', 'Documentation', 'Support Engineering'],
            innovationVector: 'Iteration',
            innovationDesc: 'Progress via systematic improvement - steady refinement over time',
            productivity: { type: 'steady', pct: 65, label: 'Steady State' },
            productivityDesc: 'Consistent output. Benefits from structured environments and clear direction.'
        }
    };

    const profile = domainProfiles[dssType];
    const delta = cmi - ami;

    let adjustedBreakthrough = [...profile.breakthrough];
    let adjustedHighFit = [...profile.highFit];

    if (dssType === 'DSS-III' && Math.abs(delta) >= 3) {
        if (delta > 0) {
            adjustedBreakthrough = ['Paradigm Innovation', 'Theoretical Frameworks', 'Conceptual Architecture', 'Vision-Driven R&D'];
            adjustedHighFit.unshift('Strategic Research');
        } else {
            adjustedBreakthrough = ['Formal Innovation', 'Rigorous Synthesis', 'Systematic Breakthroughs', 'Mathematical Unification'];
            adjustedHighFit.unshift('Technical Research Lead');
        }
    }

    document.getElementById('breakthroughDomains').innerHTML = adjustedBreakthrough
        .map((d, i) => `<span class="domain-tag ${i < 2 ? 'primary' : ''}">${d}</span>`)
        .join('');

    document.getElementById('highFitDomains').innerHTML = adjustedHighFit
        .map((d, i) => `<span class="domain-tag ${i < 2 ? 'secondary' : ''}">${d}</span>`)
        .join('');

    document.getElementById('innovationVector').innerHTML = `
        <div class="vector-item">
            <span class="vector-label">Primary Mode</span>
            <span class="vector-value">${profile.innovationVector}</span>
        </div>
        <div class="vector-item">
            <span class="vector-label">Mechanism</span>
            <span class="vector-value" style="font-size: 0.75rem; font-weight: normal;">${profile.innovationDesc}</span>
        </div>
    `;

    document.getElementById('productivityPattern').innerHTML = `
        <div class="vector-item">
            <span class="vector-label">Pattern</span>
            <span class="vector-value">${profile.productivity.label}</span>
        </div>
        <div class="productivity-bar">
            <div class="productivity-fill ${profile.productivity.type}" style="width: ${profile.productivity.pct}%"></div>
        </div>
        <p class="pattern-desc">${profile.productivityDesc}</p>
    `;
}

function displayCompatibility(userType) {
    const container = document.getElementById('compatGrid');

    const compatMatrix = {
        'DSS-I': {
            'DSS-I': { level: 'synergy', rating: 'High Synergy', desc: 'Shared analytical rigor enables deep technical collaboration' },
            'DSS-II': { level: 'complementary', rating: 'Complementary', desc: 'Your precision grounds their creativity; their vision expands your scope' },
            'DSS-III': { level: 'synergy', rating: 'High Synergy', desc: 'They match your rigor while adding conceptual depth' },
            'DSS-IV': { level: 'neutral', rating: 'Mentorship', desc: 'You can guide their analytical development effectively' }
        },
        'DSS-II': {
            'DSS-I': { level: 'complementary', rating: 'Complementary', desc: 'Their rigor validates your insights; you push them beyond convention' },
            'DSS-II': { level: 'synergy', rating: 'High Synergy', desc: 'Rapid creative amplification; ideas build on ideas' },
            'DSS-III': { level: 'synergy', rating: 'High Synergy', desc: 'They translate your concepts into implementable frameworks' },
            'DSS-IV': { level: 'neutral', rating: 'Mentorship', desc: 'You can nurture their conceptual development' }
        },
        'DSS-III': {
            'DSS-I': { level: 'synergy', rating: 'High Synergy', desc: 'Strong analytical partnership; you add conceptual range to their precision' },
            'DSS-II': { level: 'synergy', rating: 'High Synergy', desc: 'You implement their visions while expanding them systematically' },
            'DSS-III': { level: 'complementary', rating: 'Powerful', desc: 'Rare pairing - mutual amplification across all dimensions' },
            'DSS-IV': { level: 'neutral', rating: 'Mentorship', desc: 'Ideal mentor role; you model integrated cognitive development' }
        },
        'DSS-IV': {
            'DSS-I': { level: 'neutral', rating: 'Learning', desc: 'Opportunity to develop analytical skills through collaboration' },
            'DSS-II': { level: 'neutral', rating: 'Learning', desc: 'Exposure to creative reframing expands your conceptual range' },
            'DSS-III': { level: 'complementary', rating: 'Growth', desc: 'Ideal learning partner; models integrated capability you can develop' },
            'DSS-IV': { level: 'friction', rating: 'Limited', desc: 'Similar limitations; seek diverse partnerships for growth' }
        }
    };

    const types = ['DSS-I', 'DSS-II', 'DSS-III', 'DSS-IV'];
    const typeNames = {
        'DSS-I': 'Analytical',
        'DSS-II': 'Conceptual',
        'DSS-III': 'Polymathic',
        'DSS-IV': 'Foundational'
    };

    container.innerHTML = types.map(type => {
        const compat = compatMatrix[userType][type];
        const isSelf = type === userType;
        const levelClass = isSelf ? 'self' : compat.level;

        return `
            <div class="compat-item ${levelClass}">
                <div class="compat-type">${type}</div>
                <div class="compat-name">${typeNames[type]}</div>
                <div class="compat-rating">${isSelf ? 'You' : compat.rating}</div>
                <div class="compat-desc">${isSelf ? 'Your cognitive architecture' : compat.desc}</div>
            </div>
        `;
    }).join('');
}

function displayInterpretation(ami, cmi, dssType) {
    const delta = cmi - ami;
    const container = document.getElementById('profileInterpretation');

    const interpretations = {
        'DSS-I': {
            title: 'Systematic Analytical',
            core: 'Your cognitive architecture prioritizes <span class="highlight">analytical mechanics</span> - the rigorous manipulation of formal systems, symbolic reasoning, and structured problem decomposition.',
            strengths: 'You excel at detecting inconsistencies, tracing error propagation, and constructing formal proofs. Your thinking naturally gravitates toward precision, boundary checking, and algorithmic clarity.',
            approach: 'Problems are best approached through systematic breakdown, first-principles derivation, and careful verification. You build understanding through rigorous analysis rather than intuitive leaps.',
            growth: 'Consider developing conceptual fluidity - the ability to shift reference frames, tolerate productive ambiguity, and recognize emergent patterns that resist formal capture.'
        },
        'DSS-II': {
            title: 'Creative Conceptual',
            core: 'Your cognitive architecture prioritizes <span class="highlight">conceptual morphogenesis</span> - the generation of novel frameworks, cross-domain transfer, and paradigm-shifting insight.',
            strengths: 'You excel at reframing problems, dissolving apparent boundaries between concepts, and recognizing deep structural analogies across disparate domains. Paradox is generative for you rather than problematic.',
            approach: 'Problems are best approached through metaphor, abstraction-level shifting, and ontological creativity. You build understanding through pattern recognition and conceptual compression.',
            growth: 'Consider developing analytical rigor - the ability to verify intuitions formally, trace implications systematically, and ground creative insights in defensible logical structure.'
        },
        'DSS-III': {
            title: 'Integrated Polymathic',
            core: 'Your cognitive architecture integrates both <span class="highlight">analytical mechanics and conceptual morphogenesis</span> - enabling rigorous analysis combined with creative reconceptualization.',
            strengths: 'You can both generate novel frameworks AND verify them formally. This dual capacity allows paradigm-shifting insight grounded in systematic validation - the signature of breakthrough thinking.',
            approach: 'Problems yield to iterative cycles: creative reframing followed by rigorous testing, conceptual leaps verified through formal analysis. You can operate at multiple abstraction levels while maintaining logical coherence.',
            growth: 'Your integrated architecture is rare. The key development path is deepening both capacities rather than allowing one to atrophy. Maintain deliberate practice in both analytical rigor and conceptual creativity.'
        },
        'DSS-IV': {
            title: 'Developing Foundational',
            core: 'Your cognitive architecture shows <span class="highlight">balanced development potential</span> across both analytical and conceptual dimensions.',
            strengths: 'You have flexibility - neither dimension dominates, which means neither constrains the other. This creates openness to multiple problem-solving approaches.',
            approach: 'Focus on deliberate development of both capacities. Analytical skills build through practice with formal systems, proofs, and systematic verification. Conceptual skills build through cross-domain exploration and creative reframing exercises.',
            growth: 'Identify which dimension feels more natural and invest in strengthening the complementary one. The goal is integrated capability - being able to both generate novel ideas AND rigorously evaluate them.'
        }
    };

    const interp = interpretations[dssType];
    const dominanceNote = Math.abs(delta) >= 3
        ? `<p><span class="highlight">Dominance pattern (Delta=${delta >= 0 ? '+' : ''}${delta.toFixed(1)}):</span> ${delta > 0 ? 'Your CMI significantly exceeds AMI, indicating strong conceptual orientation with adequate analytical foundation.' : 'Your AMI significantly exceeds CMI, indicating strong analytical orientation with adequate conceptual foundation.'}</p>`
        : '';

    container.innerHTML = `
        <p><strong>${interp.title}</strong></p>
        <p>${interp.core}</p>
        <p><span class="strength">Strengths:</span> ${interp.strengths}</p>
        <p><span class="highlight">Approach:</span> ${interp.approach}</p>
        <p><span class="growth">Development:</span> ${interp.growth}</p>
        ${dominanceNote}
    `;
}

// ============================================
// Utilities
// ============================================

function resetAssessment() {
    currentQuestionIndex = 0;
    answers = {};
    showScreen('welcomeScreen');
    document.getElementById('progressFill').style.width = '0%';
}

function copyJSON() {
    const json = document.getElementById('jsonOutput').textContent;
    navigator.clipboard.writeText(json).then(() => {
        const btn = document.querySelector('.json-section .btn');
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy JSON', 1500);
    });
}
