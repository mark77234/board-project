const express = require("express");
const bcrypt = require("bcrypt");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const router = express.Router();
const dbPath = path.join(__dirname, "../db/database.sqlite");
const db = new sqlite3.Database(dbPath);

// 회원가입 페이지
router.get("/register", (req, res) => {
  res.render("register");
});

// 회원가입 처리
router.post("/register", async (req, res) => {
  const { username, password, name, gender, address, phone, email } = req.body;
  const agree_privacy = req.body.agree_privacy ? 1 : 0;
  const agree_sms = req.body.agree_sms ? 1 : 0;
  const agree_email = req.body.agree_email ? 1 : 0;
  const hashedPassword = await bcrypt.hash(password, 10);

  // 아이디 중복 확인
  db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
    if (err) {
      console.error(err.message);
      return res.send("회원가입 중 오류가 발생했습니다.");
    }

    if (row) {
      return res.send("이미 존재하는 아이디입니다.");
    }

    // 중복 없으면 회원가입 진행
    db.run(
      "INSERT INTO users (username, password, name, gender, address, phone, email, agree_privacy, agree_sms, agree_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        username,
        hashedPassword,
        name,
        gender,
        address,
        phone,
        email,
        agree_privacy,
        agree_sms,
        agree_email,
      ],
      (err) => {
        if (err) {
          console.error(err.message);
          return res.send("회원가입 중 오류가 발생했습니다.");
        }
        res.redirect("/user/login");
      }
    );
  });
});

// 로그인 페이지
router.get("/login", (req, res) => {
  res.render("login");
});

// 로그인 처리
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, user) => {
      if (err) {
        return res.render("login_failed", {
          message: "로그인 처리 중 오류가 발생했습니다.",
          errorType: "system",
        });
      }

      if (!user) {
        return res.render("login_failed", {
          message: "존재하지 않는 아이디입니다.",
          errorType: "username",
        });
      }

      const match = await bcrypt.compare(password, user.password);
      if (match) {
        req.session.user = user;
        res.redirect("/product");
      } else {
        res.render("login_failed", {
          message: "비밀번호가 일치하지 않습니다.",
          errorType: "password",
        });
      }
    }
  );
});

// 로그아웃
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

module.exports = router;
