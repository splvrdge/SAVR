const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { handleValidationErrors } = require('../middlewares/validationMiddleware');
const { validateToken } = require('../middlewares/authMiddleware');
const categoryController = require('../controllers/categoryController');

// Validation rules
const validateCategory = [
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

const validateCategoryUpdate = [
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
        .withMessage('Description must not exceed 255 characters'),
    body('type')
        .optional()
        .trim()
        .isIn(['expense', 'income'])
        .withMessage('Type must be either expense or income')
];

const validateCategoryId = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Invalid category ID'),
    handleValidationErrors
];

// Routes
router.get(
    '/', 
    validateToken, 
    categoryController.getAllCategories
);

router.get(
    '/:id', 
    validateToken,
    validateCategoryId,
    categoryController.getCategoryById
);

router.post(
    '/', 
    validateToken,
    validateCategory,
    handleValidationErrors,
    categoryController.createCategory
);

router.put(
    '/:id', 
    validateToken,
    validateCategoryId,
    validateCategoryUpdate,
    handleValidationErrors,
    categoryController.updateCategory
);

router.delete(
    '/:id', 
    validateToken,
    validateCategoryId,
    categoryController.deleteCategory
);

module.exports = router;
