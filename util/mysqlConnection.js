const mysql = require("mysql2");

module.exports = async () => {
  return await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "group_11_vacation_site_bookings",
  });
};
