import { Request, Response, NextFunction } from 'express';
import Category from '../models/Category';
import Habit from '../models/Habit';

export async function getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const categories = await Category.find({ userId: req.user!._id }).sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    next(err);
  }
}

export async function createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, color } = req.body as { name: string; color: string };
    const category = await Category.create({ name, color, userId: req.user!._id });
    res.status(201).json(category);
  } catch (err) {
    const mongoErr = err as { code?: number };
    if (mongoErr.code === 11000) {
      res.status(409).json({ error: { message: 'Category name already exists', code: 'DUPLICATE' } });
      return;
    }
    next(err);
  }
}

export async function updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const category = await Category.findOne({ _id: req.params['id'], userId: req.user!._id });
    if (!category) {
      res.status(404).json({ error: { message: 'Category not found', code: 'NOT_FOUND' } });
      return;
    }
    const body = req.body as { name?: string; color?: string };
    if (body.name !== undefined) category.name = body.name;
    if (body.color !== undefined) category.color = body.color;
    await category.save();
    res.json(category);
  } catch (err) {
    const mongoErr = err as { code?: number };
    if (mongoErr.code === 11000) {
      res.status(409).json({ error: { message: 'Category name already exists', code: 'DUPLICATE' } });
      return;
    }
    next(err);
  }
}

export async function deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const category = await Category.findOne({ _id: req.params['id'], userId: req.user!._id });
    if (!category) {
      res.status(404).json({ error: { message: 'Category not found', code: 'NOT_FOUND' } });
      return;
    }
    await Habit.updateMany({ categoryId: category._id }, { $set: { categoryId: null } });
    await Category.deleteOne({ _id: category._id });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
