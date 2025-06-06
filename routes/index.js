var express = require("express");
var router = express.Router();
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "../db/database.sqlite");
const db = new sqlite3.Database(dbPath);

/* GET home page. */
router.get("/", function (req, res, next) {
  // 추천 상품 가져오기 (is_featured가 1인 상품 중 최대 4개)
  db.all(
    "SELECT * FROM products WHERE is_featured = 1 LIMIT 4",
    [],
    (err, featuredProducts) => {
      if (err) {
        console.error("추천 상품 조회 실패:", err);
        featuredProducts = [];
      }
      res.render("index", {
        title: "Express",
        featuredProducts: featuredProducts || [],
      });
    }
  );
});

module.exports = router;
