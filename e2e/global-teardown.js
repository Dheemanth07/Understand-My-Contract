const fs = require('fs');
const path = require('path');

module.exports = async () => {
  try {
    const marker = path.resolve(process.cwd(), 'e2e', '.e2e-backend');
    if (fs.existsSync(marker)) {
      fs.unlinkSync(marker);
    }

    if (global.__E2E_BACKEND_SERVER__) {
      try {
        global.__E2E_BACKEND_SERVER__.close();
      } catch (e) {
        // ignore
      }
    }
  } catch (err) {
    console.warn('Error in E2E global teardown', err);
  }
};
