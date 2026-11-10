const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

/**
 * @swagger
 * /api/v1/customers/{id}/order-history:
 *   get:
 *     summary: Customer order history and total lifetime spent
 *     tags: [Customers]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Order history and totalLifetimeSpent }
 *       404: { description: Customer not found }
 */
router.get('/:id/order-history', customerController.getOrderHistory);

module.exports = router;