const app = require("./src/app");
const Analysis = require("./src/models/Analysis");
const processing = require("./src/services/processing");
const { getUserFromToken } = require("./src/utils/auth");
const supabase = require("./src/utils/supabaseClient");

module.exports = {
    app,
    Analysis,
    ...processing,
    getUserFromToken,
    supabase,
};

if (require.main === module) {
    require("./src/index");
}
