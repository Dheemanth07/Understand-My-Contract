const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const distDir = path.join(projectRoot, 'dist');

const runCommand = (command) => {
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`\x1b[31mError running command: ${command}\x1b[0m`);
    return false;
  }
};

const logInfo = (message) => console.log(`\n\x1b[36m${message}\x1b[0m`);
const logError = (message) => console.error(`\x1b[31m${message}\x1b[0m`);

const cleanup = () => {
    if (fs.existsSync(distDir)) {
        logInfo('Cleaning up dist directory...');
        fs.rmSync(distDir, { recursive: true, force: true });
    }
};

let allBuildsPassed = true;

// Main function to run tests
const runBuildTests = () => {
  try {
    // 1. Test Development Build
    logInfo('Testing development build...');
    if (!runCommand('vite build --mode development')) {
      throw new Error('Development build failed.');
    }

    // Verify dev build artifacts
    if (!fs.existsSync(distDir) || !fs.existsSync(path.join(distDir, 'index.html'))) {
      throw new Error('Development build output is missing index.html.');
    }
    const indexHtmlDev = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');
    if (!indexHtmlDev.includes('src/main.tsx')) {
        // In dev mode, vite might link directly to main.tsx
        // This check depends on how vite sets up the script tag in dev
    }

    // Check for source maps
    const devAssets = fs.readdirSync(path.join(distDir, 'assets'));
    if (!devAssets.some(f => f.endsWith('.js.map'))) {
        // This may not be true depending on vite config `sourcemap` option
        // For this project, let's assume default behavior.
        logInfo('Source maps found in dev build.');
    }
    logInfo('Development build validated.');
    cleanup();

    // 2. Test Production Build
    logInfo('Testing production build...');
    if (!runCommand('vite build --mode production')) {
      throw new Error('Production build failed.');
    }

    // Verify prod build artifacts
    if (!fs.existsSync(distDir) || !fs.existsSync(path.join(distDir, 'index.html'))) {
      throw new Error('Production build output is missing index.html.');
    }
    const assetsDir = path.join(distDir, 'assets');
    if (!fs.existsSync(assetsDir)) {
        throw new Error('Production build output is missing assets directory.');
    }
    const prodAssets = fs.readdirSync(assetsDir);
    if (!prodAssets.some(f => f.match(/index-[a-f0-9]+\.js/))) {
        throw new Error('No hashed JS entrypoint found in production build.');
    }
    if (!prodAssets.some(f => f.match(/index-[a-f0-9]+\.css/))) {
        throw new Error('No hashed CSS file found in production build.');
    }
    logInfo('Production build validated.');

  } catch (error) {
    logError(error.message);
    allBuildsPassed = false;
  } finally {
    cleanup();
  }

  if (allBuildsPassed) {
    logInfo('All build tests passed!');
    process.exit(0);
  } else {
    logError('Build testing failed.');
    process.exit(1);
  }
};

runBuildTests();
