const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();

const runCommand = (command, options = {}) => {
  try {
    execSync(command, { stdio: 'inherit', ...options });
    return true;
  } catch (error) {
    console.error(`Error running command: ${command}`);
    return false;
  }
};

const log = (message) => console.log(`\n${message}`);

let allValid = true;

// 1. TypeScript Validation
log('Validating TypeScript configurations...');
const tsConfigs = ['tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json'];
tsConfigs.forEach((configFile) => {
  if (fs.existsSync(path.join(projectRoot, configFile))) {
    if (!runCommand(`tsc --noEmit --project ${configFile}`)) {
      allValid = false;
    }
  } else {
    console.warn(`Warning: ${configFile} not found. Skipping validation.`);
  }
});

// 2. Path Alias Verification
log('Verifying path aliases...');
const viteConfigPath = path.join(projectRoot, 'vite.config.ts');
const tsConfigPath = path.join(projectRoot, 'tsconfig.json');
if (fs.existsSync(viteConfigPath) && fs.existsSync(tsConfigPath)) {
  const viteConfigContent = fs.readFileSync(viteConfigPath, 'utf-8');
  const tsConfigContent = fs.readFileSync(tsConfigPath, 'utf-8');

  // A bit simplistic, but good enough for this project's convention.
  const viteAlias = /@\/\*":\s*".\/src\/\*/.test(viteConfigContent);
  const tsAlias = /"@\/\*":\s*\[".\/src\/"\ Integration]/).test(tsConfigContent.replace(/\s/g, ''));

  if (!viteAlias || !tsAlias) {
    console.error('Error: Path alias "@/*" is not consistently configured in vite.config.ts and tsconfig.json.');
    allValid = false;
  } else {
    console.log('Path aliases are consistent.');
  }
}

// 3. ESLint Configuration Check
log('Validating ESLint configuration...');
if (!runCommand('eslint --print-config src/main.tsx > /dev/null')) {
  allValid = false;
}

// 4. Tailwind CSS Validation
log('Validating Tailwind CSS configuration...');
const tailwindConfigPath = path.join(projectRoot, 'tailwind.config.ts');
if (fs.existsSync(tailwindConfigPath)) {
  const tailwindConfig = require(tailwindConfigPath);
  if (!tailwindConfig.content || tailwindConfig.content.length === 0) {
    console.error('Error: tailwind.config.ts `content` array is empty.');
    allValid = false;
  } else {
    tailwindConfig.content.forEach(p => {
        // Simple check, can be improved with glob
        if (p.includes('*')) {
            const dir = p.substring(0, p.indexOf('*'));
            if (!fs.existsSync(path.join(projectRoot, dir))) {
                console.error(`Error: Tailwind content path does not exist: ${dir}`);
                allValid = false;
            }
        }
    });
  }
} else {
  console.warn('Warning: tailwind.config.ts not found. Skipping validation.');
}

// 5. PostCSS Validation
log('Validating PostCSS configuration...');
const postcssConfigPath = path.join(projectRoot, 'postcss.config.js');
if (fs.existsSync(postcssConfigPath)) {
  try {
    require(postcssConfigPath);
  } catch (error) {
    console.error('Error loading postcss.config.js:', error);
    allValid = false;
  }
  // Check for plugins
  const packageJson = require(path.join(projectRoot, 'package.json'));
  const requiredPlugins = ['tailwindcss', 'autoprefixer'];
  requiredPlugins.forEach(plugin => {
    if (!packageJson.devDependencies[plugin] && !packageJson.dependencies[plugin]) {
      console.error(`Error: PostCSS plugin "${plugin}" is not installed.`);
      allValid = false;
    }
  });
} else {
  console.warn('Warning: postcss.config.js not found. Skipping validation.');
}

// Final Exit
if (allValid) {
  log('All configuration files are valid.');
  process.exit(0);
} else {
  log('Configuration validation failed.');
  process.exit(1);
}
