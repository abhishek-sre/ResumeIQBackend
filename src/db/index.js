const mongoose = require('mongoose');

async function connectDatabase() {
  const connectionString = process.env.MONGODB_URI;

  if (!connectionString) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(connectionString);
  console.log('Database connected');
}

module.exports = connectDatabase;