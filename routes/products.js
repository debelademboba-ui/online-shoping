const express = require("express");
const db = require("../config/db");
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const router = express.Router();

router.get("/", (req, res) => {
    const sql = `SELECT products.*, categories.name AS category_name
                 FROM products LEFT JOIN categories ON products.category_id = categories.id
                 ORDER BY products.id DESC`;
    db.query(sql, (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
});

router.get("/:id", (req, res) => {
    const sql = `SELECT products.*, categories.name AS category_name
                 FROM products LEFT JOIN categories ON products.category_id = categories.id
                 WHERE products.id = ?`;
    db.query(sql, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        if (!rows.length) return res.status(404).json({ message: "Product not found" });
        res.json(rows[0]);
    });
});

router.post("/", authenticateToken, requireAdmin, (req, res) => {
    const { category_id, name, description, price, quantity, image } = req.body;
    if (!name || price === undefined) return res.status(400).json({ message: "Name and price are required" });

    db.query(
        `INSERT INTO products (category_id,name,description,price,quantity,image) VALUES (?,?,?,?,?,?)`,
        [category_id || null, name, description || "", price, quantity || 0, image || null],
        (err, result) => {
            if (err) return res.status(500).json({ message: err.message });
            res.status(201).json({ message: "Product created", productId: result.insertId });
        }
    );
});

router.put("/:id", authenticateToken, requireAdmin, (req, res) => {
    const { category_id, name, description, price, quantity, image } = req.body;
    db.query(
        `UPDATE products SET category_id=?,name=?,description=?,price=?,quantity=?,image=? WHERE id=?`,
        [category_id || null, name, description || "", price, quantity || 0, image || null, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ message: err.message });
            res.json({ message: "Product updated" });
        }
    );
});

router.delete("/:id", authenticateToken, requireAdmin, (req, res) => {
    db.query("DELETE FROM products WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ message: "Product deleted" });
    });
});

module.exports = router;
