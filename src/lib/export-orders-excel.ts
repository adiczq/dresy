import type { AdminOrderRow } from "@/lib/admin-orders";
import { PRODUCT_IDS, PRODUCTS, type ProductId } from "@/lib/products";

const sizeOrder = ["6XS", "5XS", "4XS", "3XS", "2XS", "XS", "Do ustalenia"];

const DARK = "FF11263D";
const ACCENT = "FF60A5FA";
const TEXT = "FF1E293B";
const WHITE = "FFFFFFFF";
const LIGHT = "FFEFF6FF";
const SOFT_BLUE = "FFD9EAFE";
const MONEY = '#,##0" zł"';

type ExportPlayer = {
  name: string;
  tracksuits: string[];
  jackets: string[];
  basicJackets: string[];
  initials: string;
  payment: string;
  total: number;
  missingPrices: boolean;
};

type SizeTotal = {
  productId: ProductId;
  size: string;
  quantity: number;
  total: number;
  missingPrices: boolean;
  unitPrices: Set<number>;
};

export async function downloadOrdersExcel(rows: AdminOrderRow[]) {
  if (!rows.length) return;

  const { default: ExcelJS } = await import("exceljs");
  const players = new Map<string, ExportPlayer>();
  const totals = new Map<string, SizeTotal>();

  for (const row of rows) {
    let player = players.get(row.playerKey);
    if (!player) {
      player = {
        name: row.playerName,
        tracksuits: [],
        jackets: [],
        basicJackets: [],
        initials: row.initials ?? "Bez inicjałów",
        payment: row.paymentStatus === "paid" ? "TAK" : "NIE",
        total: 0,
        missingPrices: false,
      };
      players.set(row.playerKey, player);
    }

    const description = row.quantity > 1 ? `${row.size} × ${row.quantity}` : row.size;
    if (row.productId === "tracksuit") player.tracksuits.push(description);
    if (row.productId === "jacket") player.jackets.push(description);
    if (row.productId === "jacket_basic") player.basicJackets.push(description);

    const key = `${row.productId}:${row.size}`;
    let sizeTotal = totals.get(key);
    if (!sizeTotal) {
      sizeTotal = {
        productId: row.productId,
        size: row.size,
        quantity: 0,
        total: 0,
        missingPrices: false,
        unitPrices: new Set<number>(),
      };
      totals.set(key, sizeTotal);
    }
    sizeTotal.quantity += row.quantity;

    if (row.unitPrice === null) {
      player.missingPrices = true;
      sizeTotal.missingPrices = true;
    } else {
      const amount = row.unitPrice * row.quantity;
      player.total += amount;
      sizeTotal.total += amount;
      sizeTotal.unitPrices.add(row.unitPrice);
    }
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Górnik Radlin";
  const sheet = workbook.addWorksheet("Zamówienia", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  sheet.columns = [
    { header: "Zawodnik", key: "name", width: 32 },
    { header: "Dres", key: "tracksuit", width: 18 },
    { header: "Kurtka Joma", key: "jacket", width: 19 },
    { header: "Kurtka ekonom.", key: "basicJacket", width: 20 },
    { header: "Inicjały", key: "initials", width: 18 },
    { header: "Wpłata", key: "payment", width: 14 },
    { header: "Kwota", key: "total", width: 18 },
  ];

  const heading = sheet.getRow(1);
  heading.height = 30;
  for (let col = 1; col <= 7; col++) {
    const cell = heading.getCell(col);
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: DARK } };
    cell.font = { name: "Aptos", bold: true, color: { argb: WHITE } };
    cell.alignment = { vertical: "middle", horizontal: col === 1 ? "left" : "center" };
  }

  let index = 0;
  for (const player of players.values()) {
    const row = sheet.addRow([
      player.name,
      player.tracksuits.join(", ") || "—",
      player.jackets.join(", ") || "—",
      player.basicJackets.join(", ") || "—",
      player.initials,
      player.payment,
      player.missingPrices ? "—" : player.total,
    ]);
    row.height = 28;
    for (let col = 1; col <= 7; col++) {
      const cell = row.getCell(col);
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: index % 2 === 0 ? LIGHT : WHITE } };
      cell.font = { name: "Aptos", size: 11, color: { argb: TEXT } };
      cell.alignment = { vertical: "middle", horizontal: col === 1 ? "left" : "center", wrapText: true };
    }
    row.getCell(7).numFmt = MONEY;
    row.getCell(6).font = { bold: true, color: { argb: player.payment === "TAK" ? "FF208040" : "FFC08020" } };
    index++;
  }

  // Trzy puste wiersze pomiędzy listą a podsumowaniem.
  const summaryStart = sheet.lastRow!.number + 4;
  sheet.mergeCells(`A${summaryStart}:G${summaryStart}`);
  const title = sheet.getRow(summaryStart);
  title.height = 30;
  title.getCell(1).value = "PODSUMOWANIE ZAMÓWIENIA";
  title.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: DARK } };
  title.getCell(1).font = { bold: true, size: 13, color: { argb: ACCENT } };
  title.getCell(1).alignment = { vertical: "middle" };

  const summaryHeading = sheet.getRow(summaryStart + 1);
  summaryHeading.values = ["Produkt", "Rozmiar", "Sztuk", "Cena jedn. (zł)", "Wartość (zł)"];
  summaryHeading.height = 26;
  for (let col = 1; col <= 5; col++) {
    const cell = summaryHeading.getCell(col);
    cell.font = { bold: true, color: { argb: DARK } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ACCENT } };
  }

  const sorted = [...totals.values()].sort((a, b) =>
    PRODUCT_IDS.indexOf(a.productId) - PRODUCT_IDS.indexOf(b.productId) ||
    sizeOrder.indexOf(a.size) - sizeOrder.indexOf(b.size),
  );

  let nextRow = summaryStart + 2;
  for (const productId of PRODUCT_IDS) {
    const subset = sorted.filter((item) => item.productId === productId);
    for (const item of subset) {
      const row = sheet.getRow(nextRow++);
      row.values = [
        PRODUCTS[productId].shortLabel,
        item.size,
        item.quantity,
        item.missingPrices
          ? "—"
          : item.unitPrices.size === 1
            ? [...item.unitPrices][0]
            : "różne",
        item.missingPrices ? "—" : item.total,
      ];
      row.height = 23;
      row.getCell(4).numFmt = MONEY;
      row.getCell(5).numFmt = MONEY;
    }

    const row = sheet.getRow(nextRow++);
    const missingPrices = subset.some((item) => item.missingPrices);
    row.values = [
      `${PRODUCTS[productId].shortLabel} — RAZEM`,
      "",
      subset.reduce((sum, item) => sum + item.quantity, 0),
      "",
      missingPrices ? "—" : subset.reduce((sum, item) => sum + item.total, 0),
    ];
    row.getCell(5).numFmt = MONEY;
    row.height = 27;
    for (let col = 1; col <= 5; col++) {
      const cell = row.getCell(col);
      cell.font = { bold: true, color: { argb: DARK } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: SOFT_BLUE } };
    }
  }

  const allMissing = [...players.values()].some((player) => player.missingPrices);
  const grandTotal = [...players.values()].reduce((sum, player) => sum + player.total, 0);
  const totalRow = sheet.getRow(nextRow++);
  totalRow.values = ["ŁĄCZNA WARTOŚĆ", "", "", "", allMissing ? "—" : grandTotal];
  totalRow.getCell(5).numFmt = MONEY;
  for (let col = 1; col <= 5; col++) {
    const cell = totalRow.getCell(col);
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: DARK } };
    cell.font = { bold: true, color: { argb: WHITE } };
  }

  if (allMissing) {
    sheet.getRow(nextRow).getCell(1).value =
      "Uwaga: starsze zgłoszenia nie mają zapisanej ceny; wartości oznaczono kreską.";
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const bytes = new Uint8Array(buffer.byteLength);
  bytes.set(new Uint8Array(buffer as unknown as ArrayBuffer));
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "Zamowienia_Gornik_Radlin.xlsx";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
