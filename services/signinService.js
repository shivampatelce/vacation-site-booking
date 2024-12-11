const connection = require("../util/mysqlConnection");

const getUserByEmail = async (email) => {
  const query = `SELECT * FROM user WHERE email = '${email}';`;
  return (await connection())
    .promise()
    .query(query)
    .then(([rows]) => {
      const user = rows[0];
      return user;
    })
    .catch(() => {
      throw new Error(`User with email ${email} is not available`);
    });
};

const authenticateUser = async ({ email, password }) => {
  const user = await getUserByEmail(email);
  if (user) {
    userType = await getUserTypeByEmail(email);
    return password === user.password;
  }
  return false;
};

const getUserTypeByEmail = async (email) => {
  const user = await getUserByEmail(email);
  const query = `SELECT * FROM user_type WHERE id = ${user.user_type_id};`;
  return (await connection())
    .promise()
    .query(query)
    .then(([rows]) => {
      const userType = rows[0];
      return userType.type;
    })
    .catch(() => {
      return null;
    });
};

const getUserById = async (userId) => {
  const query = `SELECT * FROM user WHERE id = "${userId}";`;
  const [rows] = await (await connection()).promise().query(query);
  return rows[0];
};

module.exports = {
  authenticateUser,
  getUserTypeByEmail,
  getUserByEmail,
  getUserById,
};
