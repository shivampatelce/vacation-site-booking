const connection = require("../util/mysqlConnection");
const { v4: uuidv4 } = require("uuid");
const signinService = require("./signinService");
const siteService = require("./siteService");

const bookSite = async (
  siteId,
  email,
  amount,
  { cardNumber, expiryMonth, expiryYear, cvv, numberOfNights }
) => {
  const { id: userId } = await signinService.getUserByEmail(email);
  if (userId) {
    const creditCardId = uuidv4();
    const query = `INSERT INTO credit_card_detail (id, number, expiry_month, expiry_year, cvv) VALUES
          ("${creditCardId}", ${cardNumber}, ${expiryMonth}, ${expiryYear}, ${cvv});`;
    (await connection())
      .promise()
      .query(query)
      .then(async () => {
        const paymentId = uuidv4();
        const paymentQuery = `INSERT INTO payment (id, amount, credit_card_id) VALUES
          ("${paymentId}", ${amount}, "${creditCardId}");`;

        (await connection())
          .promise()
          .query(paymentQuery)
          .then(async () => {
            const bookingQuery = `INSERT INTO booking (id, payment_id, user_id, vacation_site_id, booking_date, number_of_nights) VALUES
          ("${uuidv4()}", "${paymentId}", "${userId}", "${siteId}", "${new Date().toUTCString()}", "${numberOfNights}");`;

            return (await connection()).promise().query(bookingQuery);
          })
          .catch((error) => {
            console.error(error);
          });
      })
      .catch((error) => {
        console.error(error);
      });
  }
};

const getBookingDetailsByUserId = async (email) => {
  const { id: userId } = await signinService.getUserByEmail(email);
  const query = `SELECT * FROM booking WHERE user_id = "${userId}";`;
  return (await connection())
    .promise()
    .query(query)
    .then(([rows]) => {
      const bookings = Promise.all(
        rows.map(async (booking) => {
          const payment = await getPaymentDetailsById(booking.payment_id);
          const siteDetail = await siteService.getSiteById(
            booking.vacation_site_id
          );
          const representativeDetail =
            await siteService.getRepresentativeByVacationSiteId(
              booking.vacation_site_id
            );
          return {
            ...booking,
            payment,
            siteDetail,
            representativeDetail,
          };
        })
      );
      return bookings;
    })
    .catch((error) => {
      console.error(error);
    });
};

const getPaymentDetailsById = async (paymentId) => {
  const query = `SELECT * FROM payment WHERE id = "${paymentId}";`;
  const [rows] = await (await connection()).promise().query(query);
  return rows[0];
};

const getBookingByBookingId = async (bookingId) => {
  const query = `SELECT * FROM booking WHERE id = "${bookingId}";`;
  const [rows] = await (await connection()).promise().query(query);
  return rows[0];
};

const getDetailsForPDF = async (bookingId) => {
  return getBookingByBookingId(bookingId).then(async (booking) => {
    const payment = await getPaymentDetailsById(booking.payment_id);
    const siteDetail = await siteService.getSiteById(booking.vacation_site_id);
    const userDetail = await signinService.getUserById(booking.user_id);
    const representativeDetail =
      await siteService.getRepresentativeByVacationSiteId(
        booking.vacation_site_id
      );
    return {
      ...booking,
      payment,
      siteDetail,
      userDetail,
      representativeDetail,
    };
  });
};

module.exports = { bookSite, getBookingDetailsByUserId, getDetailsForPDF };
