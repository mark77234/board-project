const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const router = express.Router();
const dbPath = path.join(__dirname, "../db/database.sqlite");
const db = new sqlite3.Database(dbPath);

// GET /mypage - 마이페이지 렌더링
router.get("/", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/user/login");
  }

  const username = req.session.user.username;
  db.get(
    "SELECT name, gender, address, phone, email FROM users WHERE username = ?",
    [username],
    (err, user) => {
      if (err || !user) {
        console.error(err);
        return res.send("사용자 정보를 가져오는 데 실패했습니다.");
      }
      res.render("mypage", { user });
    }
  );
});

// POST /mypage/update - 사용자 정보 업데이트 처리
router.post("/update", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/user/login");
  }

  const username = req.session.user.username;
  const { name, gender, address, phone, email } = req.body;

  db.run(
    "UPDATE users SET name = ?, gender = ?, address = ?, phone = ?, email = ? WHERE username = ?",
    [name, gender, address, phone, email, username],
    (err) => {
      if (err) {
        console.error(err);
        return res.send("사용자 정보 수정에 실패했습니다.");
      }
      res.redirect("/resource");
    }
  );
});

module.exports = router;
