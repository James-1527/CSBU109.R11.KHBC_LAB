const orderService = require('../services/orderService');
const httpError = require('../utils/httpError');

const STATUSES = ['pending', 'completed', 'cancelled'];

exports.createOrder = async (req, res, next) => {
  try {
    const { customerId, items } = req.body;

    if (!Number.isInteger(customerId)) {
      throw httpError(400, 'customerId must be an integer');
    }
    if (!Array.isArray(items) || items.length === 0) {
      throw httpError(400, 'items must be a non-empty array');
    }
    for (const it of items) {
      if (!Number.isInteger(it.productId) || !Number.isInteger(it.quantity) || it.quantity <= 0) {
        throw httpError(400, 'Each item needs integer productId and positive integer quantity');
      }
    }

    const order = await orderService.createOrder(customerId, items);
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
};

exports.listOrders = async (req, res, next) => {
  try {
    const { status, customerId } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 5;

    if (status && !STATUSES.includes(status)) {
      throw httpError(400, 'Invalid status');
    }
    if (customerId && !Number.isInteger(Number(customerId))) {
      throw httpError(400, 'customerId must be an integer');
    }
    if (page < 1 || limit < 1) {
      throw httpError(400, 'page and limit must be positive');
    }

    const result = await orderService.listOrders({
      status,
      customerId: customerId ? Number(customerId) : undefined,
      page,
      limit,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.getOrder = async (req, res, next) => {
  try {
    res.json(await orderService.getOrderById(req.params.id));
  } catch (err) {
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!STATUSES.includes(status)) {
      throw httpError(400, 'Invalid status');
    }
    res.json(await orderService.updateStatus(req.params.id, status));
  } catch (err) {
    next(err);
  }
};

exports.deleteOrder = async (req, res, next) => {
  try {
    await orderService.deleteOrder(req.params.id);
    res.json({ success: true, message: 'Order deleted' });
  } catch (err) {
    next(err);
  }
};

exports.salesSummary = async (req, res, next) => {
  try {
    res.json(await orderService.salesSummary());
  } catch (err) {
    next(err);
  }
};