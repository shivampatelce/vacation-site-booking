const connection = require("../util/mysqlConnection");
const { v4: uuidv4 } = require("uuid");

const addSite = async (
  { siteName, description, address, price, representativeName, phoneNumber },
  filePath
) => {
  const siteId = uuidv4();
  const query = `INSERT INTO vacation_site (id, name, description, address, price, imgPath) VALUES
    ("${siteId}", "${siteName}", "${description}", "${address}", "${price}", "${filePath}");`;

  return (await connection())
    .promise()
    .query(query)
    .then(async () => {
      const addRepresentativeQuery = `INSERT INTO customer_support (id, name, phone_number, vacation_site_id) VALUES
    ("${uuidv4()}", "${representativeName}", "${phoneNumber}", "${siteId}");`;
      return (await connection()).promise().query(addRepresentativeQuery);
    });
};

const getSites = async () => {
  const query = `SELECT * FROM vacation_site;`;
  return (await connection())
    .promise()
    .query(query)
    .then(([rows]) => {
      return rows;
    })
    .catch(() => {
      return null;
    });
};

const getSiteById = async (siteId) => {
  const query = `SELECT * FROM vacation_site WHERE id = ?`;
  return (await connection())
    .promise()
    .query(query, [siteId])
    .then(([rows]) => {
      return rows[0];
    })
    .catch((error) => {
      console.error(error);
      return null;
    });
};

const getRepresentativeByVacationSiteId = async (siteId) => {
  const query = `SELECT * FROM customer_support WHERE vacation_site_id = "${siteId}";`;
  const [rows] = await (await connection()).promise().query(query);
  return rows[0];
};

module.exports = {
  addSite,
  getSites,
  getSiteById,
  getRepresentativeByVacationSiteId,
};
