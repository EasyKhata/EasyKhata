export function calculateDashboard(data, year, month) {
  const filterByMonth = (list) =>
    list.filter(item => {
      const d = new Date(item.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });

  const income = filterByMonth(data.income || []);
  const expenses = filterByMonth(data.expenses || []);
  const invoices = filterByMonth(data.invoices || []);

  const totalIncome = income.reduce((sum, i) => sum + Number(i.amount || 0), 0);

  const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const pendingInvoices = invoices.filter(i => i.status !== "paid");

  const pendingAmount = pendingInvoices.reduce((sum, inv) => {
    return sum + Number(inv.total || 0);
  }, 0);

  return {
    totalIncome,
    totalExpense,
    profit: totalIncome - totalExpense,
    pendingAmount,
    pendingCount: pendingInvoices.length
  };
}