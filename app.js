var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

const session = require("express-session");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");

const userRouter = require("./routes/user");

var app = express();

app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

// view engine setup

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/user", userRouter);

const boardRouter = require("./routes/board");
app.use("/board", boardRouter);

app.use("/product", require("./routes/product"));

const cartRouter = require("./routes/cart");
app.use("/cart", cartRouter);

const wishlistRouter = require("./routes/wishlist");
app.use("/wishlist", wishlistRouter);

const mypageRouter = require("./routes/mypage");
app.use("/mypage", mypageRouter);

const noticeRouter = require("./routes/notice");
app.use("/notice", noticeRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
