module.exports = (err, req, res, next) => {
  const status = err.status || 500;

  if (status === 500) console.error(err);

  res.status(status).json({
    success: false,
    message: err.status ? err.message : 'Internal server error',
  });
};