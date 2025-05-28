const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const router = express.Router();
const dbPath = path.join(__dirname, "../db/database.sqlite");
const db = new sqlite3.Database(dbPath);

// GET /resource - 상품 목록 페이지 렌더링
router.get("/", (req, res) => {
  db.all("SELECT * FROM products", [], (err, products) => {
    if (err) return res.send("상품 불러오기 실패");
    res.render("resource", { products });
  });
});

// POST /resource - 장바구니에 상품 추가
router.post("/", (req, res) => {
  const productId = req.body.productId;
  console.log("장바구니에 담긴 상품 ID:", productId);

  // 장바구니 로직은 세션이나 DB에 따라 구현 필요
  // 예시: req.session.cart.push(productId);

  res.redirect("/resource");
});

module.exports = router;
