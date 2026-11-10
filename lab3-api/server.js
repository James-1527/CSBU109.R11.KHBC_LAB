// Main server entry point
const express = require('express');
const mongoose = require('mongoose');
const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');
const setupSwagger = require('./config/swagger');

const app = express();
const PORT = 3000;

app.use(express.json());

// Swagger UI at /api-docs (must be mounted before the error handler)
setupSwagger(app);

// Register API routes
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);

// Global error handler (must be registered AFTER the routes)
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);

  let status = err.status || 500;
  if (err.name === 'ValidationError') status = 400; // schema validation failed
  if (err.name === 'CastError') status = 400;       // malformed ObjectId
  if (err.code === 11000) status = 409;             // duplicate unique key

  res.status(status).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

mongoose.connect('mongodb://127.0.0.1:27017/shop_lab3_db')
  .then(() => {
    app.listen(PORT, () => console.log('Server API is running at: http://localhost:' + PORT));
  })
  .catch((err) => console.error('MongoDB connection failed:', err.message));