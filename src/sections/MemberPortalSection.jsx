import React, { useEffect, useMemo, useState } from "react";
import { societyApi } from "../lib/api";
import { EmptyState, fmtMoney, MONTHS } from "../components/UI";
import { logError } from "../utils/logger";

function toPeriodKey(year, month) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export default function MemberPortalSection({ user, year, month, headerDatePicker }) {
  const [portal, setPortal] = useState(null);
  const [commonRecord, setCommonRecord] = useState(null);
  const [flatDue, setFlatDue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const periodKey = toPeriodKey(year, month);

  useEffect(() => {
    async function loadMemberPortalData() {
      if (!user?.societyPortalId) {
        setPortal(null);
        setCommonRecord(null);
        setFlatDue(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const data = await societyApi.getMemberView(periodKey);
        setPortal(data.portal || null);
        setCommonRecord(data.commonRecord || null);
        setFlatDue(data.flatDue || null);
      } catch (err) {
        logError("Member portal load error", err);
        setError("Unable to load resident view right now.");
      } finally {
        setLoading(false);
      }
    }
    loadMemberPortalData();
  }, [periodKey, user?.societyFlatNumber, user?.societyPortalId]);

  const noticeItems = useMemo(() => {
    const notices = commonRecord?.notices;
    return Array.isArray(notices) ? notices.filter(Boolean) : [];
  }, [commonRecord?.notices]);

  if (loading) {
    return <div style={{ padding: "22px 18px 100px", color: "var(--text-dim)" }}>Loading resident portal...</div>;
  }

  if (!user?.societyPortalId) {
    return (
      <div style={{ padding: "22px 18px 100px" }}>
        <div className="section-label">Resident View</div>
        <div className="card">
          <EmptyState title="Resident access not joined" message="Open Settings and join with invite code to track common records and your flat dues." />
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 100 }}>
      <div className="section-hero" style={{ background: "linear-gradient(145deg, var(--blue-deep) 0%, var(--bg) 60%)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--blue)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
            Resident Read-Only View
          </div>
          <div style={{ fontFamily: "var(--serif)", fontSize: 28, color: "var(--text)" }}>{portal?.name || "Society Portal"}</div>
          <div style={{ fontSize: 13, color: "var(--text-sec)", marginTop: 6 }}>
            Flat {user?.societyFlatNumber || "-"} · {MONTHS[month]} {year}
          </div>
          {error && <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 8 }}>{error}</div>}
        </div>
        <div style={{ flexShrink: 0 }}>{headerDatePicker}</div>
      </div>

      <div style={{ padding: "22px 18px 0" }}>
        <div className="section-label">Common Records</div>
        <div className="card" style={{ marginBottom: 18 }}>
          {!commonRecord ? (
            <div style={{ fontSize: 13, color: "var(--text-dim)" }}>No published common records for this month yet.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
              <div><div style={{ fontSize: 11, color: "var(--text-dim)" }}>Expected</div><div style={{ fontSize: 15, fontWeight: 700 }}>{fmtMoney(commonRecord.expectedAmount || 0, commonRecord.currencySymbol || "Rs")}</div></div>
              <div><div style={{ fontSize: 11, color: "var(--text-dim)" }}>Collected</div><div style={{ fontSize: 15, fontWeight: 700, color: "var(--accent)" }}>{fmtMoney(commonRecord.collectedAmount || 0, commonRecord.currencySymbol || "Rs")}</div></div>
              <div><div style={{ fontSize: 11, color: "var(--text-dim)" }}>Pending</div><div style={{ fontSize: 15, fontWeight: 700, color: "var(--gold)" }}>{fmtMoney(commonRecord.pendingAmount || 0, commonRecord.currencySymbol || "Rs")}</div></div>
              <div><div style={{ fontSize: 11, color: "var(--text-dim)" }}>Society Expenses</div><div style={{ fontSize: 15, fontWeight: 700, color: "var(--danger)" }}>{fmtMoney(commonRecord.expenseAmount || 0, commonRecord.currencySymbol || "Rs")}</div></div>
            </div>
          )}
        </div>

        <div className="section-label">Your Flat Dues</div>
        <div className="card" style={{ marginBottom: 18 }}>
          {!flatDue ? (
            <div style={{ fontSize: 13, color: "var(--text-dim)" }}>No due summary found for your flat in this month.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
              <div><div style={{ fontSize: 11, color: "var(--text-dim)" }}>Expected</div><div style={{ fontSize: 15, fontWeight: 700 }}>{fmtMoney(flatDue.expectedAmount || 0, flatDue.currencySymbol || "Rs")}</div></div>
              <div><div style={{ fontSize: 11, color: "var(--text-dim)" }}>Paid</div><div style={{ fontSize: 15, fontWeight: 700, color: "var(--accent)" }}>{fmtMoney(flatDue.paidAmount || 0, flatDue.currencySymbol || "Rs")}</div></div>
              <div><div style={{ fontSize: 11, color: "var(--text-dim)" }}>Pending</div><div style={{ fontSize: 15, fontWeight: 700, color: "var(--gold)" }}>{fmtMoney(flatDue.pendingAmount || 0, flatDue.currencySymbol || "Rs")}</div></div>
              <div><div style={{ fontSize: 11, color: "var(--text-dim)" }}>Status</div><div style={{ fontSize: 14, fontWeight: 700 }}>{flatDue.status || "pending"}</div></div>
            </div>
          )}
        </div>

        <div className="section-label">Notices</div>
        <div className="card">
          {noticeItems.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--text-dim)" }}>No notices published this month.</div>
          ) : (
            noticeItems.map((notice, index) => (
              <div key={`${notice}-${index}`} style={{ padding: index === noticeItems.length - 1 ? 0 : "0 0 12px", marginBottom: index === noticeItems.length - 1 ? 0 : 12, borderBottom: index === noticeItems.length - 1 ? "none" : "1px solid var(--border)", fontSize: 13, color: "var(--text-sec)" }}>
                {notice}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
