module.exports = (req, res, next) => {
  if (global.userType !== "ADMIN") {
    return res.redirect("/");
  }
  next();
};
