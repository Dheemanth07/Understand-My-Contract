# Configuration Overview
This document provides a detailed explanation of the configuration files used in this project, including TypeScript, Vite, ESLint, Tailwind CSS, and PostCSS.

## TypeScript Configuration
We use a multi-project setup for TypeScript to enforce different rules for source code and build tools.

- **`tsconfig.json`**: The base configuration for all frontend source code under `src/`. It includes strict type-checking rules and path alias definitions (`@/*` pointing to `./src/*`).
- **`tsconfig.app.json`**: An application-specific configuration that extends `tsconfig.json`. It is intended for use by editors and IDEs for a smoother development experience, potentially with slightly more relaxed rules if needed.
- **`tsconfig.node.json`**: This configuration is specifically for Node.js files used in our build process, such as `vite.config.ts` and scripts in the `scripts/` directory. It uses `module: CommonJS`.

## Vite Configuration
The `vite.config.ts` file configures our build tool, Vite. Key features include:
- **React SWC Plugin**: Uses `@vitejs/plugin-react-swc` for fast refresh and compilation.
- **Path Alias Resolution**: Configured to resolve the `@/*` path alias to match the TypeScript configuration.
- **Development-Only Tagger**: Includes a `lovable-tagger` plugin that only runs in development mode for debugging purposes.
- **Server Proxy**: (If configured) Proxies API requests to the backend server.

## ESLint Configuration
Our ESLint setup is defined in `eslint.config.js` and is designed to maintain code quality and consistency.
- **TypeScript Integration**: Uses `@typescript-eslint/parser` to lint TypeScript code.
- **React Rules**: Includes `eslint-plugin-react-hooks` to enforce rules of hooks and `eslint-plugin-react-refresh` for fast refresh compatibility.
- **Custom Rules**: Some rules, like `@typescript-eslint/no-unused-vars`, are disabled to avoid conflicts with developer workflows, but are generally enforced in CI.

## Tailwind CSS Configuration
The `tailwind.config.ts` file customizes the Tailwind CSS framework.
- **Content Paths**: Specifies the files that Tailwind should scan to purge unused styles in production.
- **Theme Extensions**:
  - **Colors**: Adds a custom palette for legal-themed UI elements and sidebar colors.
  - **Animations**: Defines custom keyframes and animations, such as `accordion-down` and `accordion-up`.
- **Plugins**: Utilizes `tailwindcss-animate` for animation utilities.

## PostCSS Configuration
The `postcss.config.js` file configures PostCSS, a tool for transforming CSS with JavaScript plugins.
- **`tailwindcss`**: Processes Tailwind's directives and functions.
- **`autoprefixer`**: Adds vendor prefixes to CSS rules for better browser compatibility.

## Environment Variables
Environment variables are crucial for configuring the application in different environments (dev, test, prod).
- **Frontend**: Variables are prefixed with `VITE_` and accessed via `import.meta.env`. See `.env.example` for a full list.
- **Backend**: Variables are loaded using `dotenv` and accessed via `process.env`. See `backend/.env.example` for details.

## Configuration Validation
To ensure all configuration files are correct and consistent, you can run validation scripts:
- `npm run validate:config`: Validates all configuration files (TypeScript, ESLint, Tailwind, etc.).
- `npm run validate:env`: Checks if all required environment variables are set for the specified environment.
- `npm run typecheck`: Runs the TypeScript compiler to check for type errors across the project.
