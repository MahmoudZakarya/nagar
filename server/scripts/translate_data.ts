import db from "../db";

export async function translateExistingData() {
  if (db.isPostgres) {
    console.log("PostgreSQL database detected. Skipping data translation.");
    return;
  }

  console.log("Starting data translation migration...");

  try {
    await db.transaction(async (tx) => {
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
        await tx.execute("UPDATE safe SET category = ? WHERE category = ?", [
          arabic,
          english,
        ]);
      }

      // 2. Translate Descriptions in Safe table
      // Handle the "Additional payment for Task #1: title" pattern
      await tx.execute(
        `UPDATE safe 
         SET description = 'دفعة إضافية للمشروع #' || SUBSTR(description, INSTR(description, '#') + 1)
         WHERE description LIKE 'Additional payment for Task #%'`
      );

      // Handle "Deposit for Task #1: title" pattern
      await tx.execute(
        `UPDATE safe 
         SET description = 'عربون مشروع #' || SUBSTR(description, INSTR(description, '#') + 1)
         WHERE description LIKE 'Deposit for Task #%'`
      );

      // Handle "Payment for purchase: item" pattern
      await tx.execute(
        `UPDATE safe 
         SET description = 'دفع لفاتورة شراء: ' || SUBSTR(description, INSTR(description, ':') + 2)
         WHERE description LIKE 'Payment for purchase:%'`
      );

      // Handle "Remaining payment for purchase: item" pattern
      await tx.execute(
        `UPDATE safe 
         SET description = 'سداد متبقي لمشتريات: ' || SUBSTR(description, INSTR(description, ':') + 2)
         WHERE description LIKE 'Remaining payment for purchase:%'`
      );

      // Handle "Refund for cancelled task" pattern
      await tx.execute(
        `UPDATE safe 
         SET description = REPLACE(description, 'Refund for deleted task', 'إلغاء مشروع واسترداد مقدم')
         WHERE description LIKE '%Refund for deleted task%'`
      );

      console.log("Data translation migration completed successfully.");
    });
  } catch (error) {
    console.error("Failed to run translation migration:", error);
  }
}
