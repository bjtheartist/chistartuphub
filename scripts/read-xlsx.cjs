/**
 * Read Excel file and output as JSON
 */
const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(process.env.HOME, 'Downloads', 'q1_2026_funding_opportunities.xlsx');
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet);

console.log(JSON.stringify(data, null, 2));
