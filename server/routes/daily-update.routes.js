// Node.js with Express (example - adapt to your backend framework)
const express = require('express');
const router = express.Router();
const pool = require('../database');

// Middleware to parse JSON request bodies
router.use(express.json());

// Function to get the previous day's date in YYYY-MM-DD format
function getPreviousDay(dateString) {
  const date = new Date(dateString);
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
}

// GET daily updates for a specific date
router.get('/', async (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ error: 'Date parameter is required' });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT update_id, customer_id, date, delivered_qty, collected_qty, holding_status, notes FROM daily_updates WHERE date = ?',
      [date]
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching daily updates:', error);
    res.status(500).json({ error: 'Failed to fetch daily updates' });
  }
});

// POST a new daily update (or update an existing one for the day)
router.post('/', async (req, res) => {
  const { customer_id, date, delivered_qty, collected_qty, notes } = req.body;

  if (!customer_id || !date) {
    return res.status(400).json({ error: 'Customer ID and date are required' });
  }

  try {
    // Fetch the holding status from the previous day
    const [previousDayUpdate] = await pool.execute(
      'SELECT holding_status FROM daily_updates WHERE customer_id = ? AND date < ? ORDER BY date DESC LIMIT 1',
      [customer_id, date]
    );

    const previousHoldingStatus = previousDayUpdate.length > 0 ? previousDayUpdate[0].holding_status : 0;
    const currentHoldingStatus = previousHoldingStatus + parseInt(delivered_qty, 10) - parseInt(collected_qty, 10);

    // Check if an update already exists for this customer and date
    const [existingUpdate] = await pool.execute(
      'SELECT update_id FROM daily_updates WHERE customer_id = ? AND date = ?',
      [customer_id, date]
    );

    if (existingUpdate.length > 0) {
      // Update the existing record
      await pool.execute(
        'UPDATE daily_updates SET delivered_qty = ?, collected_qty = ?, holding_status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE customer_id = ? AND date = ?',
        [delivered_qty, collected_qty, currentHoldingStatus, notes, customer_id, date]
      );
      res.status(200).json({ message: `Daily update for customer ${customer_id} on ${date} updated successfully` });
    } else {
      // Insert a new record
      const [result] = await pool.execute(
        'INSERT INTO daily_updates (customer_id, date, delivered_qty, collected_qty, holding_status, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [customer_id, date, delivered_qty, collected_qty, currentHoldingStatus, notes]
      );
      const newUpdateId = result.insertId;
      const [newUpdate] = await pool.execute(
        'SELECT update_id, customer_id, date, delivered_qty, collected_qty, holding_status, notes FROM daily_updates WHERE update_id = ?',
        [newUpdateId]
      );
      res.status(201).json(newUpdate[0]);
    }
  } catch (error) {
    console.error('Error saving/updating daily update:', error);
    res.status(500).json({ error: 'Failed to save/update daily update' });
  }
});

