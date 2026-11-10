// Express Router configuration for Category
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');

// Name must be at least 3 characters. PATCH may omit name; POST and PUT must include it.
const validateCategory = (req, res, next) => {
  const { name } = req.body;
  if (req.method === 'PATCH' && name === undefined) return next();
  if (typeof name !== 'string' || name.trim().length < 3) {
    return res.status(400).json({ success: false, message: 'Category name must be at least 3 characters' });
  }
  next();
};

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       required:
 *         - name
 *         - slug
 *       properties:
 *         _id:
 *           type: string
 *           readOnly: true
 *           description: Auto-generated ID from MongoDB
 *         name:
 *           type: string
 *           minLength: 3
 *           example: "Headphones"
 *         slug:
 *           type: string
 *           example: "headphones"
 *         description:
 *           type: string
 *           example: "Wired and wireless headphones"
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get the list of categories
 *     tags: [Categories]
 *     parameters:
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
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Field to sort by. Prefix with - for descending, e.g. name or -name (default = -createdAt)
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 */
router.get('/', categoryController.getAllCategories);

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Validation failed
 */
router.post('/', validateCategory, categoryController.createCategory);

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Get a category by ID
 *     tags: [Categories]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Category found
 *       400:
 *         description: Malformed ID
 *       404:
 *         description: No category found with the given ID
 */
router.get('/:id', categoryController.getCategoryById);

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Replace a category by ID (name is required)
 *     tags: [Categories]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         description: Validation failed or malformed ID
 *       404:
 *         description: No category found to update
 */
router.put('/:id', validateCategory, categoryController.updateCategory);

/**
 * @swagger
 * /categories/{id}:
 *   patch:
 *     summary: Partially update a category (e.g. only description)
 *     tags: [Categories]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         description: Validation failed or malformed ID
 *       404:
 *         description: No category found to update
 */
router.patch('/:id', validateCategory, categoryController.updateCategory);

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Delete a category by ID
 *     tags: [Categories]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       400:
 *         description: Malformed ID
 *       404:
 *         description: No category found to delete
 */
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;