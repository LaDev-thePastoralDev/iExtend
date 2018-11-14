const helpers = require("../lib/helpers");
const { MongoClient } = require("mongodb");

const database = {};

database.connection = () => {
  MongoClient.connect(
    "mongodb://127.0.0.1:27017/Extend",
    (err, client) => {
      if (err) {
        return console.log(`Error connecting to MongoDB Server. Error: ${err}`);
      }
      console.log("Connected to MongoDb Server");
      db = client.db("Extend");
    }
  );
};

database.create = (data, callback) => {
  db.collection("feedback").insertOne(
    {
      fullName: data.fullName,
      email: data.email,
      message: data.message
    },
    (err, result) => {
      if (!err && result) {
        console.log("No error: ", result);
        callback(JSON.stringify(result.ops, undefined, 2));
      } else {
        console.log("Error: ", err);
        callback(JSON.stringify(err, undefined, 2));
      }
    }
  );
};

database.read = (email, callback) => {
  db.collection("feedback").findOne(
    {
      email: email
    },
    (err, data) => {
      if (!err && data) {
        const parsedData = JSON.stringify(data);
        callback(false, data);
      } else {
        callback(err, data);
      }
    }
  );
};

// database.read = () => {
//   db.collection("feedback")
//     .find()
//     .toArray()
//     .then(docs => {
//       console.log(JSON.stringify(docs, undefined, 2));
//     });
// };

database.init = () => {
  database.connection();
};

module.exports = database;
