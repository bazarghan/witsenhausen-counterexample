/**
 * Math Utilities for Witsenhausen Counterexample Demo
 * 
 * This file contains all the mathematical logic for calculating costs associated with
 * Linear (Affine) and Nonlinear (Signaling) control strategies.
 */

// --- NUMERICAL INTEGRATION ---

/**
 * Numerical Integration using Simpson's Rule.
 * Used to approximate integrals where analytical solutions are difficult.
 * 
 * @param func The function to integrate.
 * @param min Lower bound of integration.
 * @param max Upper bound of integration.
 * @param n Number of intervals (must be even, but code handles odd by checking i%2).
 */
export const integrate = (func: (x: number) => number, min: number, max: number, n: number = 100): number => {
    const h = (max - min) / n;
    let sum = func(min) + func(max);
    for (let i = 1; i < n; i++) {
        const x = min + i * h;
        sum += func(x) * (i % 2 === 0 ? 2 : 4);
    }
    return (sum * h) / 3;
};

// --- NONLINEAR CONTROLLER MATH ---

/**
 * Calculates the function h(a) from Witsenhausen's paper (Section 5).
 * This term relates to the expected cost of the second stage when the first controller
 * uses a quantization strategy (forcing state to +/- sigma).
 * 
 * Formula: h(a) = a^2 * exp(-a^2/2) * integral_{-inf}^{+inf} (exp(-y^2/2) / cosh(ay)) dy
 * 
 * @param a The parameter related to sigma (initial variance).
 */
export const calculateH = (a: number): number => {
    if (a === 0) return 0; // Limit case

    const integrand = (y: number) => Math.exp(-0.5 * y * y) / Math.cosh(a * y);
    // Integrate from -10 to 10 covers the Gaussian support sufficiently for standard normal
    const integralVal = integrate(integrand, -10, 10, 200);

    return a * a * Math.exp(-0.5 * a * a) * integralVal;
};

// --- LINEAR CONTROLLER MATH ---

/**
 * Solves for the optimal Affine coefficient (lambda) for the Linear Strategy.
 * 
 * The optimal linear strategy u1(x) = lambda * x.
 * We solve for lambda using the equation derived from minimizing the cost function.
 * Equation: (t - sigma)(1 + t^2)^2 + t/k^2 = 0, where t = sigma * lambda.
 * 
 * @param k The cost weight parameter.
 * @param sigma The initial variance parameter.
 * @returns The optimal lambda.
 */
export const solveAffineLambda = (k: number, sigma: number): number => {
    const f = (t: number) => (t - sigma) * Math.pow(1 + t * t, 2) + t / (k * k);

    // Bisection method to find the root
    let low = 0;
    let high = sigma;
    let iter = 0;
    let mid = 0;

    // Refine bounds if needed (though root is usually between 0 and sigma)
    if (f(low) * f(high) > 0) return 0; // Fallback

    while (iter < 100) {
        mid = (low + high) / 2;
        if (Math.abs(f(mid)) < 1e-6) break;
        if (f(low) * f(mid) < 0) high = mid;
        else low = mid;
        iter++;
    }
    return mid / sigma; // return lambda
};

// --- LOWER BOUND CALCULATIONS (Theorem 3) ---

// Standard Normal PDF (helper for the outer integral)
const phi = (x: number) => (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);

/**
 * Golden Section Search to find the minimum of a unimodal function.
 * Used to find min_a [ k^2(a - xi)^2 + h(a) ]
 */
const goldenSectionSearch = (f: (x: number) => number, a: number, b: number, tol: number = 1e-4): number => {
    const GR = (Math.sqrt(5) - 1) / 2; // Golden Ratio
    let c = b - GR * (b - a);
    let d = a + GR * (b - a);

    while (Math.abs(b - a) > tol) {
        if (f(c) < f(d)) {
            b = d;
        } else {
            a = c;
        }
        c = b - GR * (b - a);
        d = a + GR * (b - a);
    }
    return (b + a) / 2;
};

/**
 * Calculates Vk(xi) defined in Lemma 15.
 * Vk(xi) = min_a [ k^2(a - xi)^2 + h(a) ]
 * * This represents the minimum cost if the state was exactly xi.
 */
const calculateVk = (xi: number, k: number): number => {
    // The cost function to minimize for a specific xi
    const costFunc = (a: number) => {
        // Optimization: h(a) is symmetric, so h(a) = h(-a). 
        // We calculate h(a) using the existing function.
        return (k * k * Math.pow(a - xi, 2)) + calculateH(a);
    };

    // We search for 'a' in a reasonable range around xi.
    // Since h(a) grows, 'a' usually pulls somewhat towards 0 but stays near xi.
    // Range [-20, 20] covers practical Witsenhausen parameters.
    const optimalA = goldenSectionSearch(costFunc, -20, 20);

    return costFunc(optimalA);
};

/**
 * Calculates the Lower Bound J* from Theorem 3.
 * J* >= E[ Vk(xi) ] where xi ~ N(0, sigma^2)
 * * Integral: (1/sigma) * integral_{-inf}^{+inf} phi(xi/sigma) * Vk(xi) dxi
 */
export const calculateLowerBound = (k: number, sigma: number): number => {
    // We use the substitution z = xi / sigma to simplify the integral limits.
    // J* >= integral_{-inf}^{+inf} phi(z) * Vk(sigma * z) dz

    const integrand = (z: number) => {
        return phi(z) * calculateVk(sigma * z, k);
    };

    // Integrate z from -5 to 5 (captures >99.999% of Gaussian mass)
    // Note: Vk is computationally expensive, so we use fewer steps (e.g., 40)
    // or exploit symmetry: Integrand is even because phi(z) is even and Vk(z) is effectively symmetric in distribution.
    // So we calculate 2 * integral_0^5

    return 2 * integrate(integrand, 0, 5, 50);
};

// --- COST CALCULATIONS ---

/**
 * Calculates the total expected costs for both strategies given parameters k and sigma.
 * 
 * @param k Cost weight (energy penalty).
 * @param sigma Initial state variance.
 */
export const calculateCosts = (k: number, sigma: number) => {
    // 1. Affine Cost (Linear Strategy)
    // Cost = E[k^2 * u^2 + (x - u - v)^2]
    // For linear u = lambda * x, this simplifies to the expression below.
    const lambda = solveAffineLambda(k, sigma);
    const affineCost = (k * k * sigma * sigma * Math.pow(1 - lambda, 2)) +
        (sigma * sigma * lambda * lambda) / (1 + sigma * sigma * lambda * lambda);

    // 2. Nonlinear Cost (Witsenhausen's Sign Strategy)
    // Strategy: u(x) = sigma * sgn(x) - x
    // This forces the state to be exactly +sigma or -sigma.
    // The cost is composed of the energy cost (First Term) and the remaining estimation error (Second Term).
    const firstTerm = 2 * k * k * sigma * sigma * (1 - Math.sqrt(2 / Math.PI));
    const secondTerm = calculateH(sigma);
    const nonlinCost = firstTerm + secondTerm;

    // 3. Lower Bound (Theorem 3)
    const lowerBound = calculateLowerBound(k, sigma);

    return {
        lambda,
        affineCost,
        nonlinCost,
        lowerBound
    };
};