const express = require('express');
const router = express.Router();
const pool = require('../database');

// Get current prices
router.get('/prices', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM prices WHERE is_active = 1');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching prices:', error);
    res.status(500).json({ error: 'Failed to fetch prices' });
  }
});

// Update prices
router.post('/prices', async (req, res) => {
  const { shop, monthly, order } = req.body;
  
  try {
    // Deactivate current prices
    await pool.query('UPDATE prices SET is_active = 0 WHERE is_active = 1');
    
    // Insert new prices
    const [result] = await pool.query(
      'INSERT INTO prices (shop_price, monthly_price, order_price, effective_from, is_active) VALUES (?, ?, ?, NOW(), 1)',
      [shop, monthly, order]
    );
    
    res.json({ message: 'Prices updated successfully' });
  } catch (error) {
    console.error('Error updating prices:', error);
    res.status(500).json({ error: 'Failed to update prices' });
  }
});

module.exports = router;