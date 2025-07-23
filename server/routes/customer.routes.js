
const express = require('express');
const router = express.Router();
const pool = require('../database');

// GET all customers
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM customers');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// GET customer by ID
router.get('/:id', async (req, res) => {
  const customerId = req.params.id;
  try {
    const [results] = await pool.query('SELECT * FROM customers WHERE customer_id = ?', [customerId]);
    if (results.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(results[0]);
  } catch (err) {
    console.error('Error fetching customer:', err);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// POST a new customer
router.post('/', async (req, res) => {
  const { name, phone_number, alternate_number, address, customer_type, can_qty, advance_amount } = req.body;

  if (!name || !phone_number || !address || !customer_type) {
    return res.status(400).json({ error: 'Name, phone_number, address, and customer_type are required' });
  }

  const query = `
    INSERT INTO customers 
    (name, phone_number, alternate_number, address, customer_type, can_qty, advance_amount)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    name,
    phone_number,
    alternate_number || null,
    address,
    customer_type,
    can_qty || 0,
    advance_amount || 0.00
  ];

  try {
    const [result] = await pool.query(query, values);
    res.json({ message: 'Customer added successfully', customer_id: result.insertId });
  } catch (err) {
    console.error('POST Error Response:', err);
    res.status(500).json({ error: 'Failed to add customer' });
  }
});

// PUT update an existing customer
router.put('/:id', async (req, res) => {
  const customerId = req.params.id;
  const { name, phone_number, alternate_number, address, customer_type, can_qty, advance_amount } = req.body;

  if (!name || !phone_number || !address || !customer_type) {
    return res.status(400).json({ error: 'Name, phone_number, address, and customer_type are required' });
  }

  const query = `
    UPDATE customers 
    SET name = ?, phone_number = ?, alternate_number = ?, address = ?, customer_type = ?, 
        can_qty = ?, advance_amount = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE customer_id = ?
  `;
  const values = [
    name,
    phone_number,
    alternate_number || null,
    address,
    customer_type,
    can_qty || 0,
    advance_amount || 0.00,
    customerId
  ];

  try {
    const [result] = await pool.query(query, values);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json({ message: 'Customer updated successfully', customer_id: customerId });
  } catch (err) {
    console.error('PUT Error Response:', err);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

module.exports = router;
