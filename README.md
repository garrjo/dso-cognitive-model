# DS2 - Dual-Structure Intelligence Assessment

A behavioral marker assessment tool that evaluates cognitive architecture across two complementary dimensions: **Analytical Mechanics Intelligence (AMI)** and **Conceptual Morphogenesis Intelligence (CMI)**.

## Live Demo

**[Take the Assessment](https://yourusername.github.io/ds2-assessment/)**

## Overview

DS2 maps your cognitive profile onto a dual-axis framework:

### AMI (Analytical Mechanics Intelligence)
- Symbolic consistency detection
- Multi-variable manipulation
- First-principles derivation
- Boundary condition checking
- Formal proof construction
- Algorithmic decomposition
- Error propagation tracing
- Symmetry exploitation
- Logical consistency detection
- Quantitative estimation

### CMI (Conceptual Morphogenesis Intelligence)
- Ontology generation
- Reference frame shifting
- Paradox tolerance
- Concept compression
- Analogical transfer
- Emergence recognition
- Abstraction level fluidity
- Generative metaphor
- Conceptual boundary dissolution
- Problem space transformation

## Four DSS Classifications

Based on your AMI and CMI scores, you're classified into one of four cognitive architectures:

| Type | Name | Description |
|------|------|-------------|
| **DSS-I** | Systematic Analytical | High AMI, lower CMI. Excels at formal analysis, proofs, and structured problem-solving. |
| **DSS-II** | Creative Conceptual | High CMI, lower AMI. Excels at paradigm shifts, novel frameworks, and cross-domain insight. |
| **DSS-III** | Integrated Polymathic | High AMI and CMI. Rare integration enabling rigorous creativity and creative rigor. |
| **DSS-IV** | Developing Foundational | Moderate scores in both. Flexible foundation with growth potential in either direction. |

## Features

- **20 behavioral marker questions** (~5 minutes to complete)
- **Random question selection** from a pool of 100 variants for test-retest reliability
- **Age-adjusted scoring** accounting for cognitive development patterns
- **Derived IQ (DQ) estimate** with floor/ceiling range
- **Type probability distribution** showing confidence across all four classifications
- **Compatibility matrix** for understanding cognitive synergies
- **Domain fit recommendations** for career and collaboration
- **Light/Dark theme toggle**
- **JSON export** of your full profile

## How It Works

1. Answer 20 self-report behavioral questions
2. Questions probe specific cognitive markers (10 AMI, 10 CMI)
3. Scores aggregate into dimensional totals (0-10 scale)
4. Age adjustment applies normative corrections
5. Classification determined by score thresholds and dominance patterns
6. Results include detailed interpretation and growth vectors

## Deployment

### GitHub Pages

1. Fork this repository
2. Go to Settings > Pages
3. Set source to "Deploy from a branch"
4. Select `main` branch and `/ (root)` folder
5. Your assessment will be live at `https://yourusername.github.io/ds2-assessment/`

### Local Development

```bash
# Clone the repo
git clone https://github.com/yourusername/ds2-assessment.git
cd ds2-assessment

# Serve locally (any static server works)
python -m http.server 8080
# or
npx serve .
```

Open `http://localhost:8080` in your browser.

## File Structure

```
ds2-assessment/
├── index.html      # Main application
├── styles.css      # Styling with light/dark theme support
├── app.js          # Assessment logic and scoring
├── questions.json  # Question pool (100 questions, 5 variants per marker)
└── README.md       # This file
```

## Scoring Model

### Raw Scores
- Each question yields a score from 0.1 (lowest) to 1.0 (highest)
- AMI and CMI are averages of their respective marker scores, scaled to 0-10

### Age Adjustment
- AMI peaks 25-44, with steeper age-related decline
- CMI peaks 25-49, with shallower decline
- Adjustments add a "handicap" to account for age-related factors

### DQ (Derived IQ)
- Maps the DS2 profile to an estimated IQ range
- Formula: `IQ = 85 + (score/10) * 90`
- Provides floor (lower dimension), ceiling (higher dimension), and nominal (average)

## Limitations

This is a **self-report behavioral assessment**, not a psychometric instrument. Results should be interpreted as:

- A framework for understanding cognitive preferences
- A starting point for reflection on strengths and growth areas
- A conversation tool, not a definitive measurement

The assessment has not been formally validated. Treat results as directional rather than precise.

## License

MIT License - feel free to use, modify, and share.

## Contributing

Contributions welcome! Areas of interest:
- Additional question variants
- Validation studies
- Localization/translations
- Accessibility improvements
- Mobile responsiveness refinements

## Acknowledgments

DS2 draws inspiration from multiple cognitive frameworks including:
- Dual-process theories of cognition
- Multiple intelligences research
- Cognitive style assessments
- Systems thinking models
