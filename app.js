const express = require("express");
const path = require("path");
const fileUpload = require("express-fileupload");

const signUpService = require("./services/signUpService");
const signinService = require("./services/signinService");
const expressSession = require("express-session");
const adminMiddleware = require("./middleware/adminMiddleware");
const siteService = require("./services/siteService");
const authMiddleware = require("./middleware/authMiddleware");
const bookingService = require("./services/bookingService");
const pdfService = require("./services/pdfService");

const PORT = 3000;

const app = express();

app.use(express.static(path.join(__dirname, "public")));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());
app.use(express.static("uploads"));

global.loggedIn = null;
global.userType = null;

app.use(
  expressSession({
    secret: "secretKey",
  })
);

// Set session
app.use("*", async (req, res, next) => {
  loggedIn = req.session.email;
  if (loggedIn) {
    await signinService.getUserTypeByEmail(loggedIn).then((userType) => {
      global.userType = userType;
      next();
    });
  } else {
    next();
  }
});

// Set EJS as the view engine for rendering HTML pages
app.set("view engine", "ejs");

app.get("/", async (req, res) => {
  await siteService.getSites().then((sites) => {
    res.render("index", {
      path: "/",
      sites,
    });
  });
});

app.get("/add-site", adminMiddleware, (req, res) => {
  res.render("admin", {
    path: "/add-site",
  });
});

app.post("/add-site", adminMiddleware, (req, res) => {
  let image = req.files.siteImage;
  image.mv(path.resolve(__dirname + "/public/img/" + image.name), async () => {
    await siteService.addSite(req.body, image.name).then(() => {
      res.redirect("/add-site");
    });
  });
});

app.get("/book", authMiddleware, async (req, res) => {
  const { siteId } = req.query;
  const site = await siteService.getSiteById(siteId);
  if (site) {
    res.render("booking", {
      path: "/book",
      price: site.price,
      siteId,
    });
  } else {
    res.render("booking", {
      path: "/book",
      price: 0,
      siteId,
    });
  }
});

app.post("/booking", authMiddleware, async (req, res) => {
  const { price, siteId } = req.query;
  const { numberOfNights } = req.body;
  const amount = price * numberOfNights;

  await bookingService.bookSite(siteId, loggedIn, amount, req.body).then(() => {
    res.redirect("/");
  });
});

app.get("/booking-history", authMiddleware, async (req, res) => {
  await bookingService.getBookingDetailsByUserId(loggedIn).then((bookings) => {
    res.render("booking-history", {
      path: "/booking-history",
      bookings,
    });
  });
});

app.get("/signin", (req, res) => {
  res.render("signin", {
    path: "/signin",
  });
});

app.post("/signin", async (req, res) => {
  const isAuthenticated = await signinService.authenticateUser(req.body);
  if (isAuthenticated) {
    const { email } = req.body;
    req.session.email = email;
    if (userType === "ADMIN") {
      res.redirect("/add-site");
    } else {
      res.redirect("/");
    }
  } else {
    res.render("signin", {
      path: "/signin",
    });
  }
});

app.get("/signup", (req, res) => {
  res.render("signup", {
    path: "/signin",
  });
});

app.post("/signup", async (req, res) => {
  await signUpService
    .registerUser(req.body)
    .then(() => {
      res.redirect("/signin");
    })
    .catch((error) => {
      console.error(error);
    });
});

app.get("/logout", (req, res) => {
  global.loggedIn = null;
  global.userType = null;
  req.session.destroy(() => {
    res.redirect("/signin");
  });
});

app.get("/generate-receipt", async (req, res) => {
  const { bookingId } = req.query;
  try {
    const pdfBuffer = await pdfService(bookingId);

    // Set headers for the PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=receipt.pdf");

    // Send the PDF buffer in response
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).send("An error occurred while generating the PDF.");
  }
});

app.listen(PORT, () => {
  console.log(`App is running on http://localhost:${PORT}`);
});
