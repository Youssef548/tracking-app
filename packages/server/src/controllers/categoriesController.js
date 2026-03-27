const Category = require('../models/Category');
const Habit = require('../models/Habit');

async function getCategories(req, res, next) {
  try {
    const categories = await Category.find({ userId: req.user._id }).sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    next(err);
  }
}

async function createCategory(req, res, next) {
  try {
    const { name, color } = req.body;
    const category = await Category.create({ name, color, userId: req.user._id });
    res.status(201).json(category);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: { message: 'Category name already exists', code: 'DUPLICATE' } });
    }
    next(err);
  }
}

async function updateCategory(req, res, next) {
  try {
    const category = await Category.findOne({ _id: req.params.id, userId: req.user._id });
    if (!category) {
      return res.status(404).json({ error: { message: 'Category not found', code: 'NOT_FOUND' } });
    }
    if (req.body.name !== undefined) category.name = req.body.name;
    if (req.body.color !== undefined) category.color = req.body.color;
    await category.save();
    res.json(category);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: { message: 'Category name already exists', code: 'DUPLICATE' } });
    }
    next(err);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const category = await Category.findOne({ _id: req.params.id, userId: req.user._id });
    if (!category) {
      return res.status(404).json({ error: { message: 'Category not found', code: 'NOT_FOUND' } });
    }
    await Habit.updateMany({ categoryId: category._id }, { $set: { categoryId: null } });
    await Category.deleteOne({ _id: category._id });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
