const http = require("http");
const https = require(`https`);
const fs = require(`fs`);
const path = require("path");
const url = require("url");
const handlers = require("./handlers");
const helpers = require("./helpers");
const util = require("util");
const debug = util.debuglog("server");
const config = require("./config");
const { StringDecoder } = require("string_decoder");

// instantiate server object
const server = {};

server.httpServer = http.createServer((req, res) => {
  server.unifiedServer(req, res);
});

// https server required properties
server.httpsServerOptions = {
  key: fs.readFileSync(path.join(__dirname, `/../https/key.pem`)),
  cert: fs.readFileSync(path.join(__dirname, `/../https/cert.pem`))
};

//Instatiating the HTTPS server
server.httpsServer = https.createServer(server.httpsServerOptions, function(
  req,
  res
) {
  server.unifiedServer(req, res);
});

server.unifiedServer = (req, res) => {
  // parsed url
  const parsedUrl = url.parse(req.url, true);

  // path
  const pathname = parsedUrl.pathname;
  const trimmedPath = pathname.replace(/^\/+|\/+$/g, "");

  // method
  const method = req.method.toLowerCase();

  // queryStringObject
  const queryStringObject = parsedUrl.query;

  // headers
  const headers = req.headers;

  // payload
  const decoder = new StringDecoder("utf-8");
  let buffer = "";
  req.on("data", data => {
    buffer += decoder.write(data);
  });

  req.on("end", () => {
    buffer += decoder.end();

    // choose the handler
    let chosenHandler =
      typeof server.router[trimmedPath] !== "undefined"
        ? server.router[trimmedPath]
        : handlers.notFound;

    // If the request is within the public directory, use the public handler instead
    chosenHandler =
      trimmedPath.indexOf("public/") > -1 ? handlers.public : chosenHandler;

    // data object to send to the handler
    const dataObject = {
      trimmedPath: trimmedPath,
      method: method,
      headers: headers,
      queryStringObject: queryStringObject,
      payload: helpers.parseJsonToObject(buffer)
    };

    try {
      chosenHandler(dataObject, (statusCode, payload, contentType) => {
        server.processHandlerResponse(
          res,
          method,
          trimmedPath,
          statusCode,
          payload,
          contentType
        );
      });
    } catch (error) {
      debug(error);
      server.processHandlerResponse(
        res,
        method,
        trimmedPath,
        500,
        {
          Error: "An uknown error has occurred"
        },
        "json"
      );
    }
  });
};

// Process the response from the handler
server.processHandlerResponse = (
  res,
  method,
  trimmedPath,
  statusCode,
  payload,
  contentType
) => {
  // Determine the type of response(fallback to JSON)
  contentType = typeof contentType == "string" ? contentType : "json";

  //Use the status code called back by the handler or default to 200
  statusCode = typeof statusCode == `number` ? statusCode : 200;

  //Return the response that are content-specific
  let payloadString = "";
  if (contentType == "json") {
    res.setHeader(`Content-Type`, `application/json`);
    //Use the payload called back by the handler or default to an empty object
    payload = typeof payload == `object` ? payload : {};
    //Convert the payload to a string
    payloadString = JSON.stringify(payload);
  }

  if (contentType == "html") {
    res.setHeader(`Content-Type`, `text/html`);
    payloadString = typeof payload == `string` ? payload : ``;
  }

  if (contentType == "favicon") {
    res.setHeader(`Content-Type`, `image/x-icon`);
    payloadString = typeof payload !== `undefined` ? payload : ``;
  }

  if (contentType == "css") {
    res.setHeader(`Content-Type`, `text/css`);
    payloadString = typeof payload !== `undefined` ? payload : ``;
  }

  if (contentType == "png") {
    res.setHeader(`Content-Type`, `image/png`);
    payloadString = typeof payload !== `undefined` ? payload : ``;
  }

  if (contentType == "jpg") {
    res.setHeader(`Content-Type`, `image/jpeg`);
    payloadString = typeof payload !== `undefined` ? payload : ``;
  }

  if (contentType == "plain") {
    res.setHeader(`Content-Type`, `text/plain`);
    payloadString = typeof payload !== `undefined` ? payload : ``;
  }

  // Return the response-parts that are common to all content-types
  res.writeHead(statusCode);
  res.end(payloadString);

  // If response is 200, print green otherwise red
  if (statusCode === 200) {
    debug(
      `\x1b[32m%s\x1b[0m`,
      `${method.toUpperCase()} ${trimmedPath}  ${statusCode}`
    );
  } else {
    debug(
      `\x1b[31m%s\x1b[0m`,
      `${method.toUpperCase()} ${trimmedPath}  ${statusCode}`
    );
  }
};

//Define a request router
server.router = {
  "": handlers.index,
  "contact-us": handlers.contact_us,
  team: handlers.team,
  "favicon.ico": handlers.favicon,
  public: handlers.public,
  "api/contact-us": handlers.feedback
};

// Init script
server.init = () => {
  server.httpServer.listen(config.httpPort, () => {
    console.log(
      "\x1b[35m%s\x1b[0m",
      `The server is listening on port ${config.httpPort} in ${
        config.envName
      } mode`
    );
  });

  //Start the https server
  server.httpsServer.listen(config.httpsPort, function() {
    console.log(
      "\x1b[35m%s\x1b[0m",
      `The server is listening on port ${config.httpsPort} in ${
        config.envName
      } mode`
    );
  });
};

module.exports = server;
