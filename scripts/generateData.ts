
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { calculateCosts } from '../src/mathUtils';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define ranges matching the App's sliders
// K: 0.01 to 1.0, step 0.01
const K_MIN = 0.01;
const K_MAX = 1.0;
const K_STEP = 0.01;

// Sigma: 0.5 to 10.0, step 0.1
const SIGMA_MIN = 0.5;
const SIGMA_MAX = 10.0;
const SIGMA_STEP = 0.1;

// Helper to fix floating point issues
const toFixed = (n: number) => parseFloat(n.toFixed(2));

const generate = () => {
    console.log('Starting data generation...');
    console.log(`K Range: ${K_MIN} - ${K_MAX} (step ${K_STEP})`);
    console.log(`Sigma Range: ${SIGMA_MIN} - ${SIGMA_MAX} (step ${SIGMA_STEP})`);

    const kValues: number[] = [];
    for (let k = K_MIN; k <= K_MAX + K_STEP / 2; k += K_STEP) {
        kValues.push(toFixed(k));
    }

    const sigmaValues: number[] = [];
    for (let s = SIGMA_MIN; s <= SIGMA_MAX + SIGMA_STEP / 2; s += SIGMA_STEP) {
        sigmaValues.push(toFixed(s));
    }

    console.log(`Total K points: ${kValues.length}`);
    console.log(`Total Sigma points: ${sigmaValues.length}`);
    console.log(`Total calculations: ${kValues.length * sigmaValues.length}`);

    // 2D Grid: costs[kIndex][sigmaIndex]
    const costsGrid: any[][] = [];

    for (let i = 0; i < kValues.length; i++) {
        const k = kValues[i];
        const row: any[] = [];

        if (i % 10 === 0) {
            console.log(`Processing K = ${k} (${Math.round(i / kValues.length * 100)}%)`);
        }

        for (let j = 0; j < sigmaValues.length; j++) {
            const sigma = sigmaValues[j];
            const result = calculateCosts(k, sigma);
            row.push({
                affineCost: parseFloat(result.affineCost.toFixed(6)),
                nonlinCost: parseFloat(result.nonlinCost.toFixed(6)),
                lowerBound: parseFloat(result.lowerBound.toFixed(6)),
                lambda: parseFloat(result.lambda.toFixed(6))
            });
        }
        costsGrid.push(row);
    }

    const output = {
        metadata: {
            k: { min: K_MIN, max: K_MAX, step: K_STEP, values: kValues },
            sigma: { min: SIGMA_MIN, max: SIGMA_MAX, step: SIGMA_STEP, values: sigmaValues }
        },
        data: costsGrid
    };

    const outputDir = path.join(__dirname, '../src/data');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, 'costs.json');
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

    console.log(`Data generated successfully at ${outputPath}`);
};

generate();
