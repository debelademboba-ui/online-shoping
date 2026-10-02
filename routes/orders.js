const express = require("express");
const db = require("../config/db");
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const router = express.Router();

router.get("/", authenticateToken, (req, res) => {
    let sql = `SELECT o.*, u.name AS customer_name, u.email
               FROM orders o JOIN users u ON o.user_id=u.id`;
    const params = [];
    if (req.user.role !== "admin") {
        sql += " WHERE o.user_id=?";
        params.push(req.user.id);
    }
    sql += " ORDER BY o.order_date DESC";

    db.query(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
});

router.get("/:id", authenticateToken, (req, res) => {
    const orderSql = `SELECT o.*, u.name AS customer_name, u.email
                      FROM orders o JOIN users u ON o.user_id=u.id WHERE o.id=?`;
    db.query(orderSql, [req.params.id], (err, orders) => {
        if (err) return res.status(500).json({ message: err.message });
        if (!orders.length) return res.status(404).json({ message: "Order not found" });
        if (req.user.role !== "admin" && orders[0].user_id !== req.user.id)
            return res.status(403).json({ message: "Access denied" });

        const itemSql = `SELECT oi.*, p.name FROM order_items oi JOIN products p ON oi.product_id=p.id WHERE oi.order_id=?`;
        db.query(itemSql, [req.params.id], (err, items) => {
            if (err) return res.status(500).json({ message: err.message });
            res.json({ order: orders[0], items });
        });
    });
});

router.post("/", authenticateToken, (req, res) => {
    const { shipping_address } = req.body;
    if (!shipping_address) return res.status(400).json({ message: "Shipping address required" });

    const cartSql = `SELECT ci.product_id, ci.quantity, p.price, p.quantity AS stock
                     FROM cart c JOIN cart_items ci ON c.id=ci.cart_id
                     JOIN products p ON p.id=ci.product_id WHERE c.user_id=?`;
    db.query(cartSql, [req.user.id], (err, items) => {
        if (err) return res.status(500).json({ message: err.message });
        if (!items.length) return res.status(400).json({ message: "Cart is empty" });

        const insufficient = items.find(i => i.quantity > i.stock);
        if (insufficient) return res.status(400).json({ message: "One or more products are out of stock" });

        const total = items.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0);

        db.beginTransaction(err => {
            if (err) return res.status(500).json({ message: err.message });

            db.query("INSERT INTO orders (user_id,total_amount,shipping_address) VALUES (?,?,?)",
                [req.user.id, total, shipping_address], (err, result) => {
                    if (err) return db.rollback(() => res.status(500).json({ message: err.message }));

                    const orderId = result.insertId;
                    const values = items.map(i => [orderId, i.product_id, i.quantity, i.price]);

                    db.query("INSERT INTO order_items (order_id,product_id,quantity,price) VALUES ?", [values], err => {
                        if (err) return db.rollback(() => res.status(500).json({ message: err.message }));

                        let remaining = items.length;
                        let failed = false;
                        items.forEach(i => {
                            db.query("UPDATE products SET quantity=quantity-? WHERE id=?",
                                [i.quantity, i.product_id], err => {
                                    if (failed) return;
                                    if (err) {
                                        failed = true;
                                        return db.rollback(() => res.status(500).json({ message: err.message }));
                                    }
                                    remaining--;
                                    if (remaining === 0) {
                                        db.query(`DELETE ci FROM cart_items ci JOIN cart c ON ci.cart_id=c.id WHERE c.user_id=?`,
                                            [req.user.id], err => {
                                                if (err) return db.rollback(() => res.status(500).json({ message: err.message }));
                                                db.commit(err => {
                                                    if (err) return db.rollback(() => res.status(500).json({ message: err.message }));
                                                    res.status(201).json({ message: "Order created successfully", orderId });
                                                });
                                            });
                                    }
                                });
                        });
                    });
                });
        });
    });
});

router.put("/:id/status", authenticateToken, requireAdmin, (req, res) => {
    const allowed = ["Pending","Confirmed","Processing","Shipped","Delivered","Cancelled"];
    if (!allowed.includes(req.body.status)) return res.status(400).json({ message: "Invalid order status" });

    db.query("UPDATE orders SET status=? WHERE id=?", [req.body.status, req.params.id], (err) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ message: "Order status updated" });
    });
});

module.exports = router;
