const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "../db/database.sqlite");
const db = new sqlite3.Database(dbPath);

// 장바구니에 상품 추가
router.get("/add/:id", (req, res) => {
  const productId = req.params.id;
  const userId = req.session.userId;

  db.get("SELECT * FROM products WHERE id = ?", [productId], (err, product) => {
    if (err || !product) return res.status(404).send("상품 없음");

    // 기존 장바구니 아이템 확인
    db.get(
      "SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?",
      [userId, productId],
      (err, cartItem) => {
        if (err) return res.status(500).send("장바구니 조회 실패");

        if (cartItem) {
          // 수량 증가
          db.run(
            "UPDATE cart_items SET quantity = quantity + 1 WHERE user_id = ? AND product_id = ?",
            [userId, productId]
          );
        } else {
          // 새 아이템 추가
          db.run(
            "INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, 1)",
            [userId, productId]
          );
        }

        res.redirect("/cart");
      }
    );
  });
});

// 장바구니 페이지 (목록 및 수량 보여주기)
router.get("/", (req, res) => {
  const userId = req.session.userId;

  db.all(
    `SELECT p.*, ci.quantity 
     FROM cart_items ci 
     JOIN products p ON ci.product_id = p.id 
     WHERE ci.user_id = ?`,
    [userId],
    (err, products) => {
      if (err) return res.send("장바구니 조회 실패");

      // 가격 포맷팅
      const items = products.map((p) => ({
        ...p,
        formattedPrice: p.price.toLocaleString("ko-KR"),
        total: p.price * p.quantity,
        formattedTotal: (p.price * p.quantity).toLocaleString("ko-KR"),
      }));

      res.render("cart", { items });
    }
  );
});

// 장바구니에서 상품 제거
router.post("/remove/:id", (req, res) => {
  const productId = req.params.id;
  const userId = req.session.userId;

  db.run(
    "DELETE FROM cart_items WHERE user_id = ? AND product_id = ?",
    [userId, productId],
    (err) => {
      if (err) return res.status(500).send("장바구니 삭제 실패");
      res.redirect("/cart");
    }
  );
});

router.post("/checkout", (req, res) => {
  const userId = req.session.userId;

  db.run("DELETE FROM cart_items WHERE user_id = ?", [userId], (err) => {
    if (err) return res.status(500).send("장바구니 비우기 실패");
    res.redirect("checkout/complete");
  });
});

router.get("/checkout/complete", (req, res) => {
  res.render("checkout");
});

module.exports = router;
