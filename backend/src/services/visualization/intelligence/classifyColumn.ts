const IDENTIFIER = [
  "id",
  "index",
  "uuid",
  "guid",
  "invoice",
  "orderid",
  "customerid",
  "userid",
  "serial",
  "code",
];

const METRIC = [
  "sales",
  "revenue",
  "profit",
  "amount",
  "price",
  "cost",
  "income",
  "quantity",
  "qty",
  "stock",
  "balance",
  "salary",
  "total",
];

const CATEGORY = [
  "country",
  "city",
  "region",
  "state",
  "department",
  "segment",
  "category",
  "product",
  "brand",
  "company",
];

const DATE = [
  "date",
  "time",
  "created",
  "updated",
  "delivery",
  "order",
  "subscription",
];

const CONTACT = [
  "email",
  "phone",
  "website",
  "address",
];

export type ColumnRole =
  | "metric"
  | "category"
  | "date"
  | "identifier"
  | "contact"
  | "unknown";

export function classifyColumn(
  column: string
): ColumnRole {

  const name =
    column
      .toLowerCase()
      .replace(/[\s_-]/g, "");

  if (IDENTIFIER.some(k => name.includes(k)))
    return "identifier";

  if (CONTACT.some(k => name.includes(k)))
    return "contact";

  if (DATE.some(k => name.includes(k)))
    return "date";

  if (METRIC.some(k => name.includes(k)))
    return "metric";

  if (CATEGORY.some(k => name.includes(k)))
    return "category";

  return "unknown";
}

