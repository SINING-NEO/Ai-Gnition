export type ToolResult = {
  ok: boolean;
  output: string;
  data?: Record<string, unknown>;
};

export type ToolHandler = (args: Record<string, unknown>) => Promise<ToolResult>;

const mockOrders = [
  { order_id: "ORD-2418", sku: "WIDGET-A", qty: 12, total: 480 },
  { order_id: "ORD-2419", sku: "WIDGET-B", qty: 4, total: 160 },
  { order_id: "ORD-2420", sku: "GADGET-C", qty: 9, total: 675 },
];

export const toolRegistry: Record<string, ToolHandler> = {
  async read_emails(args) {
    const query = String(args.query ?? "inbox");
    return {
      ok: true,
      output: `Found 3 order emails matching "${query}"`,
      data: {
        emails: mockOrders.map((o, i) => ({
          id: `mail_${i}`,
          subject: `Order confirmation ${o.order_id}`,
          from: "orders@acmesupply.com",
        })),
      },
    };
  },

  async extract_fields(args) {
    const fields = (args.fields as string[]) ?? ["order_id", "sku", "qty", "total"];
    return {
      ok: true,
      output: `Extracted ${fields.join(", ")} from 3 emails`,
      data: { rows: mockOrders },
    };
  },

  async append_sheet_row(args) {
    const sheet = String(args.sheet ?? "Orders");
    return {
      ok: true,
      output: `Appended 3 rows to ${sheet} sheet`,
      data: { sheet, rowsAdded: 3 },
    };
  },

  async read_sheet(args) {
    const sheet = String(args.sheet ?? "Orders");
    return {
      ok: true,
      output: `Read ${mockOrders.length} rows from ${sheet}`,
      data: { sheet, rows: mockOrders },
    };
  },

  async summarize(args) {
    const focus = String(args.focus ?? "activity");
    return {
      ok: true,
      output: `Summary (${focus}): 3 orders, $${mockOrders.reduce((s, o) => s + o.total, 0)} total, no blockers.`,
      data: { total: 1315, count: 3 },
    };
  },

  async draft_email(args) {
    const to = String(args.to ?? "team@company.com");
    const subject = String(args.subject ?? "Update");
    return {
      ok: true,
      output: `Drafted email to ${to}: "${subject}"`,
      data: {
        to,
        subject,
        body: "Hi team,\n\nHere's this week's status: 3 orders processed ($1,315).\n\n— Priya (via OneLastThing)",
      },
    };
  },

  async send_email(args) {
    return {
      ok: true,
      output: `Sent email${args.requireApproval ? " (pre-approved)" : ""}`,
      data: { messageId: `msg_${Date.now()}` },
    };
  },

  async create_calendar_event(args) {
    const offset = Number(args.offsetDays ?? 3);
    const when = new Date();
    when.setDate(when.getDate() + offset);
    return {
      ok: true,
      output: `Created follow-up meeting on ${when.toDateString()}`,
      data: { start: when.toISOString(), durationMinutes: args.durationMinutes ?? 30 },
    };
  },

  async generate_report() {
    return {
      ok: true,
      output: "Generated ops report (PDF mock)",
      data: { url: "/mock/report.pdf" },
    };
  },

  async notify_user(args) {
    return {
      ok: true,
      output: `Notified user via ${args.channel ?? "in_app"}`,
      data: {},
    };
  },
};

export function listTools() {
  return Object.keys(toolRegistry);
}
