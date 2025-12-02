# Witsenhausen Counterexample Demo

**Made by Alireza Bazargan - December 1**

An interactive demonstration of the Witsenhausen Counterexample in stochastic optimal control. This project visualizes the cost functions of Linear (Affine) vs. Nonlinear (Signaling) control strategies, highlighting the non-convex nature of the problem where a nonlinear strategy can outperform the optimal linear strategy.

## Reference

This project is built according to the seminal paper:

> **H. S. Witsenhausen**, "A Counterexample in Stochastic Optimum Control," *SIAM Journal on Control*, Vol. 6, No. 1, pp. 131-147, 1968.

## Features

-   **Interactive Parameters**: Adjust the cost weight ($k$) and initial variance ($\sigma$) to see how they affect the optimal strategies.
-   **Real-time Visualization**:
    -   **Control Strategies**: Compare the optimal affine function $f(x) = \lambda x$ with Witsenhausen's step function $f(x) = \sigma \cdot \text{sgn}(x)$.
    -   **Cost Analysis**: View how costs change with respect to $\sigma$ and $k$.
    -   **Theoretical Lower Bound**: Includes the theoretical lower bound derived in Theorem 3.
-   **Performance Optimization**: Uses pre-calculated data for smooth interaction.

## Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/bazarghan/witsenhausen-counterexample
    cd witsenhausen-demo
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

## Running the Project

To start the development server:

```bash
npm run dev
```

Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173`).

## Building for Production

To build the project for production:

```bash
npm run build
```

The output will be in the `dist` directory.

## Project Structure

-   `src/App.tsx`: Main application component and UI logic.
-   `src/mathUtils.ts`: Mathematical functions for cost calculations (integration, optimization).
-   `src/constants.tsx`: Configuration for chart limits and ranges.
-   `src/data/costs.json`: Pre-calculated cost data for performance.
-   `scripts/generateData.ts`: Script to generate the cost data.

## License

[MIT](LICENSE)
