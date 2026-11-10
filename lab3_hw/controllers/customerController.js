const customerService = require('../services/customerService');

exports.getOrderHistory = async (req, res, next) => {
  try {
    res.json(await customerService.getOrderHistory(req.params.id));
  } catch (err) {
    next(err);
  }
};