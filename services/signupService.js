const connection = require("../util/mysqlConnection");
const { v4: uuidv4 } = require("uuid");

const registerUser = async ({ firstName, lastName, email, password }) => {
  const query = `INSERT INTO user (id, first_name, last_name, email, password) VALUES
    ("${uuidv4()}", "${firstName}", "${lastName}", "${email}", "${password}");`;
  return (await connection()).promise().query(query);
};

module.exports = { registerUser };
