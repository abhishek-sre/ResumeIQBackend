const express = require('express');
const cors = require("cors");
const userRoutes = require('./routes/user.routes');
const apiRoutes = require('./routes/evaluator.routes');

const app = express();

app.use(
  cors({
    origin: "https://resumeiqai.gyanimeter.co.in"
  })
);

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/users', userRoutes);
app.use('/api/ai', apiRoutes);
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

module.exports = app;