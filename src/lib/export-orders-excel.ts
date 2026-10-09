import type { AdminOrderRow } from "@/lib/admin-orders";

const sizeOrder = ["6XS", "5XS", "4XS", "3XS", "2XS", "XS", "Do ustalenia"];

const DARK = "FF112017";
const GREEN = "FFA3E635";
const TEXT = "FF203025";
const WHITE = "FFFFFFFF";
const LIGHT = "FFF2F7F1";

type ProductId = AdminOrderRow["productId"];

type ExportPlayer = {
  name: string;
  tracksuits: string[];
  jackets: string[];
  initials: string;
  payment: string;
};

type SizeTotal = {
  productId: ProductId;
  size: string;
  quantity: number;
};

export async function downloadOrdersExcel(rows: AdminOrderRow[]) {
  if (rows.length === 0) return;

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
        initials: row.initials ?? "Bez inicjałów",
        payment: row.paymentStatus === "paid" ? "TAK" : "NIE",
      };

      players.set(row.playerKey, player);
    }

    const description =
      row.quantity > 1 ? `${row.size} × ${row.quantity}` : row.size;

    if (row.productId === "tracksuit") {
      player.tracksuits.push(description);
    } else if (row.productId === "jacket") {
      player.jackets.push(description);
    }

    const key = `${row.productId}:${row.size}`;
    const existing = totals.get(key);

    if (existing) {
      existing.quantity += row.quantity;
    } else {
      totals.set(key, {
        productId: row.productId,
        size: row.size,
        quantity: row.quantity,
      });
    }
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Górnik Radlin";

  const sheet = workbook.addWorksheet("Zamówienia", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = [
    { header: "Zawodnik", key: "name", width: 32 },
    { header: "Dres", key: "tracksuit", width: 22 },
    { header: "Kurtka", key: "jacket", width: 22 },
    { header: "Inicjały", key: "initials", width: 19 },
    { header: "Wpłata", key: "payment", width: 17 },
  ];

  // Nagłówek głównej listy.
  const header = sheet.getRow(1);
  header.height = 30;

  for (let col = 1; col <= 5; col++) {
    const cell = header.getCell(col);

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: DARK },
    };

    cell.font = {
      name: "Aptos",
      bold: true,
      color: { argb: WHITE },
    };

    cell.alignment = {
      vertical: "middle",
      horizontal: col === 1 ? "left" : "center",
    };
  }

  // Jeden zawodnik = jeden wiersz.
  let playerIndex = 0;

  for (const player of players.values()) {
    const row = sheet.addRow([
      player.name,
      player.tracksuits.join(", ") || "—",
      player.jackets.join(", ") || "—",
      player.initials,
      player.payment,
    ]);

    row.height = 27;

    for (let col = 1; col <= 5; col++) {
      const cell = row.getCell(col);

      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb: playerIndex % 2 === 0 ? LIGHT : WHITE,
        },
      };

      cell.font = {
        name: "Aptos",
        size: 11,
        color: { argb: TEXT },
      };

      cell.alignment = {
        vertical: "middle",
        horizontal: col === 1 ? "left" : "center",
        wrapText: true,
      };
    }

    const paymentCell = row.getCell(5);

    paymentCell.font = {
      bold: true,
      color: {
        argb: player.payment === "TAK" ? "FF208040" : "FFC08020",
      },
    };

    playerIndex++;
  }

  // Trzy puste wiersze po liście zawodników.
  const summaryStart = sheet.lastRow!.number + 4;

  const titleRow = sheet.getRow(summaryStart);
  titleRow.getCell(1).value = "PODSUMOWANIE ZAMÓWIENIA";
  titleRow.height = 30;

  sheet.mergeCells(`A${summaryStart}:E${summaryStart}`);

  titleRow.getCell(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: DARK },
  };

  titleRow.getCell(1).font = {
    bold: true,
    size: 13,
    color: { argb: GREEN },
  };

  titleRow.getCell(1).alignment = {
    vertical: "middle",
  };

  // Nagłówki podsumowania.
  const summaryHeader = sheet.getRow(summaryStart + 1);
  summaryHeader.values = ["Produkt", "Rozmiar", "Sztuk"];
  summaryHeader.height = 25;

  for (let col = 1; col <= 3; col++) {
    const cell = summaryHeader.getCell(col);

    cell.font = {
      bold: true,
      color: { argb: DARK },
    };

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: GREEN },
    };
  }

  const sortedTotals = [...totals.values()].sort((a, b) => {
    if (a.productId !== b.productId) {
      return a.productId === "tracksuit" ? -1 : 1;
    }

    const aIndex = sizeOrder.indexOf(a.size);
    const bIndex = sizeOrder.indexOf(b.size);

    return (
      (aIndex < 0 ? 999 : aIndex) - (bIndex < 0 ? 999 : bIndex) ||
      a.size.localeCompare(b.size, "pl")
    );
  });

  let nextRow = summaryStart + 2;

  for (const productId of ["tracksuit", "jacket"] as const) {
    const name = productId === "tracksuit" ? "Dres Academy IV" : "Kurtka";

    const productTotals = sortedTotals.filter(
      (item) => item.productId === productId,
    );

    for (const item of productTotals) {
      const row = sheet.getRow(nextRow++);

      row.values = [name, item.size, item.quantity];

      row.height = 23;
    }

    const quantity = productTotals.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    const totalRow = sheet.getRow(nextRow++);
    totalRow.values = [`${name} — RAZEM`, "", quantity];
    totalRow.height = 26;

    for (let col = 1; col <= 3; col++) {
      const cell = totalRow.getCell(col);

      cell.font = {
        bold: true,
        color: { argb: DARK },
      };

      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE4F5C8" },
      };
    }
  }

  // Przygotowanie pliku .xlsx do pobrania.
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