// GET current holding status for all customers (latest date)
router.get('/current-status', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT c.customer_id, c.name, c.phone_number, c.customer_type, d.holding_status, d.date
      FROM customers c
      LEFT JOIN daily_updates d ON c.customer_id = d.customer_id
      WHERE d.date = (SELECT MAX(date) FROM daily_updates WHERE customer_id = c.customer_id) OR d.date IS NULL
    `);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching current holding status:', error);
    res.status(500).json({ error: 'Failed to fetch current holding status' });
  }
});

// GET cans to collect for the next day based on the provided date
router.get('/next-collection', async (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ error: 'Date parameter is required' });
  }

  const previousDay = getPreviousDay(date);

  try {
    const [rows] = await pool.execute(`
      SELECT c.customer_id, c.name, d.holding_status
      FROM customers c
      JOIN daily_updates d ON c.customer_id = d.customer_id
      WHERE d.date = ? AND d.holding_status > 0
    `, [previousDay]);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching next day collection data:', error);
    res.status(500).json({ error: 'Failed to fetch next day collection data' });
  }
});

// Optional: DELETE a daily update by ID (if needed for specific use cases)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [existingUpdate] = await pool.execute(
      'SELECT update_id FROM daily_updates WHERE update_id = ?',
      [id]
    );

    if (existingUpdate.length === 0) {
      return res.status(404).json({ message: `Daily update with ID ${id} not found` });
    }

    await pool.execute('DELETE FROM daily_updates WHERE update_id = ?', [id]);
    res.status(200).json({ message: `Daily update with ID ${id} deleted successfully` });
  } catch (error) {
    console.error(`Error deleting daily update with ID ${id}:`, error);
    res.status(500).json({ error: 'Failed to delete daily update' });
  }
});

// GET ledger data for a customer by month
router.get('/ledger', async (req, res) => {
  const { customer_id, month } = req.query;

  if (!customer_id || !month) {
    return res.status(400).json({ error: 'Customer ID and month are required' });
  }

  try {
    // Get current active prices
    const [prices] = await pool.query('SELECT * FROM prices WHERE is_active = 1');
    if (!prices.length) {
      return res.status(400).json({ error: 'No active prices found' });
    }
    const currentPrices = prices[0];

    // Get customer type
    const [customers] = await pool.execute(
      'SELECT customer_type FROM customers WHERE customer_id = ?',
      [customer_id]
    );

    if (!customers.length) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customerType = customers[0].customer_type;
    const pricePerCan = customerType === 'shop' ? currentPrices.shop_price :
                       customerType === 'monthly' ? currentPrices.monthly_price :
                       currentPrices.order_price;

    const [rows] = await pool.execute(`
      SELECT 
        date, 
        delivered_qty, 
        collected_qty, 
        holding_status, 
        notes,
        delivered_qty * ? as amount
      FROM daily_updates
      WHERE customer_id = ?
        AND date LIKE ?
      ORDER BY date ASC
    `, [pricePerCan, customer_id, `${month}-%`]);

    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching ledger data:', error);
    res.status(500).json({ error: 'Failed to fetch ledger data' });
  }
});

// GET monthly billing summary for a specific month
router.get('/monthly-bills', async (req, res) => {
  const { month } = req.query;

  if (!month) {
    return res.status(400).json({ error: 'Month parameter (YYYY-MM) is required' });
  }

  try {
    // Get current active prices
    const [prices] = await pool.query('SELECT * FROM prices WHERE is_active = 1');
    if (!prices.length) {
      return res.status(400).json({ error: 'No active prices found' });
    }
    const currentPrices = prices[0];

    // SQL query to get monthly delivered quantity per customer with dynamic pricing
    const [rows] = await pool.execute(`
      SELECT
        c.customer_id,
        c.name,
        c.phone_number,
        c.customer_type,
        SUM(du.delivered_qty) AS total_cans_delivered,
        (SELECT COUNT(*) 
         FROM daily_updates 
         WHERE customer_id = c.customer_id 
         AND date LIKE ? 
         AND delivered_qty > 0) AS total_delivery_days,
        CASE 
          WHEN c.customer_type = 'shop' THEN SUM(du.delivered_qty) * ?
          WHEN c.customer_type = 'monthly' THEN SUM(du.delivered_qty) * ?
          WHEN c.customer_type = 'order' THEN SUM(du.delivered_qty) * ?
        END AS bill_amount,
        (SELECT MIN(paid_status) FROM monthly_bills WHERE customer_id = c.customer_id AND bill_month = ?) AS paid_status,
        (SELECT MIN(sent_status) FROM monthly_bills WHERE customer_id = c.customer_id AND bill_month = ?) AS sent_status
      FROM
        customers c
      JOIN
        daily_updates du ON c.customer_id = du.customer_id
      WHERE
        du.date LIKE ?
      GROUP BY
        c.customer_id, c.name, c.phone_number, c.customer_type
      HAVING
        total_cans_delivered > 0
      ORDER BY
        c.name ASC
    `, [
      `${month}-%`,
      currentPrices.shop_price,
      currentPrices.monthly_price,
      currentPrices.order_price,
      month,
      month,
      `${month}-%`
    ]);

    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching monthly billing summary:', error);
    res.status(500).json({ error: 'Failed to fetch monthly billing summary' });
  }
});

module.exports = router;