// Express Router configuration for Product
const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - category
 *         - price
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated ID from MongoDB
 *         name:
 *           type: string
 *           example: "Laptop Dell XPS 15"
 *         category:
 *           type: string
 *           enum: [Electronics, Audio, Accessories]
 *           example: "Electronics"
 *         price:
 *           type: number
 *           example: 35000000
 *         stock:
 *           type: integer
 *           example: 10
 */

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get the list of products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Current page (default = 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page (default = 5)
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 */
router.get('/', productController.getAllProducts);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Validation failed
 */
router.post('/', productController.createProduct);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Products]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Product found
 *       400:
 *         description: Malformed ID
 *       404:
 *         description: No product found with the given ID
 */
router.get('/:id', productController.getProductById);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update a product by ID
 *     tags: [Products]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Validation failed or malformed ID
 *       404:
 *         description: No product found to update
 */
router.put('/:id', productController.updateProduct);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete a product by ID
 *     tags: [Products]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       400:
 *         description: Malformed ID
 *       404:
 *         description: No product found to delete
 */
router.delete('/:id', productController.deleteProduct);

module.exports = router;