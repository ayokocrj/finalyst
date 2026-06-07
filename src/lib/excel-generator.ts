import ExcelJS from "exceljs";

export interface FinancialYear {
  year: string;
  revenue: number;
  cogs: number;
  opex: number;
  netIncome: number;
}

export interface ExcelModelData {
  companyName: string;
  dealSize: number; // Purchase Price
  netDebt?: number;
  leverageMultiple?: number; // e.g., 3.0x EBITDA
  financials: FinancialYear[];
}

/**
 * Generates a professionally styled LBO / Financial model spreadsheet using exceljs.
 * Implements actual Excel formulas for totals and margins, with PE navy blue theme.
 */
export async function generateExcelModelBuffer(data: ExcelModelData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Finalyst AI Workstation";
  workbook.lastModifiedBy = "Finalyst AI Workstation";

  // Colors
  const headerBgColor = "1E3A8A"; // Deep Navy Blue
  const accentBgColor = "F3F4F6"; // Slate/Gray-100
  const whiteColor = "FFFFFF";

  // ==========================================
  // SHEET 1: DEAL DASHBOARD
  // ==========================================
  const dashboardSheet = workbook.addWorksheet("Deal Dashboard");
  dashboardSheet.views = [{ showGridLines: true }];

  // Column widths
  dashboardSheet.columns = [
    { width: 25 },
    { width: 20 },
    { width: 15 },
    { width: 30 }
  ];

  // Header Title
  dashboardSheet.mergeCells("A1:D1");
  const titleCell = dashboardSheet.getCell("A1");
  titleCell.value = `FINALYST INVESTMENT DASHBOARD: ${data.companyName.toUpperCase()}`;
  titleCell.font = { name: "Calibri", size: 16, bold: true, color: { argb: whiteColor } };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: headerBgColor }
  };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  dashboardSheet.getRow(1).height = 40;

  // Add Section Headers
  dashboardSheet.getCell("A3").value = "Transaction Overview";
  dashboardSheet.getCell("A3").font = { name: "Calibri", size: 13, bold: true, color: { argb: headerBgColor } };
  
  // Setup data rows
  const dashboardRows = [
    ["Target Company Name", data.companyName],
    ["Enterprise Value (EV)", data.dealSize],
    ["Net Debt at Close", data.netDebt ?? 0],
    ["Target Leverage (x EBITDA)", data.leverageMultiple ?? 3.0],
  ];

  dashboardRows.forEach((rowVal, idx) => {
    const rowNum = 4 + idx;
    const r = dashboardSheet.getRow(rowNum);
    r.getCell(1).value = rowVal[0];
    r.getCell(2).value = rowVal[1];
    
    // Formatting
    r.getCell(1).font = { name: "Calibri", size: 11, bold: true };
    r.getCell(2).alignment = { horizontal: "right" };

    if (rowVal[0] === "Target Company Name") {
      r.getCell(2).font = { name: "Calibri", size: 11, bold: true };
      r.getCell(2).alignment = { horizontal: "left" };
    } else if (rowVal[0] === "Target Leverage (x EBITDA)") {
      r.getCell(2).numFmt = '0.0"x"';
    } else {
      r.getCell(2).numFmt = "$#,##0";
    }
  });

  // Dynamic Valuation Multiples using Formulas referencing Sheet 2
  const valuationStartRow = 9;
  dashboardSheet.getCell(`A${valuationStartRow}`).value = "Implied Valuation Multiples";
  dashboardSheet.getCell(`A${valuationStartRow}`).font = { name: "Calibri", size: 13, bold: true, color: { argb: headerBgColor } };

  // Implied EV/Revenue: EV / Revenue Year 3
  dashboardSheet.getCell(`A${valuationStartRow + 1}`).value = "EV / Revenue (LTM)";
  dashboardSheet.getCell(`B${valuationStartRow + 1}`).value = {
    formula: `=B4/'Historical Financials'!${String.fromCharCode(65 + data.financials.length)}4`,
    result: 0
  };
  dashboardSheet.getCell(`B${valuationStartRow + 1}`).numFmt = '0.00"x"';
  dashboardSheet.getCell(`A${valuationStartRow + 1}`).font = { name: "Calibri", size: 11, bold: true };

  // Implied EV/EBITDA: EV / EBITDA Year 3
  dashboardSheet.getCell(`A${valuationStartRow + 2}`).value = "EV / EBITDA (LTM)";
  dashboardSheet.getCell(`B${valuationStartRow + 2}`).value = {
    formula: `=B4/'Historical Financials'!${String.fromCharCode(65 + data.financials.length)}9`,
    result: 0
  };
  dashboardSheet.getCell(`B${valuationStartRow + 2}`).numFmt = '0.00"x"';
  dashboardSheet.getCell(`A${valuationStartRow + 2}`).font = { name: "Calibri", size: 11, bold: true };

  // Bordering and styling the dashboard
  for (let r = 4; r <= 11; r++) {
    dashboardSheet.getRow(r).getCell(1).border = { bottom: { style: "thin", color: { argb: "E5E7EB" } } };
    dashboardSheet.getRow(r).getCell(2).border = { bottom: { style: "thin", color: { argb: "E5E7EB" } } };
  }

  // ==========================================
  // SHEET 2: HISTORICAL FINANCIALS
  // ==========================================
  const financialsSheet = workbook.addWorksheet("Historical Financials");
  financialsSheet.views = [{ showGridLines: true }];

  // Column widths: Column A (Metric) is wider, others match year count
  financialsSheet.columns = [
    { width: 30 },
    ...data.financials.map(() => ({ width: 18 }))
  ];

  // Title Row
  financialsSheet.mergeCells(1, 1, 1, data.financials.length + 1);
  const finTitle = financialsSheet.getCell("A1");
  finTitle.value = "HISTORICAL INCOME STATEMENT";
  finTitle.font = { name: "Calibri", size: 14, bold: true, color: { argb: whiteColor } };
  finTitle.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: headerBgColor }
  };
  finTitle.alignment = { vertical: "middle", horizontal: "center" };
  financialsSheet.getRow(1).height = 30;

  // Header Year Headers
  const headerRow = financialsSheet.getRow(3);
  headerRow.getCell(1).value = "Financial Metric";
  headerRow.getCell(1).font = { name: "Calibri", size: 11, bold: true };
  headerRow.getCell(1).border = { bottom: { style: "medium", color: { argb: "000000" } } };

  data.financials.forEach((item, idx) => {
    const colLetter = String.fromCharCode(66 + idx); // B, C, D...
    const cell = headerRow.getCell(idx + 2);
    cell.value = item.year;
    cell.font = { name: "Calibri", size: 11, bold: true };
    cell.alignment = { horizontal: "right" };
    cell.border = { bottom: { style: "medium", color: { argb: "000000" } } };
  });

  // Setup account rows
  const metrics = [
    { name: "Chiffre d'Affaires (Revenue)", key: "revenue" },
    { name: "Cost of Goods Sold (COGS)", key: "cogs" },
    { name: "Marge Brute (Gross Profit)", key: "grossProfit", formula: (col: string) => `=${col}4-${col}5` },
    { name: "Marge Brute %", key: "grossMargin", formula: (col: string) => `=${col}6/${col}4`, percent: true },
    { name: "Operating Expenses (Opex)", key: "opex", formula: (col: string) => `=${col}4*0.4` }, // Default opex proxy if opex not provided
    { name: "EBITDA", key: "ebitda", formula: (col: string) => `=${col}6-${col}8` },
    { name: "Marge EBITDA %", key: "ebitdaMargin", formula: (col: string) => `=${col}9/${col}4`, percent: true },
    { name: "Net Income", key: "netIncome" }
  ];

  metrics.forEach((metric, metricIdx) => {
    const rowNum = 4 + metricIdx;
    const r = financialsSheet.getRow(rowNum);
    r.getCell(1).value = metric.name;
    r.getCell(1).font = { name: "Calibri", size: 11, bold: ["Marge Brute (Gross Profit)", "EBITDA", "Net Income"].includes(metric.name) };

    data.financials.forEach((item, yearIdx) => {
      const colLetter = String.fromCharCode(66 + yearIdx);
      const cell = r.getCell(yearIdx + 2);

      if (metric.formula) {
        cell.value = {
          formula: metric.formula(colLetter),
          result: 0
        };
      } else if (metric.key === "netIncome") {
        cell.value = item.netIncome;
      } else {
        cell.value = (item as any)[metric.key];
      }

      // Formatting numbers
      if (metric.percent) {
        cell.numFmt = "0.0%";
        cell.font = { name: "Calibri", size: 10, italic: true };
      } else {
        cell.numFmt = "$#,##0";
      }
    });

    // Formatting cell borders (Standard PE accounting formats)
    if (["Marge Brute (Gross Profit)", "EBITDA"].includes(metric.name)) {
      // Bold subtotal rows, light gray background
      r.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: accentBgColor }
      };
      r.font = { name: "Calibri", size: 11, bold: true };
      for (let c = 1; c <= data.financials.length + 1; c++) {
        r.getCell(c).border = {
          top: { style: "thin", color: { argb: "000000" } },
          bottom: { style: "thin", color: { argb: "000000" } }
        };
      }
    }

    if (metric.name === "Net Income") {
      // Bottom total row double underlines
      r.font = { name: "Calibri", size: 11, bold: true };
      for (let c = 1; c <= data.financials.length + 1; c++) {
        r.getCell(c).border = {
          top: { style: "thin", color: { argb: "000000" } },
          bottom: { style: "double", color: { argb: "000000" } }
        };
      }
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
