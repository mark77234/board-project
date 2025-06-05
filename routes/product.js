const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const router = express.Router();
const dbPath = path.join(__dirname, "../db/database.sqlite");
const db = new sqlite3.Database(dbPath);

// GET /product - 상품 목록 페이지 렌더링
router.get("/", (req, res) => {
  db.all("SELECT * FROM products", [], (err, products) => {
    if (err) return res.send("상품 불러오기 실패");
    res.render("product", { products });
  });
});

// POST /product - 장바구니에 상품 추가
router.post("/", (req, res) => {
  const productId = req.body.productId;
  const userId = req.session.userId;

  // 로그인 체크를 더 엄격하게 수행
  if (!userId || typeof userId !== "number") {
    return res.status(401).json({
      success: false,
      message: "로그인이 필요합니다. 로그인 후 다시 시도해주세요.",
    });
  }

  db.get("SELECT * FROM products WHERE id = ?", [productId], (err, product) => {
    if (err || !product) {
      return res.status(404).json({
        success: false,
        message: "상품을 찾을 수 없습니다.",
      });
    }

    // 기존 장바구니 아이템 확인
    db.get(
      "SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?",
      [userId, productId],
      (err, cartItem) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "장바구니 조회 실패",
          });
        }

        if (cartItem) {
          // 수량 증가
          db.run(
            "UPDATE cart_items SET quantity = quantity + 1 WHERE user_id = ? AND product_id = ?",
            [userId, productId],
            (err) => {
              if (err) {
                return res.status(500).json({
                  success: false,
                  message: "장바구니 수정 실패",
                });
              }
              res.redirect("/product");
            }
          );
        } else {
          // 새 아이템 추가
          db.run(
            "INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, 1)",
            [userId, productId],
            (err) => {
              if (err) {
                return res.status(500).json({
                  success: false,
                  message: "장바구니 추가 실패",
                });
              }
              res.redirect("/product");
            }
          );
        }
      }
    );
  });
});

module.exports = router;
