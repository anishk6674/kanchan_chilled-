const express = require('express');
const router = express.Router();
const pool = require('../database');

// GET dashboard statistics
router.get('/', async (req, res) => {
  try {
    const [
      [todayOrders],
      [monthlyCustomers],
     // [shopCustomersReached],
      [totalShopCustomers],
     // [totalOrders],
     // [cansDelivered],
      //[cansCollected],
      [pendingCans],
    ] = await Promise.all([
      pool.query(" SELECT COUNT(*) AS count FROM orders WHERE order_status = 'pending'"),
      pool.query("SELECT COUNT(*) AS count FROM customers WHERE customer_type = 'monthly'"),
     // pool.query("SELECT COUNT(*) AS count FROM customers WHERE customer_type = 'shop' AND is_reached = 1"),
      pool.query("SELECT COUNT(*) AS count FROM customers WHERE customer_type = 'shop'"),
      //pool.query("SELECT COUNT(*) AS count FROM customers WHERE customer_type = 'order'"),

      //pool.query("SELECT IFNULL(SUM(quantity), 0) AS count FROM cans WHERE type = 'delivered' AND DATE(date) = CURDATE()"),
      //pool.query("SELECT IFNULL(SUM(quantity), 0) AS count FROM cans WHERE type = 'collected' AND DATE(date) = CURDATE()"),
      pool.query("SELECT SUM(can_qty) AS count from customers"),
    ]);

    const stats = {
      OrdersTotal: todayOrders[0].count,
      totalMonthlyCustomers: monthlyCustomers[0].count,
      //shopCustomersReached: shopCustomersReached[0].count,
      shopCustomersTotal: totalShopCustomers[0].count,
     // OrdersTotal: totalOrders[0].count,
      //shopCustomersPercentage: totalShopCustomers[0].count ? ((shopCustomersReached[0].count / totalShopCustomers[0].count) * 100).toFixed(1) + '%' : '0%',
      //cansDeliveredToday: cansDelivered[0].count,
      //cansCollectedToday: cansCollected[0].count,
      pendingCansTotal: pendingCans[0].count,
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

module.exports = router;
