const express = require("express");
const db = require("../config/db");
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const router = express.Router();

router.get("/", (req, res) => {
    db.query("SELECT * FROM categories ORDER BY name", (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
});

router.post("/", authenticateToken, requireAdmin, (req, res) => {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: "Category name required" });

    db.query(
        "INSERT INTO categories (name,description) VALUES (?,?)",
        [name, description || null],
        (err, result) => {
            if (err) return res.status(500).json({ message: err.message });
            res.status(201).json({ message: "Category created", categoryId: result.insertId });
        }
    );
});

router.delete("/:id", authenticateToken, requireAdmin, (req, res) => {
    db.query("DELETE FROM categories WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ message: "Category deleted" });
    });
});

module.exports = router;
