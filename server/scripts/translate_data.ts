import db from "../db";

export function translateExistingData() {
  console.log("Starting data translation migration...");

  const transaction = db.transaction(() => {
    // 1. Translate Categories in Safe table
    const categoryMapping: Record<string, string> = {
      "Client Deposit": "دفعة مقدمة",
      Deposit: "دفعة مقدمة",
      "Client Payment": "دفعة عميل",
      "Final Payment": "دفعة نهائية",
      Supplies: "مشتريات خامات",
      Purchase: "مشتريات خامات",
      Purchases: "مشتريات خامات",
      Labor: "أجور صنايعية",
      Rent: "إيجار الورشة",
      Electric: "كهرباء / خدمات",
      Refund: "استرداد",
      Payroll: "رواتب",
      Other: "أخرى",
    };

    for (const [english, arabic] of Object.entries(categoryMapping)) {
      db.prepare("UPDATE safe SET category = ? WHERE category = ?").run(
        arabic,
        english,
      );
    }

    // 2. Translate Descriptions in Safe table
    // Handle the "Additional payment for Task #1: title" pattern
    db.prepare(
      `
      UPDATE safe 
      SET description = 'دفعة إضافية للمشروع #' || SUBSTR(description, INSTR(description, '#') + 1)
      WHERE description LIKE 'Additional payment for Task #%'
    `,
    ).run();

    // Handle "Deposit for Task #1: title" pattern
    db.prepare(
      `
      UPDATE safe 
      SET description = 'عربون مشروع #' || SUBSTR(description, INSTR(description, '#') + 1)
      WHERE description LIKE 'Deposit for Task #%'
    `,
    ).run();

    // Handle "Payment for purchase: item" pattern
    db.prepare(
      `
      UPDATE safe 
      SET description = 'دفع لفاتورة شراء: ' || SUBSTR(description, INSTR(description, ':') + 2)
      WHERE description LIKE 'Payment for purchase:%'
    `,
    ).run();

    // Handle "Remaining payment for purchase: item" pattern
    db.prepare(
      `
      UPDATE safe 
      SET description = 'سداد متبقي لمشتريات: ' || SUBSTR(description, INSTR(description, ':') + 2)
      WHERE description LIKE 'Remaining payment for purchase:%'
    `,
    ).run();

    // Handle "Refund for cancelled task" pattern
    db.prepare(
      `
      UPDATE safe 
      SET description = REPLACE(description, 'Refund for deleted task', 'إلغاء مشروع واسترداد مقدم')
      WHERE description LIKE '%Refund for deleted task%'
    `,
    ).run();

    console.log("Data translation migration completed successfully.");
  });

  try {
    transaction();
  } catch (error) {
    console.error("Failed to run translation migration:", error);
  }
}
