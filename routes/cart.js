const express = require("express");
const db = require("../config/db");
const { authenticateToken } = require("../middleware/auth");
const router = express.Router();

router.get("/", authenticateToken, (req, res) => {
    const sql = `SELECT ci.id, ci.product_id, p.name, p.price, p.image, ci.quantity,
                 (p.price * ci.quantity) AS subtotal
                 FROM cart_items ci
                 JOIN cart c ON ci.cart_id = c.id
                 JOIN products p ON p.id = ci.product_id
                 WHERE c.user_id = ?`;
    db.query(sql, [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
});

router.post("/", authenticateToken, (req, res) => {
    const { product_id, quantity = 1 } = req.body;
    if (!product_id || quantity < 1) return res.status(400).json({ message: "Product and valid quantity are required" });

    db.query("SELECT quantity FROM products WHERE id = ?", [product_id], (err, products) => {
        if (err) return res.status(500).json({ message: err.message });
        if (!products.length) return res.status(404).json({ message: "Product not found" });
        if (products[0].quantity < quantity) return res.status(400).json({ message: "Not enough stock" });

        db.query("SELECT id FROM cart WHERE user_id = ?", [req.user.id], (err, carts) => {
            if (err) return res.status(500).json({ message: err.message });

            const add = (cartId) => {
                db.query("SELECT id FROM cart_items WHERE cart_id=? AND product_id=?", [cartId, product_id], (err, items) => {
                    if (err) return res.status(500).json({ message: err.message });

                    if (items.length) {
                        db.query("UPDATE cart_items SET quantity=quantity+? WHERE id=?", [quantity, items[0].id], (err) => {
                            if (err) return res.status(500).json({ message: err.message });
                            res.json({ message: "Cart updated" });
                        });
                    } else {
                        db.query("INSERT INTO cart_items (cart_id,product_id,quantity) VALUES (?,?,?)",
                            [cartId, product_id, quantity], (err) => {
                                if (err) return res.status(500).json({ message: err.message });
                                res.json({ message: "Product added to cart" });
                            });
                    }
                });
            };

            if (carts.length) add(carts[0].id);
            else db.query("INSERT INTO cart (user_id) VALUES (?)", [req.user.id], (err, result) => {
                if (err) return res.status(500).json({ message: err.message });
                add(result.insertId);
            });
        });
    });
});

router.put("/:id", authenticateToken, (req, res) => {
    const { quantity } = req.body;
    if (!Number.isInteger(Number(quantity)) || Number(quantity) < 1)
        return res.status(400).json({ message: "Quantity must be at least 1" });

    const sql = `UPDATE cart_items ci JOIN cart c ON ci.cart_id=c.id
                 SET ci.quantity=? WHERE ci.id=? AND c.user_id=?`;
    db.query(sql, [quantity, req.params.id, req.user.id], (err) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ message: "Cart updated" });
    });
});

router.delete("/:id", authenticateToken, (req, res) => {
    const sql = `DELETE ci FROM cart_items ci JOIN cart c ON ci.cart_id=c.id
                 WHERE ci.id=? AND c.user_id=?`;
    db.query(sql, [req.params.id, req.user.id], (err) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ message: "Cart item removed" });
    });
});

module.exports = router;
