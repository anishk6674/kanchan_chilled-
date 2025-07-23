// Node.js with Express
const express = require('express');
const router = express.Router();
const pool = require('../database'); // Assuming you have a database connection pool using mysql2/promise

// Middleware to parse JSON request bodies
router.use(express.json());

// IMPORTANT: Ensure your database table 'orders' has these columns:
// ALTER TABLE orders ADD COLUMN collected_qty INT DEFAULT 0;
// ALTER TABLE orders ADD COLUMN collection_date DATE NULL;

// GET all orders
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM orders');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// GET a specific order by ID
router.get('/:id', async (req, res) => {
    const orderId = req.params.id;
    try {
        const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
        if (rows.length > 0) {
            res.status(200).json(rows[0]);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        console.error(`Error fetching order with ID ${orderId}:`, error);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

// POST a new order
router.post('/', async (req, res) => {
    const {
        order_date,
        customer_name,
        customer_phone,
        customer_address,
        delivery_amount,
        can_qty,
        collected_qty, // <-- Added for POST
        collection_date, // <-- Added for POST
        delivery_date,
        delivery_time,
        order_status,
        notes,
    } = req.body;

    if (!order_date || !customer_name || !customer_phone || !customer_address || can_qty === undefined || can_qty === null || !delivery_date || !delivery_time || !order_status) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO orders (order_date, customer_name, customer_phone, customer_address, delivery_amount, can_qty, collected_qty, collection_date, delivery_date, order_status, notes, delivery_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [order_date, customer_name, customer_phone, customer_address, delivery_amount, can_qty, collected_qty || 0, collection_date || null, delivery_date, order_status, notes, delivery_time]
        );
        // Note: Using collected_qty || 0 and collection_date || null to handle cases where they might be undefined/null from frontend on creation

        const newOrderId = result.insertId;
        const [newOrderRows] = await pool.query('SELECT * FROM orders WHERE id = ?', [newOrderId]);
        res.status(201).json(newOrderRows[0]);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// PUT (update) an existing order by ID
router.put('/:id', async (req, res) => {
    const orderId = req.params.id;
    const {
        order_date,
        customer_name,
        customer_phone,
        customer_address,
        delivery_amount,
        can_qty,
        collected_qty, // <-- Added for PUT
        collection_date, // <-- Added for PUT
        delivery_date,
        delivery_time,
        order_status,
        notes,
    } = req.body;

    try {
        const [existingOrder] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
        if (existingOrder.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        await pool.query(
            'UPDATE orders SET order_date = ?, customer_name = ?, customer_phone = ?, customer_address = ?, delivery_amount = ?, can_qty = ?, collected_qty = ?, collection_date = ?, delivery_date = ?, delivery_time = ?, order_status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [order_date, customer_name, customer_phone, customer_address, delivery_amount, can_qty, collected_qty, collection_date || null, delivery_date, delivery_time, order_status, notes, orderId]
        );

        const [updatedOrderRows] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
        res.status(200).json(updatedOrderRows[0]);
    } catch (error) {
        console.error(`Error updating order with ID ${orderId}:`, error);
        res.status(500).json({ error: 'Failed to update order' });
    }
});

// DELETE an order by ID
router.delete('/:id', async (req, res) => {
    const orderId = req.params.id;
    try {
        const [existingOrder] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
        if (existingOrder.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        await pool.query('DELETE FROM orders WHERE id = ?', [orderId]);
        res.status(200).json({ message: `Order with ID ${orderId} deleted successfully` });
    } catch (error) {
        console.error(`Error deleting order with ID ${orderId}:`, error);
        res.status(500).json({ error: 'Failed to delete order' });
    }
});

module.exports = router;