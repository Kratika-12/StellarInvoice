import { createServerFn } from "@tanstack/react-start";

export type InvoiceData = {
  id: string;
  amount: string;
  description: string;
  dueDate?: string;
  createdAt: number;
  from: string;
  status: "pending" | "paid";
  txHash?: string;
  contractTxHash?: string;
};

async function getDbFile() {
  const path = await import("path");
  return path.join(process.cwd(), "db.json");
}

async function readDb(): Promise<InvoiceData[]> {
  try {
    const fs = await import("fs");
    const file = await getDbFile();
    if (!fs.existsSync(file)) {
      return [];
    }
    const content = await fs.promises.readFile(file, "utf-8");
    return JSON.parse(content);
  } catch (err) {
    console.error("Error reading db.json:", err);
    return [];
  }
}

async function writeDb(data: InvoiceData[]): Promise<void> {
  try {
    const fs = await import("fs");
    const file = await getDbFile();
    await fs.promises.writeFile(file, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing db.json:", err);
  }
}

export const serverCreateInvoice = createServerFn({ method: "POST" })
  .validator(
    (d: {
      id?: string;
      amount: string;
      description: string;
      dueDate?: string;
      from: string;
      contractTxHash?: string;
    }) => d,
  )
  .handler(async ({ data }) => {
    const list = await readDb();
    const id = data.id ?? Math.random().toString(36).slice(2, 10);
    const newInvoice: InvoiceData = {
      id,
      amount: data.amount,
      description: data.description,
      dueDate: data.dueDate,
      createdAt: Date.now(),
      from: data.from,
      status: "pending",
      contractTxHash: data.contractTxHash,
    };
    list.unshift(newInvoice);
    await writeDb(list);
    return newInvoice;
  });

export const serverGetInvoice = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const list = await readDb();
    return list.find((inv) => inv.id === id) || null;
  });

export const serverMarkPaid = createServerFn({ method: "POST" })
  .validator((data: { id: string; txHash: string }) => data)
  .handler(async ({ data: { id, txHash } }) => {
    const list = await readDb();
    const idx = list.findIndex((inv) => inv.id === id);
    if (idx !== -1) {
      list[idx].status = "paid";
      list[idx].txHash = txHash;
      await writeDb(list);
      return list[idx];
    }
    throw new Error("Invoice not found");
  });

export const serverGetAllInvoices = createServerFn({ method: "GET" }).handler(async () => {
  return await readDb();
});
