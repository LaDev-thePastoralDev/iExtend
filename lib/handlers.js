const helpers = require("./helpers");
const _database = require("../database/index");

//Define the handlers
const handlers = {};

// Acceptable methods
let acceptableMethods = ["get", "post", "put", "delete"];

// index handler
handlers.index = function(data, callback) {
  // Reject any request that isn't a GET
  if (data.method == `get`) {
    // Prepare data for interpolation
    let templateData = {
      "head.title": "Home"
    };

    // Read in a template as a string
    helpers.getTemplate("index", templateData, function(err, str) {
      if (!err && str) {
        // Add the universal header and footer
        helpers.addUniversalTemplates(str, templateData, function(err, str) {
          if (!err && str) {
            // Return that page as HTML
            callback(200, str, "html");
          } else {
            callback(500, undefined, "html");
          }
        });
      } else {
        callback(500, undefined, `html`);
      }
    });
  } else {
    callback(405, undefined, `html`);
  }
};

// contact-us handler
handlers.contact_us = (data, callback) => {
  if (data.method === "get") {
    const templateData = {
      "head.title": "Contact us"
    };

    helpers.getTemplate("contact-us", templateData, (err, str) => {
      if (!err && str) {
        helpers.addUniversalTemplates(str, templateData, (err, str) => {
          if (!err && str) {
            callback(200, str, "html");
          } else {
            callback(500, undefined, "html");
          }
        });
      } else {
        callback(404, undefined, "html");
      }
    });
  } else {
    callback(405, undefined, "html");
  }
};

// team page handler
handlers.team = (data, callback) => {
  if (data.method === "get") {
    let templateData = {
      "head.title": "The Team"
    };

    helpers.getTemplate("team", templateData, (err, str) => {
      if (!err && str) {
        helpers.addUniversalTemplates(str, templateData, (err, str) => {
          if (!err && str) {
            callback(200, str, "html");
          } else {
            callback(500, undefined, "html");
          }
        });
      } else {
        callback(404, undefined, "html");
      }
    });
  } else {
    callback(405, undefined, "html");
  }
};

// Public assets
handlers.public = function(data, callback) {
  // Reject any request that isn't a GET
  if (data.method == `get`) {
    // Get the filename being requisted
    let trimmedAssetName = data.trimmedPath.replace(`public/`, ``).trim();
    if (trimmedAssetName.length > 0) {
      // Read in the asset's data
      helpers.getStaticAsset(trimmedAssetName, function(err, data) {
        if (!err && data) {
          // Determine the content type(default to plain text)
          let contentType = `plain`;

          if (trimmedAssetName.indexOf(".css") > -1) {
            contentType = `css`;
          }

          if (trimmedAssetName.indexOf(".png") > -1) {
            contentType = `png`;
          }

          if (trimmedAssetName.indexOf(".jpg") > -1) {
            contentType = `jpg`;
          }

          if (trimmedAssetName.indexOf(".ico") > -1) {
            contentType = `favicon`;
          }

          // Callback the data
          callback(200, data, contentType);
        } else {
          callback(404);
        }
      });
    } else {
      callback(404);
    }
  } else {
    callback(405);
  }
};

// JSON Handlers
handlers.feedback = (data, callback) => {
  if (acceptableMethods.includes(data.method)) {
    handlers._feedback[data.method](data, callback);
  } else {
    callback(405);
  }
};

handlers._feedback = {};

handlers._feedback.post = (data, callback) => {
  // Get feedback details
  const fullName =
    typeof data.payload.name === "string" && data.payload.name.trim().length > 0
      ? data.payload.name.trim()
      : false;

  const email =
    typeof data.payload.email === "string" &&
    data.payload.email.includes("@") &&
    data.payload.email.includes(".")
      ? data.payload.email.trim()
      : false;

  const message =
    typeof data.payload.message === "string" &&
    data.payload.message.trim().length > 0
      ? data.payload.message.trim()
      : false;

  if (fullName && email && message) {
    const feedbackObject = {
      fullName: fullName,
      email: email,
      message: message
    };

    _database.create(feedbackObject, result => {
      if (result) {
        callback(200);
      } else {
        callback(500, { Error: "Error while saving message" });
      }
    });
  } else {
    callback(400, { Error: "Required field(s) missing" });
  }
};

handlers._feedback.get = (data, callback) => {
  const email =
    typeof data.queryStringObject.email === "string" &&
    data.queryStringObject.email.includes("@") &&
    data.queryStringObject.email.includes(".")
      ? data.queryStringObject.email.trim()
      : false;

  _database.read(email, (err, data) => {
    if (!err && data) {
      console.log(data);
      callback(200, data);
    } else {
      callback(500, { Error: "Error retrieving feedback details" });
    }
  });
};

// handlers._feedback.get = () => {
//   _database.read();
// };
module.exports = handlers;
