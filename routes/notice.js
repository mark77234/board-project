const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const multer = require("multer");
const fs = require("fs");

const router = express.Router();
const dbPath = path.join(__dirname, "../db/database.sqlite");
const db = new sqlite3.Database(dbPath);

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads/"));
  },
  filename: function (req, file, cb) {
    // Use original filename, or you can customize (e.g., add timestamp)
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

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

// 글쓰기 폼
router.get("/new", (req, res) => {
  res.render("post-notice", { post: null, parentId: null });
});

// 글쓰기 처리 (파일 업로드 지원)
router.post("/new", upload.array("files"), (req, res) => {
  const { title, content, parent_id } = req.body;
  const author = req.session.user?.username || "익명";

  db.run(
    "INSERT INTO posts (title, content, parent_id, author) VALUES (?, ?, ?, ?)",
    [title, content, parent_id || null, author],
    function (err) {
      if (err) return res.send("작성 실패");
      const postId = this.lastID;
      // Insert file records if files uploaded
      if (req.files && req.files.length > 0) {
        const stmt = db.prepare(
          "INSERT INTO files (post_id, filename, filepath) VALUES (?, ?, ?)"
        );
        req.files.forEach((file) => {
          const filename = file.originalname;
          const filepath = path.join("uploads", path.basename(file.path));
          stmt.run(postId, filename, filepath);
        });
        stmt.finalize(() => {
          res.redirect("/notice");
        });
      } else {
        res.redirect("/notice");
      }
    }
  );
});

module.exports = router;
