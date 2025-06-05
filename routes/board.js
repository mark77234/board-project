const path = require("path");
const fs = require("fs");
const multer = require("multer");
const express = require("express");
const sqlite3 = require("sqlite3").verbose();

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer storage configuration
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

const router = express.Router();
const dbPath = path.join(__dirname, "../db/database.sqlite");
const db = new sqlite3.Database(dbPath);

// 게시글 목록
router.get("/", (req, res) => {
  db.all(
    `
        SELECT * FROM posts ORDER BY 
        COALESCE(parent_id, id), id ASC
    `,
    [],
    (err, posts) => {
      if (err) return res.send("목록 불러오기 실패");
      res.render("board", { posts, user: req.session.user });
    }
  );
});

// 글쓰기 폼
router.get("/new", (req, res) => {
  res.render("post", { post: null, parentId: null });
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
          res.redirect("/board");
        });
      } else {
        res.redirect("/board");
      }
    }
  );
});

// 새 글 등록 (author 직접 지정)
router.post("/create", (req, res) => {
  const { author, title, content, parent_id } = req.body;
  db.run(
    "INSERT INTO posts (author, title, content, parent_id) VALUES (?, ?, ?, ?)",
    [author, title, content, parent_id || null],
    function (err) {
      if (err) return res.send("등록 실패");
      res.redirect("/board");
    }
  );
});

// 글 상세
router.get("/view/:id", (req, res) => {
  const postId = req.params.id;

  db.get("SELECT * FROM posts WHERE id = ?", [postId], (err, post) => {
    if (err || !post) return res.send("글 없음");

    db.all(
      "SELECT * FROM files WHERE post_id = ?",
      [postId],
      (fileErr, files) => {
        if (fileErr) return res.send("파일 불러오기 실패");

        res.render("detail", { post, files: files || [] });
      }
    );
  });
});

// 답글 달기 폼
router.get("/reply/:id", (req, res) => {
  const parentId = req.params.id;
  db.get("SELECT title FROM posts WHERE id = ?", [parentId], (err, row) => {
    if (err || !row) return res.send("원글 없음");
    res.render("reply", { parentId, parentTitle: row.title });
  });
});

// 수정 폼
router.get("/edit/:id", (req, res) => {
  if (!req.session.user) {
    return res.status(403).send("로그인이 필요합니다.");
  }

  db.get("SELECT * FROM posts WHERE id = ?", [req.params.id], (err, post) => {
    if (err || !post) return res.send("글 없음");
    if (post.author !== req.session.user.username) {
      return res.status(403).send("수정 권한이 없습니다.");
    }
    res.render("post", { post });
  });
});

// 수정 처리 (파일 업로드 지원)
router.post("/edit/:id", upload.array("files"), (req, res) => {
  if (!req.session.user) {
    return res.status(403).send("로그인이 필요합니다.");
  }

  db.get("SELECT * FROM posts WHERE id = ?", [req.params.id], (err, post) => {
    if (err || !post) return res.send("글 없음");
    if (post.author !== req.session.user.username) {
      return res.status(403).send("수정 권한이 없습니다.");
    }

    const { title, content } = req.body;
    db.run(
      "UPDATE posts SET title = ?, content = ? WHERE id = ?",
      [title, content, req.params.id],
      (err) => {
        if (err) return res.send("수정 실패");
        // Insert new files if uploaded
        if (req.files && req.files.length > 0) {
          const stmt = db.prepare(
            "INSERT INTO files (post_id, filename, filepath) VALUES (?, ?, ?)"
          );
          req.files.forEach((file) => {
            const filename = file.originalname;
            const filepath = path.join("uploads", path.basename(file.path));
            stmt.run(req.params.id, filename, filepath);
          });
          stmt.finalize(() => {
            res.redirect("/board/view/" + req.params.id);
          });
        } else {
          res.redirect("/board/view/" + req.params.id);
        }
      }
    );
  });
});

// 삭제
router.get("/delete/:id", (req, res) => {
  if (!req.session.user) {
    return res.status(403).send("로그인이 필요합니다.");
  }

  db.get("SELECT * FROM posts WHERE id = ?", [req.params.id], (err, post) => {
    if (err || !post) return res.send("글 없음");
    if (post.author !== req.session.user.username) {
      return res.status(403).send("삭제 권한이 없습니다.");
    }

    db.run("DELETE FROM posts WHERE id = ?", [req.params.id], (err) => {
      if (err) return res.send("삭제 실패");
      res.redirect("/board");
    });
  });
});

module.exports = router;
