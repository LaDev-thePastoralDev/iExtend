const server = require("./lib/server");
const database = require("./database/index");
// Declare the app
const app = {};

// Init the function
app.init = function() {
  // Start the server
  server.init();

  // Connect to database
  database.init();
};

// Execute
app.init();

// Export the app
module.exports = app;
