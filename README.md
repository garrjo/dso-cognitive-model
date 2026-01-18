# DS2 - Dual-Structure Cognitive Model

A cognitive architecture framework that maps intelligence across two complementary dimensions: **Analytical Mechanics Intelligence (AMI)** and **Conceptual Morphogenesis Intelligence (CMI)**.

## Live Assessment

**[Take the Assessment](https://garrjo.github.io/dso-cognitive-model/)**

---

## The Model

DS2 provides a dual-axis framework for understanding cognitive style:

```
        High CMI
           │
   DSS-II  │  DSS-III
  Creative │ Polymathic
           │
───────────┼───────────── High AMI
           │
   DSS-IV  │  DSS-I
Developing │ Systematic
           │
        Low CMI
```

### AMI (Analytical Mechanics Intelligence)

Measures capacity for rigorous, systematic, analytical thinking:

- **Symbolic Consistency** - Detecting errors in formal systems
- **Multivariable Manipulation** - Tracking complex dependencies
- **First Principles Derivation** - Reconstructing from axioms
- **Boundary Condition Checking** - Verifying limiting cases
- **Formal Proof Construction** - Building rigorous arguments
- **Algorithmic Decomposition** - Breaking into executable steps
- **Error Propagation Tracing** - Following compound errors
- **Symmetry Exploitation** - Using invariants to simplify
- **Logical Consistency Detection** - Spotting contradictions
- **Quantitative Estimation** - Fermi-style approximation

### CMI (Conceptual Morphogenesis Intelligence)

Measures capacity for creative conceptual thinking and framework generation:

- **Ontology Generation** - Creating new conceptual frameworks
- **Reference Frame Shifting** - Radical perspective changes
- **Paradox Tolerance** - Holding contradictions productively
- **Concept Compression** - Chunking complex ideas into abstractions
- **Analogical Transfer** - Recognizing structural isomorphism
- **Emergence Recognition** - Identifying system-level properties
- **Abstraction Level Fluidity** - Zooming between detail and overview
- **Generative Metaphor** - Creating revealing metaphors
- **Conceptual Boundary Dissolution** - Seeing past conventions
- **Problem Space Transformation** - Reformulating to simplify

---

## DSS Type Classifications

| Type | Name | Profile | Innovation Mode |
|------|------|---------|-----------------|
| **DSS-I** | Systematic Analytical | High AMI, Low CMI | Optimization - breakthrough via rigorous refinement |
| **DSS-II** | Creative Conceptual | Low AMI, High CMI | Disruption - breakthrough via reconceptualization |
| **DSS-III** | Integrated Polymathic | High AMI, High CMI | Synthesis - breakthrough via integration (~2-5% of population) |
| **DSS-IV** | Developing Foundational | Moderate both | Iteration - progress via systematic improvement |

---

## Theoretical Foundation

DS2 builds on:

- **Cattell-Horn-Carroll (CHC)** intelligence framework
- **Dual-process theories** of cognition
- **D·Ω·O Equation**: `±Ω = D · Ω · O`
  - D (Drag): Precision, localization → AMI domain
  - Ω (Frame): Context, scope → Integration
  - O (Object): Fidelity, concept preservation → CMI domain

Full theory documentation: **[docs/DS2-Theory.md](docs/DS2-Theory.md)**

---

## Assessment Tool

The included web assessment measures your DS2 profile through 20 behavioral marker questions.

### Features

- **Random question selection** from a pool of 100 variants
- **Age-adjusted scoring** accounting for cognitive development
- **Derived IQ (DQ)** estimate with floor/ceiling range
- **Type probability distribution** via Bayesian analysis
- **Compatibility matrix** for cognitive synergies
- **Domain fit recommendations**
- **Light/Dark theme**
- **JSON export** of full profile

### How It Works

1. Answer 20 self-report behavioral questions (~5 min)
2. Questions probe specific cognitive markers (10 AMI, 10 CMI)
3. Scores aggregate into dimensional totals (0-10 scale)
4. Classification determined by thresholds and dominance patterns
5. Results include interpretation and growth vectors

---

## Applications

### Individual
- Understand cognitive strengths and growth areas
- Optimize learning strategies to your style
- Career guidance and domain fit

### Teams
- Build complementary cognitive pairings
- Identify gaps in team architecture
- Improve communication across types

### AI Calibration
- Match AI response style to user profile
- Reduce cognitive friction in human-AI interaction
- Adaptive verbosity and abstraction levels

---

## Deployment

### GitHub Pages (Live)

The assessment is live at: https://garrjo.github.io/dso-cognitive-model/

### Local Development

```bash
git clone https://github.com/garrjo/dso-cognitive-model.git
cd dso-cognitive-model

# Any static server works
python -m http.server 8080
# or
npx serve .
```

---

## File Structure

```
dso-cognitive-model/
├── index.html          # Assessment application
├── styles.css          # Light/dark theme styling
├── app.js              # Assessment logic and scoring
├── questions.json      # Question pool (100 questions)
├── docs/
│   └── DS2-Theory.md   # Full model documentation
└── README.md
```

---

## Scoring Reference

### Raw Scores
- Each question: 0.1 (low) to 1.0 (high)
- Dimension score: average of markers × 10
- Type threshold: 5.5

### Age Adjustment
- AMI: Peaks 25-44, steeper age decline
- CMI: Peaks 25-49, shallower decline

### DQ (Derived IQ) Mapping
```
IQ = 85 + (score/10) × 90
Range: DS2 0 → IQ ~85, DS2 10 → IQ ~175
```

---

## Status & Validation

DS2 is designed with psychometric principles:
- Content validity across 20 behavioral markers
- 5 question variants per marker for test-retest reliability
- Bayesian probability calculations for type classification
- Age-adjusted normative scoring

**Current status:** No formal validation has been conducted, and we are not actively seeking formal validation at this time. The model is operationally complete and available for use.

**Community validation:** If you wish to conduct validation research, you're welcome to do so. Please document your findings in the [project wiki](https://github.com/garrjo/dso-cognitive-model/wiki) so others can benefit from your work.

---

## License

MIT License

## Contributing

Areas of interest:
- Additional question variants
- Validation studies
- Localization/translations
- Accessibility improvements
