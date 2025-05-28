const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "../db/database.sqlite");
const db = new sqlite3.Database(dbPath);

// 장바구니에 상품 추가
router.get("/add/:id", (req, res) => {
  const productId = req.params.id;

  db.get("SELECT * FROM products WHERE id = ?", [productId], (err, product) => {
    if (err || !product) return res.status(404).send("상품 없음");

    // 예: 세션에 cart 배열이 없으면 초기화
    if (!req.session.cart) req.session.cart = {};

    // 수량 증가
    if (req.session.cart[productId]) {
      req.session.cart[productId]++;
    } else {
      req.session.cart[productId] = 1;
    }

    res.redirect("/cart"); // 장바구니 페이지로 이동
  });
});

// 장바구니 페이지 (목록 및 수량 보여주기)
router.get("/", (req, res) => {
  const cart = req.session.cart || {};

  const ids = Object.keys(cart);
  if (ids.length === 0) {
    return res.render("cart", { items: [] });
  }

  const placeholders = ids.map(() => "?").join(",");
  db.all(
    `SELECT * FROM products WHERE id IN (${placeholders})`,
    ids,
    (err, products) => {
      if (err) return res.send("장바구니 조회 실패");

      // 가격 포맷팅
      products = products.map((p) => ({
        ...p,
        formattedPrice: p.price.toLocaleString("ko-KR"),
      }));

      res.render("cart", {
        items: products.map((p) => ({
          ...p,
          quantity: cart[p.id],
          total: p.price * cart[p.id],
          formattedTotal: (p.price * cart[p.id]).toLocaleString("ko-KR"),
        })),
      });
    }
  );
});

module.exports = router;
