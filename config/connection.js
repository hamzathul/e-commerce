const { MongoClient } = require('mongodb');
const state = {
  db: null
};

module.exports.connect = async function (done) {
  const url = 'mongodb://localhost:27017';
  const dbname = 'shopping';

  try {
    // Create a new MongoClient and connect to the server
    const client = await MongoClient.connect(url);
    
    // Select the database by name
    state.db = client.db(dbname);

    console.log("Connected to MongoDB successfully");

    // Call done without error
    done();
  } catch (err) {
    console.error("Database connection failed:", err);
    done(err);  // Pass the error to the callback
  }
};

module.exports.get = function () {
  return state.db;
};
