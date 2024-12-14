const pool = require('../config/db');

// Get all categories
const getAllCategories = async (req, res) => {
    try {
        const { type } = req.query;
        let query = 'SELECT * FROM categories';
        const params = [];

        if (type) {
            query += ' WHERE type = ?';
            params.push(type);
        }

        query += ' ORDER BY name ASC';
        
        const [rows] = await pool.execute(query, params);
        res.json({
            success: true,
            data: rows
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
        const [rows] = await pool.execute(
            'SELECT * FROM categories WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.json({
            success: true,
            data: rows[0]
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
        
        // Check if category with same name and type exists
        const [existing] = await pool.execute(
            'SELECT * FROM categories WHERE name = ? AND type = ?',
            [name, type]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Category with this name and type already exists'
            });
        }

        const [result] = await pool.execute(
            'INSERT INTO categories (name, type, icon, color, description) VALUES (?, ?, ?, ?, ?)',
            [name, type, icon, color, description]
        );

        const [newCategory] = await pool.execute(
            'SELECT * FROM categories WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: newCategory[0]
        });
    } catch (error) {
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

        // Check if category exists
        const [existing] = await pool.execute(
            'SELECT * FROM categories WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Check if new name would create a duplicate
        if (name) {
            const [duplicate] = await pool.execute(
                'SELECT * FROM categories WHERE name = ? AND type = ? AND id != ?',
                [name, existing[0].type, id]
            );

            if (duplicate.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Category with this name and type already exists'
                });
            }
        }

        const updates = [];
        const values = [];

        if (name) {
            updates.push('name = ?');
            values.push(name);
        }
        if (icon) {
            updates.push('icon = ?');
            values.push(icon);
        }
        if (color) {
            updates.push('color = ?');
            values.push(color);
        }
        if (description) {
            updates.push('description = ?');
            values.push(description);
        }

        values.push(id);

        await pool.execute(
            `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        const [updated] = await pool.execute(
            'SELECT * FROM categories WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Category updated successfully',
            data: updated[0]
        });
    } catch (error) {
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

        // Check if category exists
        const [existing] = await pool.execute(
            'SELECT * FROM categories WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Check if category is being used
        const [expenses] = await pool.execute(
            'SELECT COUNT(*) as count FROM expenses WHERE category_id = ?',
            [id]
        );

        const [incomes] = await pool.execute(
            'SELECT COUNT(*) as count FROM incomes WHERE category_id = ?',
            [id]
        );

        if (expenses[0].count > 0 || incomes[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete category that is being used by transactions'
            });
        }

        await pool.execute('DELETE FROM categories WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Category deleted successfully'
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
