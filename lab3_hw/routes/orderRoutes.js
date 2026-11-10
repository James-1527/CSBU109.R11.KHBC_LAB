const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

/**
 * @swagger
 * /api/v1/orders:
 *   post:
 *     summary: Create an order (SQL transaction)
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customerId: { type: integer, example: 1 }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId: { type: integer, example: 1 }
 *                     quantity: { type: integer, example: 2 }
 *     responses:
 *       201: { description: Order created }
 *       400: { description: Validation error or out of stock }
 *       404: { description: Customer or product not found }
 */
router.post('/', orderController.createOrder);

/**
 * @swagger
 * /api/v1/orders:
 *   get:
 *     summary: List orders with filter, pagination and JOIN
 *     tags: [Orders]
 *     parameters:
 *       - { in: query, name: status, schema: { type: string, enum: [pending, completed, cancelled] } }
 *       - { in: query, name: customerId, schema: { type: integer } }
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 5 } }
 *     responses:
 *       200: { description: Paginated list of orders }
 *       400: { description: Invalid query parameters }
 */
router.get('/', orderController.listOrders);

/**
 * @swagger
 * /api/v1/orders/analytics/sales-summary:
 *   get:
 *     summary: Sales revenue analytics
 *     tags: [Orders]
 *     responses:
 *       200: { description: Revenue summary and top selling products }
 */
router.get('/analytics/sales-summary', orderController.salesSummary);

/**
 * @swagger
 * /api/v1/orders/{id}:
 *   get:
 *     summary: Get order details with nested customer and items
 *     tags: [Orders]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Order details }
 *       404: { description: Order not found }
 */
router.get('/:id', orderController.getOrder);

/**
 * @swagger
 * /api/v1/orders/{id}/status:
 *   patch:
 *     summary: Update order status and restore stock when cancelled
 *     tags: [Orders]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [pending, completed, cancelled], example: cancelled }
 *     responses:
 *       200: { description: Status updated }
 *       400: { description: Invalid status or order already cancelled }
 *       404: { description: Order not found }
 */
router.patch('/:id/status', orderController.updateStatus);

/**
 * @swagger
 * /api/v1/orders/{id}:
 *   delete:
 *     summary: Delete an order (restores stock if not cancelled)
 *     tags: [Orders]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Order deleted }
 *       404: { description: Order not found }
 */
router.delete('/:id', orderController.deleteOrder);

module.exports = router;