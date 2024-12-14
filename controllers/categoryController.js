const pool = require('../config/db');

// Get all categories
const getAllCategories = async (req, res) => {
    try {
        const { type } = req.query;
        let query = 'SELECT * FROM categories';
        const params = [];

        if (type) {
            query += ' WHERE type = $1';
            params.push(type);
        }

        query += ' ORDER BY name ASC';
        
        const result = await pool.query(query, params);
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error in getAllCategories:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving categories'
        });
    }
};

// Get category by ID
const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM categories WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error in getCategoryById:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving category'
        });
    }
};

// Create new category
const createCategory = async (req, res) => {
    try {
        const { name, type, icon, color, description } = req.body;

        const result = await pool.query(
            `INSERT INTO categories (name, type, icon, color, description)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [name, type, icon, color, description]
        );

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: result.rows[0]
        });
    } catch (error) {
        if (error.code === '23505') { // Unique violation
            return res.status(400).json({
                success: false,
                message: 'Category with this name and type already exists'
            });
        }
        console.error('Error in createCategory:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating category'
        });
    }
};

// Update category
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, icon, color, description } = req.body;

        const result = await pool.query(
            `UPDATE categories 
             SET name = COALESCE($1, name),
                 icon = COALESCE($2, icon),
                 color = COALESCE($3, color),
                 description = COALESCE($4, description)
             WHERE id = $5
             RETURNING *`,
            [name, icon, color, description, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.json({
            success: true,
            message: 'Category updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({
                success: false,
                message: 'Category with this name and type already exists'
            });
        }
        console.error('Error in updateCategory:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating category'
        });
    }
};

// Delete category
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if category is being used
        const usageCheck = await pool.query(
            `SELECT EXISTS(SELECT 1 FROM expenses WHERE category_id = $1)
             OR EXISTS(SELECT 1 FROM income WHERE category_id = $1)`,
            [id]
        );

        if (usageCheck.rows[0].exists) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete category as it is being used by expenses or income'
            });
        }

        const result = await pool.query(
            'DELETE FROM categories WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.json({
            success: true,
            message: 'Category deleted successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error in deleteCategory:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting category'
        });
    }
};

module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};
