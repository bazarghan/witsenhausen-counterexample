/**
 * Chart Constants
 * 
 * This file contains configuration constants for the charts in the application.
 * You can adjust x_lim and y_lim here.
 */

export const CHART_CONFIG = {
    // 1. Control Strategies Comparison Chart
    STRATEGIES: {
        X_RANGE_MULTIPLIER: 2.5, // Range = [-sigma * multiplier, +sigma * multiplier]
        Y_DOMAIN: ['auto', 'auto'], // ['dataMin', 'dataMax'] or specific numbers
    },

    // 2. Cost vs Initial Variance (Sigma) Chart
    COST_VS_SIGMA: {
        X_MIN: 0.5,
        X_MAX: 10,
        X_STEP: 0.5,
        Y_DOMAIN: ['auto', 'auto'],
    },

    // 3. Cost vs Weight (k) Chart
    COST_VS_K: {
        X_MIN: 0.01,
        X_MAX: 0.5,
        X_STEP: 0.01,
        Y_DOMAIN: ['auto', 'auto'],
    }
};
