const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();

const logError = (message) => console.error(`\x1b[31m${message}\x1b[0m`);
const logInfo = (message) => console.log(`\x1b[36m${message}\x1b[0m`);

const requiredVars = {
  dev: {
    frontend: ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'],
    backend: ['MONGODB_URI', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'HUGGINGFACE_API_KEY'],
  },
  test: {
    frontend: ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'],
    backend: ['MONGODB_URI_TEST', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
  },
  prod: {
    frontend: ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_BACKEND_URL'],
    backend: ['MONGODB_URI', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'HUGGINGFACE_API_KEY'],
  }
};

const optionalVars = {
    dev: {
        frontend: { VITE_BACKEND_URL: 'http://localhost:5000' },
        backend: { PORT: 5000 },
    },
    test: {
        frontend: { PLAYWRIGHT_TEST_BASE_URL: 'http://localhost:5173' },
        backend: {}
    },
    prod: {
        backend: { PORT: 5000 }
    }
}

function validateEnv(env, component) {
  const envFile = component === 'frontend' ? `.env` : `backend/.env`;
  if (!fs.existsSync(path.join(projectRoot, envFile))) {
    logError(`Error: ${envFile} file not found. Please create it. You can use ${envFile}.example as a template.`);
    return false;
  }
  
  require('dotenv').config({ path: path.join(projectRoot, envFile) });

  let allVarsPresent = true;
  const missingVars = [];

  const varsToCkeck = requiredVars[env][component];

  varsToCkeck.forEach(v => {
    if (!process.env[v] || process.env[v] === '') {
      allVarsPresent = false;
      missingVars.push(v);
    }
  });

  if (!allVarsPresent) {
    logError(`Error: Missing required environment variables for ${component} in '${env}' environment:`);
    missingVars.forEach(v => console.error(`- ${v}`));
    return false;
  }
  
  logInfo(`All required environment variables for ${component} in '${env}' are present.`);
  return true;
}


function generateExample(component) {
    const env = 'dev'; // Examples are usually for dev
    const vars = requiredVars[env][component];
    const optional = optionalVars[env][component];
    let content = `# This is an example .env file. 
# Copy this to .env and fill in your actual values.

`;

    content += `# Required variables
`;
    vars.forEach(v => {
        content += `${v}=
`;
    });

    content += `
# Optional variables with defaults
`;
    Object.keys(optional).forEach(v => {
        content += `# ${v}=${optional[v]}
`;
    });

    const filePath = component === 'frontend' ? `.env.example` : `backend/.env.example`;
    fs.writeFileSync(path.join(projectRoot, filePath), content);
    logInfo(`Generated ${filePath}`);
}


const args = process.argv.slice(2);
const envFlagIndex = args.indexOf('--env');
let env = 'dev';

if (envFlagIndex !== -1 && args[envFlagIndex + 1]) {
  env = args[envFlagIndex + 1];
}

const generateFlag = args.includes('--generate-examples');

if (generateFlag) {
    generateExample('frontend');
    generateExample('backend');
    process.exit(0);
}


let feValid = true;
let beValid = true;

if (env === 'dev' || env === 'test' || env === 'prod') {
    feValid = validateEnv(env, 'frontend');
    beValid = validateEnv(env, 'backend');
} else if (env === 'backend') {
    beValid = validateEnv('dev', 'backend');
} else if (env === 'backend-test') {
    beValid = validateEnv('test', 'backend');
} else {
    logError(`Invalid environment '${env}'. Use 'dev', 'test', 'prod', 'backend', or 'backend-test'.`);
    process.exit(1);
}


if (!feValid || !beValid) {
  process.exit(1);
} else {
  logInfo('All environment checks passed.');
  process.exit(0);
}
