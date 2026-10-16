import type { AdminOrderRow } from "@/lib/admin-orders";
import {
  PACKAGES,
  PRODUCTS,
  PRODUCT_IDS,
  type ProductId,
  formatPrice,
} from "@/lib/products";
import { ORDER_SIZES } from "@/lib/sizes";

const DARK = "FF11263D";
const WHITE = "FFFFFFFF";
const LIGHT = "FFEFF6FF";
const ACCENT = "FF60A5FA";
const MONEY = '#,##0" zł"';

type ExportPlayer = {
  key: string;
  playerName: string;
  group: string;
  packageId: AdminOrderRow["packageId"];
  sizes: Partial<Record<ProductId, string>>;
  initials: string;
  payment: string;
  total: number;
  unpriced: boolean;
};

export async function downloadOrdersExcel(rows: AdminOrderRow[]) {
  if (!rows.length) return;
  const { default: ExcelJS } = await import("exceljs");
  const players = new Map<string, ExportPlayer>();
  const totals = new Map<
    string,
    { productId: ProductId; size: string; count: number }
  >();

  for (const row of rows) {
    let player = players.get(row.playerKey);
    if (!player) {
      player = {
        key: row.playerKey,
        playerName: row.playerName,
        group: row.group,
        packageId: row.packageId,
        sizes: {},
        initials: row.initials ?? "Bez inicjałów",
        payment: row.paymentStatus === "paid" ? "TAK" : "NIE",
        total: row.packageId ? (row.packagePrice ?? 0) : 0,
        unpriced: row.packageId ? row.packagePrice === null : false,
      };
      players.set(row.playerKey, player);
    }
    player.sizes[row.productId] = row.size;
    if (!row.packageId) {
      if (row.unitPrice === null) player.unpriced = true;
      else player.total += row.unitPrice * row.quantity;
    }
    const key = `${row.productId}:${row.size}`;
    const existing = totals.get(key);
    if (existing) existing.count += row.quantity;
    else
      totals.set(key, {
        productId: row.productId,
        size: row.size,
        count: row.quantity,
      });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Górnik Radlin";
  const sheet = workbook.addWorksheet("Zamówienia", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  sheet.columns = [
    { header: "Zawodnik", key: "player", width: 28 },
    { header: "Grupa", key: "group", width: 23 },
    { header: "Pakiet", key: "package", width: 16 },
    { header: "Spodnie", key: "pants", width: 15 },
    { header: "Bluza", key: "sweatshirt", width: 15 },
    { header: "Kurtka I", key: "jacket1", width: 17 },
    { header: "Kurtka II", key: "jacket2", width: 17 },
    { header: "Inicjały", key: "initials", width: 18 },
    { header: "Wpłata", key: "payment", width: 12 },
    { header: "Do zapłaty", key: "price", width: 17 },
  ];
  sheet.getRow(1).height = 30;
  sheet.getRow(1).eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: DARK } };
    cell.font = { bold: true, color: { argb: WHITE } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  let index = 0;
  for (const player of players.values()) {
    const data = [
      player.playerName,
      player.group,
      player.packageId ? PACKAGES[player.packageId].label : "Archiwalne",
      player.sizes.pants ?? player.sizes.tracksuit ?? "—",
      player.sizes.sweatshirt ?? "—",
      player.sizes.jacket_basic ?? "—",
      player.sizes.jacket ?? "—",
      player.initials,
      player.payment,
      player.unpriced ? "—" : player.total,
    ];
    const row = sheet.addRow(data);
    row.height = 26;
    row.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: index % 2 ? WHITE : LIGHT },
      };
      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
      };
    });
    row.getCell(10).numFmt = MONEY;
    index++;
  }

  let cursor = (sheet.lastRow?.number ?? 1) + 4;
  function header(text: string) {
    sheet.mergeCells(cursor, 1, cursor, 10);
    const row = sheet.getRow(cursor++);
    row.getCell(1).value = text;
    row.height = 28;
    row.getCell(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: DARK },
    };
    row.getCell(1).font = { bold: true, color: { argb: ACCENT } };
  }
  header("PODSUMOWANIE PAKIETÓW");
  for (const packageId of ["package_1", "package_2"] as const) {
    const matching = [...players.values()].filter(
      (p) => p.packageId === packageId,
    );
    const total = matching.reduce((sum, p) => sum + p.total, 0);
    const row = sheet.getRow(cursor++);
    row.values = [
      PACKAGES[packageId].label,
      "",
      matching.length,
      `Katalog: ${formatPrice(PACKAGES[packageId].catalogPrice)}`,
      `Dofin.: ${formatPrice(PACKAGES[packageId].catalogPrice - PACKAGES[packageId].price)}`,
      "",
      "",
      "",
      "",
      total,
    ];
    row.getCell(10).numFmt = MONEY;
    row.getCell(1).font = { bold: true };
  }
  const historical = [...players.values()].filter((p) => !p.packageId);
  if (historical.length) {
    const row = sheet.getRow(cursor++);
    row.values = [
      "Zamówienia archiwalne",
      "",
      historical.length,
      "",
      "",
      "",
      "",
      "",
      "",
      historical.some((p) => p.unpriced)
        ? "—"
        : historical.reduce((sum, p) => sum + p.total, 0),
    ];
    row.getCell(10).numFmt = MONEY;
  }
  const overall = sheet.getRow(cursor++);
  overall.values = [
    "SUMA WPŁAT",
    "",
    players.size,
    "",
    "",
    "",
    "",
    "",
    "",
    [...players.values()].some((p) => p.unpriced)
      ? "—"
      : [...players.values()].reduce((sum, p) => sum + p.total, 0),
  ];
  overall.getCell(10).numFmt = MONEY;
  overall.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: DARK } };
    cell.font = { bold: true, color: { argb: WHITE } };
  });

  cursor += 2;
  header("ZESTAWIENIE PRODUKTÓW DLA DOSTAWCY · NUMERY KATALOGOWE");
  const sorted = [...totals.values()].sort(
    (a, b) =>
      PRODUCT_IDS.indexOf(a.productId) - PRODUCT_IDS.indexOf(b.productId) ||
      ORDER_SIZES.indexOf(a.size as (typeof ORDER_SIZES)[number]) -
        ORDER_SIZES.indexOf(b.size as (typeof ORDER_SIZES)[number]),
  );
  for (const entry of sorted) {
    const row = sheet.getRow(cursor++);
    row.values = [
      PRODUCTS[entry.productId].shortLabel,
      PRODUCTS[entry.productId].catalogNumber,
      entry.size,
      entry.count,
    ];
    row.getCell(1).font = { bold: true };
    row.getCell(2).alignment = { horizontal: "center" };
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
