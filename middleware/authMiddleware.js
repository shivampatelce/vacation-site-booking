module.exports = (req, res, next) => {
  if (!global.loggedIn) {
    return res.redirect("/");
  }
  next();
};
