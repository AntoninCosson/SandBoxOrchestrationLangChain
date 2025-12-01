const mongoose = require('mongoose');

const connectionString = process.env.CONNECTION_STRING; 

// Extract database name from connection string
// Format: mongodb+srv://user:pass@host/dbName
const dbName = connectionString.split('/').pop().split('?')[0];

mongoose.connect(connectionString, {
    connectTimeoutMS: 2000,
    dbName: dbName,
  })
 .then(() => {
  console.log('Database connected')
  console.log("Base actuelle :", mongoose.connection.name);
})
 .catch(error => console.error(error));