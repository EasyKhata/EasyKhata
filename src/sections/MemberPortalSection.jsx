import React, { useEffect, useMemo, useState } from "react";
import { societyApi } from "../lib/api";
import { EmptyState, fmtMoney, MONTHS } from "../components/UI";
import { logError } from "../utils/logger";

function toPeriodKey(year, month) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

function StatCell({ label, value, color = "var(--text)" }) {
  return (
    <div className="ledger-summary-card" style={{ borderColor: `${color}22` }}>
      <div className="ledger-summary-label" style={{ color: "var(--text-dim)" }}>{label}</div>
      <div className="ledger-summary-value" style={{ color, fontSize: 24 }}>{value}</div>
    </div>
  );
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
    return <div className="ledger-screen" style={{ color: "var(--text-dim)" }}>Loading resident portal...</div>;
  }

  if (!user?.societyPortalId) {
    return (
      <div className="ledger-screen">
        <div className="ledger-block">
          <div className="ledger-block-header">
            <div>
              <div className="ledger-block-title">Resident View</div>
              <div className="ledger-block-caption">Join with your invite code to see dues and society records.</div>
            </div>
          </div>
          <div className="ledger-feed-card">
            <EmptyState title="Resident access not joined" message="Open Settings and join with your invite code to track common records and your flat dues." />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ledger-screen">
      <div className="ledger-hero" style={{ background: "linear-gradient(145deg, var(--blue-deep) 0%, var(--bg) 65%)" }}>
        <div className="ledger-hero-meta">
          <div className="ledger-overline" style={{ color: "var(--blue)" }}>Resident View</div>
          <div className="ledger-hero-value" style={{ color: "var(--text)" }}>{portal?.name || "Society Portal"}</div>
          <div className="ledger-hero-sub">
            Flat {user?.societyFlatNumber || "-"} · {MONTHS[month]} {year}
          </div>
          {error && <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 8 }}>{error}</div>}
        </div>
        {headerDatePicker && <div className="ledger-hero-actions">{headerDatePicker}</div>}
      </div>

      <div className="ledger-block">
        <div className="ledger-block-header">
          <div>
            <div className="ledger-block-title">Common Records</div>
            <div className="ledger-block-caption">Published society totals for the selected month.</div>
          </div>
        </div>
        <div className="ledger-feed-card">
          {!commonRecord ? (
            <EmptyState title="No common records yet" message="The association has not published society records for this month." accentColor="var(--blue)" />
          ) : (
            <div className="ledger-summary-grid">
              <StatCell label="Expected" value={fmtMoney(commonRecord.expectedAmount || 0, commonRecord.currencySymbol || "Rs")} />
              <StatCell label="Collected" value={fmtMoney(commonRecord.collectedAmount || 0, commonRecord.currencySymbol || "Rs")} color="var(--accent)" />
              <StatCell label="Pending" value={fmtMoney(commonRecord.pendingAmount || 0, commonRecord.currencySymbol || "Rs")} color="var(--gold)" />
              <StatCell label="Society Expenses" value={fmtMoney(commonRecord.expenseAmount || 0, commonRecord.currencySymbol || "Rs")} color="var(--danger)" />
            </div>
          )}
        </div>
      </div>

      <div className="ledger-block">
        <div className="ledger-block-header">
          <div>
            <div className="ledger-block-title">Your Flat Dues</div>
            <div className="ledger-block-caption">Your unit-level summary for this period.</div>
          </div>
        </div>
        <div className="ledger-feed-card">
          {!flatDue ? (
            <EmptyState title="No dues summary found" message="No due summary has been published for your flat in this month." accentColor="var(--gold)" />
          ) : (
            <div className="ledger-summary-grid">
              <StatCell label="Expected" value={fmtMoney(flatDue.expectedAmount || 0, flatDue.currencySymbol || "Rs")} />
              <StatCell label="Paid" value={fmtMoney(flatDue.paidAmount || 0, flatDue.currencySymbol || "Rs")} color="var(--accent)" />
              <StatCell label="Pending" value={fmtMoney(flatDue.pendingAmount || 0, flatDue.currencySymbol || "Rs")} color="var(--gold)" />
              <StatCell label="Status" value={String(flatDue.status || "pending")} color="var(--text)" />
            </div>
          )}
        </div>
      </div>

      <div className="ledger-block">
        <div className="ledger-block-header">
          <div>
            <div className="ledger-block-title">Notices</div>
            <div className="ledger-block-caption">Updates shared by the association for this month.</div>
          </div>
        </div>
        <div className="ledger-feed-card">
          {noticeItems.length === 0 ? (
            <EmptyState title="No notices this month" message="You are all caught up for the selected period." accentColor="var(--blue)" />
          ) : (
            noticeItems.map((notice, index) => (
              <div
                key={`${notice}-${index}`}
                className="ledger-feed-row"
                style={{ borderBottom: index === noticeItems.length - 1 ? "none" : undefined }}
              >
                <div className="ledger-feed-main">
                  <div className="ledger-feed-title">Notice {index + 1}</div>
                  <div className="ledger-feed-meta">{notice}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
