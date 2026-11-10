// Request handlers for the Category API
const Category = require('../models/category.model');

// 7: pagination và sorting cho GET /api/categories
exports.getAllCategories = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 5, 1);
    const sort = req.query.sort || '-createdAt'; // e.g. sort=name or sort=-name

    const totalCategories = await Category.countDocuments();
    const categories = await Category.find()
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: categories.length,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCategories / limit),
        totalCategories
      },
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

// 1 and 5.
exports.getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'No category found with the given ID' });
    }
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    next(error); // malformed ID -> CastError -> 400 in server.js
  }
};

// POST /api/categories
exports.createCategory = async (req, res, next) => {
  try {
    const newCategory = await Category.create(req.body);
    res.status(201).json({ success: true, message: 'Category created successfully', data: newCategory });
  } catch (error) {
    next(error);
  }
};

// PUT and PATCH /api/categories/:id()
// findByIdAndUpdate changes only the sent fields, so PATCH and PUT share this handler
exports.updateCategory = async (req, res, next) => {
  try {
    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: 'No category found to update' });
    }
    res.status(200).json({ success: true, message: 'Category updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/categories/:id
exports.deleteCategory = async (req, res, next) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'No category found to delete' });
    }
    res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};