import React,{ useState } from "react";
import { useData } from "../context/DataContext";
import { fmtMoney, invoiceTotal, monthKey, MONTHS, ProgressBar, Avatar } from "../components/UI";

export default function Dashboard({ year, month, onNav }) {
  const d = useData();
  const sym = d.currency?.symbol || "₹";
  const mk = monthKey(year, month);

  const invIncome = d.invoices.filter(i => i.date?.slice(0, 7) === mk).reduce((s, i) => s + invoiceTotal(i.items), 0);
  const manIncome = d.income.filter(i => i.month === mk).reduce((s, i) => s + Number(i.amount), 0);
  const totalIncome = invIncome + manIncome;

  const totalExp = d.expenses.reduce((s, e) => {
    if (e.recurring) return e.startMonth <= mk ? s + Number(e.amount) : s;
    return e.month === mk ? s + Number(e.amount) : s;
  }, 0);

  const balance = totalIncome - totalExp;

  const Tile = ({ label, val, color, deep, sub, onClick }) => (
    <div onClick={onClick} style={{ background: `var(--surface)`, border: `1px solid ${color}33`, borderRadius: 18, padding: "18px 16px", cursor: onClick ? "pointer" : "default", boxShadow: "var(--card-shadow)" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>{label}</div>
      <div style={{ fontFamily: "var(--serif)", fontSize: 22, color, letterSpacing: -0.5, marginBottom: sub ? 4 : 0 }}>{val}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ paddingBottom: 20 }}>
      {/* Hero */}
      <div className="section-hero" style={{ background: `linear-gradient(145deg, var(--accent-deep) 0%, var(--bg) 60%)` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-text)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
          Net Balance · {MONTHS[month]} {year}
        </div>
        <div style={{ fontFamily: "var(--serif)", fontSize: 46, color: balance >= 0 ? "var(--accent)" : "var(--danger)", letterSpacing: -1, lineHeight: 1 }}>
          {balance < 0 ? "-" : ""}{fmtMoney(balance, sym)}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-sec)", marginTop: 8 }}>
          {balance >= 0 ? "Positive month 📈" : "Deficit — review expenses"}
        </div>
      </div>

      <div style={{ padding: "20px 18px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
          <Tile label="Total Income" val={fmtMoney(totalIncome, sym)} color="var(--accent)" sub={`${d.invoices.filter(i=>i.date?.slice(0,7)===mk).length} inv. + manual`} onClick={() => onNav("income")} />
          <Tile label="Expenses" val={fmtMoney(totalExp, sym)} color="var(--danger)" sub={`${d.expenses.length} total`} onClick={() => onNav("expenses")} />
          <Tile label="Free Balance" val={fmtMoney(Math.max(0, balance), sym)} color="var(--blue)" sub={balance < 0 ? "Over budget" : "After expenses"} />
        </div>

        {/* Income breakdown */}
        <div style={{ marginBottom: 22 }}>
          <div className="section-label">Income Breakdown</div>
          <div className="card">
            {[["Invoice Income", invIncome, "var(--accent)"], ["Manual Income", manIncome, "var(--accent-text)"]].map(([l, v, col], idx) => (
              <div key={l} className="card-row">
                <span style={{ fontSize: 15, color: "var(--text-sec)" }}>{l}</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: col }}>{fmtMoney(v, sym)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent invoices */}
        <div>
          <div className="section-label">Recent Invoices</div>
          <div className="card">
            {d.invoices.length === 0
              ? <div style={{ padding: "24px", textAlign: "center", fontSize: 14, color: "var(--text-dim)" }}>No invoices yet</div>
              : d.invoices.slice(0, 4).map(inv => (
                <div key={inv.id} className="card-row">
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Avatar name={inv.customer?.name || inv.billTo?.name || "?"} size={36} fontSize={13} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{inv.customer?.name || inv.billTo?.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{inv.number}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "var(--blue)" }}>{fmtMoney(invoiceTotal(inv.items), sym)}</span>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}