const tsJest = require('ts-jest').default || require('ts-jest');
const { createTransformer } = tsJest;

const tsJestTransformer = createTransformer({
  tsconfig: {
    jsx: 'react-jsx',
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
  },
  isolatedModules: true,
});

module.exports = {
  process(sourceText, sourcePath, options) {
    let code = sourceText;
    if (code.includes('import.meta.env')) {
      code = code.replace(/import\.meta\.env/g, 'process.env');
    }
    return tsJestTransformer.process(code, sourcePath, options);
  },
};
