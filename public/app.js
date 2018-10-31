/*
 * Front end logic
 *
 */

const app = {};

app.config = {
  sessionToken: false
};

app.client = {};

app.client.request = (
  path,
  method,
  queryStringObject,
  headers,
  payload,
  callback
) => {
  // Set defaults
  path = typeof path === "string" && path.trim().length > 0 ? path.trim() : "/";
  method =
    typeof method === "string" &&
    ["GET", "POST", "PUT", "DELETE"].includes(method.toUpperCase())
      ? method.toUpperCase()
      : "GET";
  queryStringObject =
    typeof queryStringObject === "object" && queryStringObject !== null
      ? queryStringObject
      : {};
  headers = typeof headers == "object" && headers !== null ? headers : {};
  payload = typeof payload == "object" && payload !== null ? payload : {};
  callback = typeof callback == "function" ? callback : false;

  // For each query string parameter sent, add it to the path
  let counter = 0;
  let requestUrl = `${path}?`;

  for (let queryKey in queryStringObject) {
    if (queryStringObject.hasOwnProperty(queryKey)) {
      counter++;

      if (counter > 1) {
        requestUrl += "&";
      }
      // Add the key and value
      requestUrl += `${queryKey}=${queryStringObject[queryKey]}`;
    }
  }

  // Form the http request as a JSON type
  let xhr = new XMLHttpRequest();
  xhr.open(method, requestUrl, true);
  xhr.setRequestHeader("Content-type", "application/json");

  // for each header set, add to request
  for (let headerKey in headers) {
    if (headerKey.hasOwnProperty(headerKey)) {
      xhr.setRequestHeader(headerKey, headers[headerKey]);
    }
  }

  // If there is a current session token set, add that as a header
  if (app.config.sessionToken) {
    xhr.setRequestHeader("token", app.config.sessionToken.id);
  }

  // When the request comes back, handle the response
  xhr.onreadystatechange = () => {
    if (xhr.readyState === XMLHttpRequest.DONE) {
      let statusCode = xhr.status;
      let responseReturned = xhr.responseText;

      // Callback if requested
      if (callback) {
        try {
          let parsedResponse = JSON.parse(responseReturned);
          callback(statusCode, parsedResponse);
        } catch (e) {
          callback(statusCode, false);
        }
      }
    }
  };

  // Send the payload as JSON
  let payloadString = JSON.stringify(payload);
  xhr.send(payloadString);
};

// Bind the forms
app.bindForms = function() {
  if (document.querySelector("form")) {
    let allForms = document.querySelectorAll("form");
    for (let i = 0; i < allForms.length; i++) {
      allForms[i].addEventListener("submit", function(e) {
        // Stop it from submitting
        console.log(this);
        e.preventDefault();
        let formId = this.id;
        let path = this.action;
        let method = this.method.toUpperCase();

        // Hide the error message (if it's currently shown due to a previous error)
        document.querySelector("#" + formId + " .formError").style.display =
          "none";

        // Hide the success message (if it's currently shown due to a previous error)
        if (document.querySelector("#" + formId + " .formSuccess")) {
          document.querySelector("#" + formId + " .formSuccess").style.display =
            "none";
        }

        // Turn the inputs into a payload
        let payload = {};
        let elements = this.elements;
        for (let i = 0; i < elements.length; i++) {
          if (elements[i].type !== "submit") {
            // Determine class of element and set value accordingly
            let classOfElement =
              typeof elements[i].classList.value === "string" &&
              elements[i].classList.value.length > 0
                ? elements[i].classList.value
                : "";

            let valueOfElement =
              elements[i].type === "checkbox" &&
              classOfElement.indexOf("multiselect") === -1
                ? elements[i].checked
                : classOfElement.indexOf("intval") === -1
                  ? elements[i].value
                  : parseInt(elements[i].value);

            let elementIsChecked = elements[i].checked;
            // Override the method of the form if the input's name is _method
            let nameOfElement = elements[i].name;
            if (nameOfElement === "_method") {
              method = valueOfElement;
            } else {
              // Create an payload field named "method" if the elements name is actually httpmethod
              if (nameOfElement == "httpmethod") {
                nameOfElement = "method";
              }
              // Create an payload field named "id" if the elements name is actually uid
              if (nameOfElement == "uid") {
                nameOfElement = "id";
              }
              // If the element has the class "multiselect" add its value(s) as array elements
              if (classOfElement.indexOf("multiselect") > -1) {
                if (elementIsChecked) {
                  payload[nameOfElement] =
                    typeof payload[nameOfElement] == "object" &&
                    payload[nameOfElement] instanceof Array
                      ? payload[nameOfElement]
                      : [];
                  payload[nameOfElement].push(valueOfElement);
                }
              } else {
                payload[nameOfElement] = valueOfElement;
              }
            }
          }
        }

        // If the method is DELETE, the payload should be a queryStringObject instead
        let queryStringObject = method == "DELETE" ? payload : {};

        // Call the API
        app.client.request(
          path,
          method,
          queryStringObject,
          undefined,
          payload,
          (statusCode, responsePayload) => {
            // Display an error on the form if needed
            if (statusCode !== 200) {
              if (statusCode === 403) {
                // log the user out
                app.logUserOut();
              } else {
                // Try to get the error from the api, or set a default error message
                let error =
                  typeof responsePayload.Error === "string"
                    ? responsePayload.Error
                    : "An error has occured, please try again";

                // Set the formError field with the error text
                document.querySelector(
                  "#" + formId + " .formError"
                ).innerHTML = error;

                // Show (unhide) the form error field on the form
                document.querySelector(
                  "#" + formId + " .formError"
                ).style.display = "block";
              }
            } else {
              // If successful, send to form response processor
              app.formResponseProcessor(formId, payload, responsePayload);
            }
          }
        );
      });
    }
  }
};

// Form response processor
app.formResponseProcessor = function(formId, requestPayload, responsePayload) {
  let functionToCall = false;
  // If account creation was successful, try to immediately log the user in
  if (formId == "contactForm") {
    app.client.request(
      "api/tokens",
      "POST",
      undefined,
      undefined,
      newPayload,
      (newStatusCode, newResponsePayload) => {
        // Display an error on the form if needed
        if (newStatusCode !== 200) {
          // Set the formError field with the error text
          document.querySelector("#" + formId + " .formError").innerHTML =
            "Sorry, an error has occured. Please try again.";

          // Show (unhide) the form error field on the form
          document.querySelector("#" + formId + " .formError").style.display =
            "block";
        } else {
          window.location = "";
        }
      }
    );
  }
};

// Init (bootstrapping)
app.init = function() {
  // Bind all form submissions
  app.bindForms();
};

// Call the init processes after the window loads
window.onload = function() {
  app.init();
};
