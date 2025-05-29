const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const router = express.Router();
const dbPath = path.join(__dirname, "../db/database.sqlite");
const db = new sqlite3.Database(dbPath);

router.get("/", (req, res) => {
  db.all(
    "SELECT * FROM posts WHERE title LIKE '[공지]%' ORDER BY created_at DESC",
    (err, rows) => {
      if (err) {
        console.error(err.message);
        return res
          .status(500)
          .send("공지사항을 불러오는 중 오류가 발생했습니다.");
      }
      res.render("notice", { notices: rows });
    }
  );
});

module.exports = router;
