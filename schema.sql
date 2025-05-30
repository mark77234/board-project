-- 회원 테이블
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL
);

-- 게시글 테이블 (공지사항 + 문의글 통합)
CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    parent_id INTEGER, -- NULL이면 원글, 아니면 답글
    author TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 파일 테이블
CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    filepath TEXT NOT NULL,
    FOREIGN KEY(post_id) REFERENCES posts(id)
);
