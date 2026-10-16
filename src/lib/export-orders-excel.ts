import type { AdminOrderRow } from "@/lib/admin-orders";
import { PACKAGES, PRODUCTS, PRODUCT_IDS, type ProductId } from "@/lib/products";
import { ORDER_SIZES } from "@/lib/sizes";

const DARK = "FF11263D";
const WHITE = "FFFFFFFF";
const LIGHT = "FFEFF6FF";
const MONEY = '#,##0" zł"';

type Player = {
  name: string;
  group: string;
  number: number | null;
  batchNumber: number | null;
  packageId: AdminOrderRow["packageId"];
  sizes: Partial<Record<ProductId, string>>;
  payment: string;
  total: number;
  unpriced: boolean;
};

export async function downloadOrdersExcel(rows: AdminOrderRow[]) {
  if (!rows.length) return;
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Górnik Radlin";

  const orders = workbook.addWorksheet("Zamówienia", { views: [{ state: "frozen", ySplit: 1 }] });
  const supplier = workbook.addWorksheet("Dla dostawcy", { views: [{ state: "frozen", ySplit: 1 }] });
  const totals = workbook.addWorksheet("Zestawienie", { views: [{ state: "frozen", ySplit: 1 }] });

  orders.columns = [
    { header: "Nr odzieży", key: "number", width: 15 },
    { header: "Zawodnik", key: "name", width: 28 },
    { header: "Grupa", key: "group", width: 24 },
    { header: "Pakiet", key: "package", width: 16 },
    { header: "Spodnie", key: "pants", width: 14 },
    { header: "Bluza", key: "sweatshirt", width: 14 },
    { header: "Kurtka I", key: "jacket1", width: 15 },
    { header: "Kurtka II", key: "jacket2", width: 15 },
    { header: "Partia", key: "batch", width: 16 },
    { header: "Wpłata", key: "payment", width: 13 },
    { header: "Do zapłaty", key: "total", width: 18 },
  ];
  supplier.columns = [
    { header: "Nr odzieży", key: "number", width: 15 },
    { header: "Partia", key: "batch", width: 16 },
    { header: "Zawodnik", key: "name", width: 28 },
    { header: "Grupa", key: "group", width: 24 },
    { header: "Produkt", key: "product", width: 24 },
    { header: "Nr katalogowy Joma", key: "catalog", width: 23 },
    { header: "Rozmiar", key: "size", width: 14 },
    { header: "Ilość", key: "quantity", width: 10 },
  ];
  totals.columns = [
    { header: "Produkt / pakiet", key: "product", width: 29 },
    { header: "Nr katalogowy", key: "catalog", width: 23 },
    { header: "Rozmiar", key: "size", width: 16 },
    { header: "Ilość", key: "quantity", width: 12 },
    { header: "Kwota", key: "amount", width: 19 },
  ];

  const players = new Map<string, Player>();
  const productTotals = new Map<string, { product: ProductId; size: string; count: number }>();
  const packageTotals = { package_1: { count: 0, amount: 0 }, package_2: { count: 0, amount: 0 } };

  for (const row of [...rows].sort((a, b) =>
    (a.number ?? 9999) - (b.number ?? 9999) ||
    PRODUCT_IDS.indexOf(a.productId) - PRODUCT_IDS.indexOf(b.productId)
  )) {
    let player = players.get(row.playerKey);
    if (!player) {
      player = {
        name: row.playerName,
        group: row.group,
        number: row.number,
        batchNumber: row.batchNumber,
        packageId: row.packageId,
        sizes: {},
        payment: row.paymentStatus === "paid" ? "TAK" : "NIE",
        total: row.packageId ? row.packagePrice ?? 0 : 0,
        unpriced: row.packageId ? row.packagePrice === null : false,
      };
      players.set(row.playerKey, player);
      if (row.packageId) {
        packageTotals[row.packageId].count++;
        packageTotals[row.packageId].amount += row.packagePrice ?? 0;
      }
    }
    player.sizes[row.productId] = row.size;
    if (!row.packageId) {
      if (row.unitPrice === null) player.unpriced = true;
      else player.total += row.unitPrice * row.quantity;
    }
    const key = `${row.productId}:${row.size}`;
    const existing = productTotals.get(key);
    if (existing) existing.count += row.quantity;
    else productTotals.set(key, { product: row.productId, size: row.size, count: row.quantity });

    supplier.addRow({
      number: row.number ?? "—",
      batch: row.batchNumber !== null ? `Partia ${row.batchNumber}` : "ROBOCZA",
      name: row.playerName,
      group: row.group,
      product: PRODUCTS[row.productId].shortLabel,
      catalog: PRODUCTS[row.productId].catalogNumber,
      size: row.size,
      quantity: row.quantity,
    });
  }

  for (const player of [...players.values()].sort((a, b) =>
    (a.number ?? 9999) - (b.number ?? 9999) || a.name.localeCompare(b.name, "pl"))) {
    const excelRow = orders.addRow({
      number: player.number ?? "—",
      name: player.name,
      group: player.group,
      package: player.packageId ? PACKAGES[player.packageId].label : "Archiwalne",
      pants: player.sizes.pants ?? player.sizes.tracksuit ?? "—",
      sweatshirt: player.sizes.sweatshirt ?? "—",
      jacket1: player.sizes.jacket_basic ?? "—",
      jacket2: player.sizes.jacket ?? "—",
      batch: player.batchNumber !== null ? `Partia ${player.batchNumber}` : "ROBOCZA",
      payment: player.payment,
      total: player.unpriced ? "—" : player.total,
    });
    excelRow.getCell(11).numFmt = MONEY;
  }

  for (const packageId of ["package_1", "package_2"] as const) {
    totals.addRow({
      product: PACKAGES[packageId].label,
      quantity: packageTotals[packageId].count,
      amount: packageTotals[packageId].amount,
    }).getCell(5).numFmt = MONEY;
  }
  totals.addRow({});
  for (const item of [...productTotals.values()].sort((a, b) =>
    PRODUCT_IDS.indexOf(a.product) - PRODUCT_IDS.indexOf(b.product) ||
    ORDER_SIZES.indexOf(a.size as typeof ORDER_SIZES[number]) - ORDER_SIZES.indexOf(b.size as typeof ORDER_SIZES[number]))) {
    totals.addRow({
      product: PRODUCTS[item.product].shortLabel,
      catalog: PRODUCTS[item.product].catalogNumber,
      size: item.size,
      quantity: item.count,
    });
  }

  for (const sheet of [orders, supplier, totals]) {
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheet.columnCount } };
    sheet.getRow(1).height = 31;
    sheet.getRow(1).eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: DARK } };
      cell.font = { bold: true, color: { argb: WHITE } };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });
    for (let i = 2; i <= sheet.rowCount; i++) {
      const row = sheet.getRow(i);
      row.height = 25;
      row.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: i % 2 ? WHITE : LIGHT } };
        cell.alignment = { vertical: "middle", horizontal: "center" };
      });
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const bytes = new Uint8Array(buffer.byteLength);
  bytes.set(new Uint8Array(buffer as unknown as ArrayBuffer));
  const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const batches = [...new Set(rows.map((row) => row.batchNumber))];
  link.download = batches.length === 1 && batches[0] !== null
    ? `Gornik_Radlin_Partia_${batches[0]}.xlsx`
    : "Gornik_Radlin_Zamowienia.xlsx";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
