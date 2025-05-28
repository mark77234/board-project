const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

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
      res.render("board", { posts });
    }
  );
});

// 글쓰기 폼
router.get("/new", (req, res) => {
  res.render("post", { post: null, parentId: null });
});

// 글쓰기 처리
router.post("/new", (req, res) => {
  const { title, content, parent_id } = req.body;
  const author = req.session.user?.username || "익명";

  db.run(
    "INSERT INTO posts (title, content, parent_id, author) VALUES (?, ?, ?, ?)",
    [title, content, parent_id || null, author],
    function (err) {
      if (err) return res.send("작성 실패");
      res.redirect("/board");
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
    res.render("detail", { post });
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
  db.get("SELECT * FROM posts WHERE id = ?", [req.params.id], (err, post) => {
    if (err || !post) return res.send("글 없음");
    res.render("post", { post });
  });
});

// 수정 처리
router.post("/edit/:id", (req, res) => {
  const { title, content } = req.body;
  db.run(
    "UPDATE posts SET title = ?, content = ? WHERE id = ?",
    [title, content, req.params.id],
    (err) => {
      if (err) return res.send("수정 실패");
      res.redirect("/board/view/" + req.params.id);
    }
  );
});

// 삭제
router.get("/delete/:id", (req, res) => {
  db.run("DELETE FROM posts WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.send("삭제 실패");
    res.redirect("/board");
  });
});

module.exports = router;
