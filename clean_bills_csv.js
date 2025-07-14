const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { parse } = require('json2csv');

const inputFile = path.join(__dirname, 'Bills.csv');
const outputFile = path.join(__dirname, 'Bills_cleaned.csv');

const rows = [];
let headers = [];

fs.createReadStream(inputFile)
  .pipe(csv())
  .on('headers', (hdrs) => {
    headers = hdrs;
  })
  .on('data', (row) => {
    // Clean all fields: trim spaces
    Object.keys(row).forEach(key => {
      if (row[key] !== undefined && row[key] !== null) {
        row[key] = row[key].toString().trim();
      }
    });

    // Ensure customerid is a string with no spaces, or a number
    if (row.customerid) {
      // Remove all non-digit characters (optional, or just trim)
      row.customerid = row.customerid.replace(/\\D/g, '');
    }

    rows.push(row);
  })
  .on('end', () => {
    // Write cleaned CSV
    const csvData = parse(rows, { fields: headers });
    fs.writeFileSync(outputFile, csvData, 'utf8');
    console.log(`Cleaned CSV written to ${outputFile}`);
    // Optionally, print a summary
    const uniqueCustomers = new Set(rows.map(r => r.customerid));
    console.log(`Unique customer IDs: ${uniqueCustomers.size}`);
    console.log(`Total rows: ${rows.length}`);
  });