const PDFDocument = require("pdfkit");
const { getDetailsForPDF } = require("./bookingService");

module.exports = async (bookingId) => {
  return await getDetailsForPDF(bookingId).then((bookingDetails) => {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const buffers = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      // Calculate X position to center the logo
      const logoX = (doc.page.width - 100) / 2; // Center the logo horizontally
      const logoY = 50; // Set Y position for the logo
      doc.image("./public/img/pdf_logo.jpeg", logoX, logoY, {
        fit: [100, 100],
      });

      doc.moveDown(5);

      // "Escape Heaven" title centered
      doc
        .fontSize(24)
        .font("Helvetica-Bold")
        .text("Escape Heaven", { align: "center" })
        .moveDown(1)
        .font("Helvetica");

      const infoY = doc.y + 20; // Position for receipt details below the title

      // Display receipt details on the left side
      doc.fontSize(12);
      doc
        .font("Helvetica-Bold")
        .text(`RECEIPT ID: `, 50, infoY, { continued: true })
        .font("Helvetica")
        .text(`#${bookingDetails.id.substring(0, 6)}`, 50, infoY);
      doc
        .font("Helvetica-Bold")
        .text(`RECEIPT DATE: `, 50, infoY + 20, { continued: true })
        .font("Helvetica")
        .text(
          `${new Date(bookingDetails.booking_date).toLocaleDateString(
            "en-CA"
          )}`,
          50,
          infoY + 20
        );

      // Display email and website link on the right side
      const rightX = doc.page.width - 270; // Position for the right side text
      doc
        .font("Helvetica-Bold")
        .text(`EMAIL: `, rightX, infoY, { continued: true })
        .font("Helvetica")
        .text(`info@escapeheaven.com`, rightX, infoY);
      doc
        .font("Helvetica-Bold")
        .text(`WEBSITE: `, rightX, infoY + 20, { continued: true })
        .font("Helvetica")
        .text(`www.escapeheaven.com`, rightX, infoY + 20);

      doc.moveDown(2);
      doc.font("Helvetica-Bold");

      const info = doc.y;

      doc.text(`BOOKED BY`, 50, info).font("Helvetica");

      doc.fontSize(12);
      doc
        .font("Helvetica-Bold")
        .text(`NAME: `, 50, info + 20, { continued: true })
        .font("Helvetica")
        .text(
          `${bookingDetails.userDetail.first_name} ${bookingDetails.userDetail.last_name}`,
          50,
          info + 20
        );

      doc
        .font("Helvetica-Bold")
        .text(`EMAIL: `, 50, info + 40, { continued: true })
        .font("Helvetica")
        .text(`${bookingDetails.userDetail.email}`, 50, info + 40);

      doc.moveDown(4);

      // Table Header
      const tableTopY = doc.y; // Start position of the table
      const columnXPositions = [50, 250, 350, 450]; // X positions for each column

      doc
        .font("Helvetica-Bold")
        .text("SITE NAME", columnXPositions[0], tableTopY)
        .text("UNIT COST", columnXPositions[1], tableTopY)
        .text("NO OF NIGHTS", columnXPositions[2], tableTopY)
        .text("AMOUNT", columnXPositions[3], tableTopY);

      // Draw table header lines
      const headerBottomY = tableTopY + 15;
      doc.moveTo(50, headerBottomY).lineTo(550, headerBottomY).stroke();

      // Table Rows
      const rows = [
        {
          description: bookingDetails.siteDetail.name,
          unitCost: bookingDetails.siteDetail.price,
          numberOfNights: bookingDetails.number_of_nights,
          amount: bookingDetails.payment.amount,
        },
      ];

      let currentY = headerBottomY + 10;
      doc.font("Helvetica");
      rows.forEach((row) => {
        doc
          .text(row.description, columnXPositions[0], currentY)
          .text(`$${row.unitCost}`, columnXPositions[1], currentY)
          .text(row.numberOfNights, columnXPositions[2], currentY)
          .text(`$${row.amount}`, columnXPositions[3], currentY);
        currentY += 20;
      });

      // Draw table bottom line
      doc.moveTo(50, currentY).lineTo(550, currentY).stroke();

      doc.moveDown(2);

      // Add Subtotal, Discount, Tax Rate, and Tax Fields
      const summaryStartY = currentY + 10;
      const labelX = 350; // X position for labels
      const valueX = 450; // X position for values

      doc.font("Helvetica-Bold").text("SUBTOTAL:", labelX, summaryStartY);
      doc
        .font("Helvetica")
        .text(`$${bookingDetails.payment.amount}`, valueX, summaryStartY);

      doc.font("Helvetica-Bold").text("DISCOUNT:", labelX, summaryStartY + 20);
      doc.font("Helvetica").text("$0", valueX, summaryStartY + 20);

      doc
        .font("Helvetica-Bold")
        .text("(TAX RATE):", labelX, summaryStartY + 40);
      doc.font("Helvetica").text("13%", valueX, summaryStartY + 40);

      const taxAmount = bookingDetails.payment.amount * 0.13;
      doc.font("Helvetica-Bold").text("TAX:", labelX, summaryStartY + 60);
      doc
        .font("Helvetica")
        .text(`$${taxAmount.toFixed(2)}`, valueX, summaryStartY + 60);

      const total = parseFloat(bookingDetails.payment.amount) + taxAmount;
      doc.font("Helvetica-Bold").text("TOTAL:", labelX, summaryStartY + 80);
      doc
        .font("Helvetica")
        .text(`$${total.toFixed(2)}`, valueX, summaryStartY + 80);

      doc.moveDown(4);

      const additionalInfo = doc.y;

      doc.font("Helvetica-Bold");
      doc.text(`ADDITIONAL INFORMATION`, 50, additionalInfo).font("Helvetica");

      doc
        .fontSize(12)
        .text(
          `For inquiries please contact representative: `,
          50,
          additionalInfo + 20
        )
        .text(
          `${bookingDetails.representativeDetail.name} (PHONE NO: +1 ${bookingDetails.representativeDetail.phone_number})`,
          50,
          additionalInfo + 40
        );

      doc.end();
    });
  });
};
