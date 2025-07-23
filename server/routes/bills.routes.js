// routes/bills.js
const express = require('express');
const router = express.Router();
const pool = require('../database'); // Directly import the database connection pool

// API Route for Saving Monthly Bills
router.post('/save-monthly-bills', async (req, res) => {
    const bills = req.body.bills;

    if (!bills || !Array.isArray(bills) || bills.length === 0) {
        return res.status(400).json({ message: 'No bills data provided.' });
    }

    let connection; // Declare connection here so it's accessible in finally block
    try {
        connection = await pool.getConnection(); // Get a connection from the pool
        await connection.beginTransaction(); // Start transaction

        for (const bill of bills) {
            // Basic validation - enhance as needed
            if (!bill.customer_id || !bill.bill_month || bill.bill_amount === undefined || bill.total_cans === undefined || bill.delivery_days === undefined) {
                // It's good to be specific about which bill caused the issue
                console.error('Skipping bill due to missing data:', bill);
                throw new Error(`Missing required bill data for one or more entries (customer_id: ${bill.customer_id}, month: ${bill.bill_month}).`);
            }

            // MySQL INSERT ... ON DUPLICATE KEY UPDATE syntax
            const insertOrUpdateQuery = `
                INSERT INTO monthly_bills (
                    customer_id,
                    bill_month,
                    paid_status,
                    sent_status,
                    bill_amount,
                    created_at,
                    total_cans,
                    delivery_days
                ) VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)
                ON DUPLICATE KEY UPDATE
                    paid_status = VALUES(paid_status),
                    sent_status = VALUES(sent_status),
                    bill_amount = VALUES(bill_amount),
                    total_cans = VALUES(total_cans),
                    delivery_days = VALUES(delivery_days),
                    created_at = NOW(); -- Update timestamp on update as well
            `;
            const values = [
                bill.customer_id,
                bill.bill_month,
                bill.paid_status,
                bill.sent_status,
                bill.bill_amount,
                bill.total_cans,
                bill.delivery_days,
            ];

            await connection.execute(insertOrUpdateQuery, values); // Use execute for prepared statements
        }

        await connection.commit(); // Commit transaction
        res.status(200).json({ message: 'Bills saved successfully!' });
    } catch (error) {
        if (connection) {
            await connection.rollback(); // Rollback on error
        }
        console.error('Error saving bills to database:', error);
        res.status(500).json({ message: 'Failed to save bills to database.', error: error.message });
    } finally {
        if (connection) {
            connection.release(); // Release connection back to the pool
        }
    }
});

module.exports = router; // Export the router directly