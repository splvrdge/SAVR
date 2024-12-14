const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { handleValidationErrors } = require('../middlewares/validationMiddleware');
const { authenticateToken } = require('../middlewares/authMiddleware');
const {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
} = require('../controllers/categoryController');

// Validation rules
const categoryValidationRules = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),
    body('type')
        .trim()
        .notEmpty()
        .withMessage('Type is required')
        .isIn(['expense', 'income'])
        .withMessage('Type must be either expense or income'),
    body('icon')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Icon name must not exceed 50 characters'),
    body('color')
        .optional()
        .trim()
        .matches(/^#[0-9A-Fa-f]{6}$/)
        .withMessage('Color must be a valid hex color code'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 255 })
        .withMessage('Description must not exceed 255 characters')
];

const updateCategoryValidationRules = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),
    body('icon')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Icon name must not exceed 50 characters'),
    body('color')
        .optional()
        .trim()
        .matches(/^#[0-9A-Fa-f]{6}$/)
        .withMessage('Color must be a valid hex color code'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 255 })
        .withMessage('Description must not exceed 255 characters')
];

// Routes
router.get('/', authenticateToken, getAllCategories);
router.get('/:id', authenticateToken, getCategoryById);
router.post('/', authenticateToken, categoryValidationRules, handleValidationErrors, createCategory);
router.put('/:id', authenticateToken, updateCategoryValidationRules, handleValidationErrors, updateCategory);
router.delete('/:id', authenticateToken, deleteCategory);

module.exports = router;
