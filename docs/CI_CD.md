# CI/CD Pipeline
This document describes the continuous integration and continuous deployment (CI/CD) pipeline for our project, which is managed using GitHub Actions.

## Overview
The primary goal of our CI/CD pipeline is to automate the process of testing, building, and deploying the application to ensure code quality and a streamlined release process. The workflow is defined in the `.github/workflows/ci.yml` file.

## Workflow Jobs
Our pipeline consists of several sequential and parallel jobs:

1.  **`validate-configs`**:
    *   **Description**: Checks all project configuration files for correctness, including TypeScript, ESLint, Tailwind CSS, and environment variables.
    *   **Runs**: On every push and pull request.

2.  **`lint-and-typecheck`**:
    *   **Description**: Runs ESLint to check for code style issues and the TypeScript compiler (`tsc --noEmit`) to check for type errors.
    *   **Depends on**: `validate-configs`.

3.  **`frontend-unit-tests`**:
    *   **Description**: Executes the Jest unit test suite for the frontend and uploads the coverage report to Codecov.
    *   **Depends on**: `lint-and-typecheck`.

4.  **`backend-unit-tests`**:
    *   **Description**: Executes the Jest unit test suite for the backend and uploads its coverage report.
    *   **Depends on**: `lint-and-typecheck`.

5.  **`build-tests`**:
    *   **Description**: Validates the Vite build process in both development and production modes to catch any build-related issues.
    *   **Depends on**: `lint-and-typecheck`.

6.  **`e2e-tests`**:
    *   **Description**: Runs the Playwright end-to-end test suite across multiple browsers (Chromium, Firefox, WebKit) to verify full user workflows.
    *   **Depends on**: `frontend-unit-tests`, `backend-unit-tests`, `build-tests`.

7.  **`deploy` (Optional)**:
    *   **Description**: A placeholder job for deploying the application to a hosting environment.
    *   **Trigger**: Only runs on a push to the `main` branch after all preceding jobs have passed. This job needs to be fully implemented with deployment credentials and scripts.

## Triggers
The workflow is automatically triggered on:
-   A **push** to the `main` or `develop` branches.
-   A **pull request** targeting the `main` or `develop` branches.

## Secrets Configuration
The CI/CD pipeline requires several secrets to be configured in your GitHub repository settings (`Settings > Secrets and variables > Actions`):
-   `VITE_SUPABASE_URL`: The URL for your Supabase project.
-   `VITE_SUPABASE_ANON_KEY`: The public anonymous key for your Supabase project.
-   `SUPABASE_URL`: The Supabase project URL for backend use.
-   `SUPABASE_SERVICE_ROLE_KEY`: The secret service role key for backend authentication.
-   `HUGGINGFACE_API_KEY`: Your API key for the Hugging Face service.
-   `MONGODB_URI_TEST`: The connection string for the test MongoDB database.
-   `CODECOV_TOKEN`: Your token for uploading coverage reports to Codecov.

## Coverage Reporting
We enforce a 70% test coverage minimum for both frontend and backend code, as specified in the Jest configurations. Coverage reports are generated during the unit test jobs and uploaded to Codecov for tracking and visualization. If coverage drops below the threshold, the corresponding test job will fail.

## Artifacts
The pipeline produces several artifacts:
-   **Coverage Reports**: Uploaded to Codecov.
-   **Playwright Test Reports**: On failed E2E tests, reports, videos, and traces are uploaded as artifacts to help with debugging. You can find these in the "Summary" page of a completed workflow run.

## Troubleshooting
-   **Failing Tests**: Check the logs of the failed job for details. For E2E tests, download and inspect the Playwright report artifact.
-   **Environment Variable Issues**: Ensure all required secrets are correctly configured in your repository settings. The `validate-configs` job should catch missing variables.
-   **Build Errors**: The `build-tests` job will fail if there's an issue with the Vite build process. Check the job logs for compiler errors.

## Local CI Simulation
You can run most of the CI checks locally before pushing your code to save time:
-   `npm run ci`: Runs configuration validation, type-checking, linting, unit tests, and build tests for the frontend.
-   `npm run ci --prefix backend`: Runs validation and unit tests for the backend.
