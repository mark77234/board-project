const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "../db/database.sqlite");
const db = new sqlite3.Database(dbPath);

// 위시리스트 페이지
router.get("/", (req, res) => {
  const wishlist = req.session.wishlist || [];
  res.render("wishlist", { wishlist });
});

// 위시리스트에 상품 추가
router.post("/add/:id", (req, res) => {
  const productId = parseInt(req.params.id, 10);

  const query = "SELECT * FROM products WHERE id = ?";
  db.get(query, [productId], (err, row) => {
    if (err) {
      console.error("DB 에러:", err);
      return res.status(500).send("DB 오류");
    }

    if (!row) {
      return res.status(404).send("상품을 찾을 수 없습니다.");
    }

    if (!req.session.wishlist) {
      req.session.wishlist = [];
    }

    const alreadyExists = req.session.wishlist.some((p) => p.id === row.id);
    if (!alreadyExists) {
      req.session.wishlist.push(row);
    }

    res.redirect("/resource");
  });
});

// 위시리스트에서 상품 제거
router.post("/remove/:id", (req, res) => {
  const productId = parseInt(req.params.id, 10);
  if (req.session.wishlist) {
    req.session.wishlist = req.session.wishlist.filter(
      (p) => p.id !== productId
    );
  }
  res.redirect("/wishlist");
});

module.exports = router;
