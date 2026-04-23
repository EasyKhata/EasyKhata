import React, { useEffect, useMemo, useState } from "react";
import { societyApi } from "../lib/api";
import { WorkflowRecordCard, WorkflowSetupCard, fmtMoney, MONTHS } from "../components/UI";
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

function NoticeCard({ notice, index }) {
  return (
    <WorkflowRecordCard
      title={`Notice ${index + 1}`}
      subtitle={notice}
      tone="default"
    />
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
          <div className="card">
            <WorkflowSetupCard title="Resident access not joined" description="Open Settings and join with your invite code to track common records and your flat dues." tone="info" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ledger-screen">
      <div className="ledger-block">
        <div className="card" style={{ padding: "14px 16px", marginBottom: 18, borderLeft: "4px solid var(--blue)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--blue)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>
                Resident View
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)" }}>{portal?.name || "Society Portal"}</div>
              <div style={{ fontSize: 12, color: "var(--text-sec)", marginTop: 3 }}>
                Flat {user?.societyFlatNumber || "-"} · {MONTHS[month]} {year}
              </div>
              {error && <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 6 }}>{error}</div>}
            </div>
            {headerDatePicker && <div>{headerDatePicker}</div>}
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Common Records</div>
          <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>Published society totals for the selected month.</div>
        </div>
        <div className="card" style={{ marginBottom: 22 }}>
          {!commonRecord ? (
            <WorkflowSetupCard title="No common records yet" description="The association has not published society records for this month." tone="info" />
          ) : (
            <div className="ledger-summary-grid" style={{ padding: "12px 4px" }}>
              <StatCell label="Expected" value={fmtMoney(commonRecord.expectedAmount || 0, commonRecord.currencySymbol || "Rs")} />
              <StatCell label="Collected" value={fmtMoney(commonRecord.collectedAmount || 0, commonRecord.currencySymbol || "Rs")} color="var(--accent)" />
              <StatCell label="Pending" value={fmtMoney(commonRecord.pendingAmount || 0, commonRecord.currencySymbol || "Rs")} color="var(--gold)" />
              <StatCell label="Society Expenses" value={fmtMoney(commonRecord.expenseAmount || 0, commonRecord.currencySymbol || "Rs")} color="var(--danger)" />
            </div>
          )}
        </div>

        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Your Flat Dues</div>
          <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>Your unit-level summary for this period.</div>
        </div>
        <div className="card" style={{ marginBottom: 22 }}>
          {!flatDue ? (
            <WorkflowSetupCard title="No dues summary found" description="No due summary has been published for your flat in this month." tone="warning" />
          ) : (
            <div className="ledger-summary-grid" style={{ padding: "12px 4px" }}>
              <StatCell label="Expected" value={fmtMoney(flatDue.expectedAmount || 0, flatDue.currencySymbol || "Rs")} />
              <StatCell label="Paid" value={fmtMoney(flatDue.paidAmount || 0, flatDue.currencySymbol || "Rs")} color="var(--accent)" />
              <StatCell label="Pending" value={fmtMoney(flatDue.pendingAmount || 0, flatDue.currencySymbol || "Rs")} color="var(--gold)" />
              <StatCell label="Status" value={String(flatDue.status || "pending")} color="var(--text)" />
            </div>
          )}
        </div>

        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Notices</div>
          <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>Updates shared by the association for this month.</div>
        </div>
        <div className="card" style={{ marginBottom: 22 }}>
          {noticeItems.length === 0 ? (
            <WorkflowSetupCard title="No notices this month" description="You are all caught up for the selected period." tone="info" />
          ) : (
            noticeItems.map((notice, index) => <NoticeCard key={`${notice}-${index}`} notice={notice} index={index} />)
          )}
        </div>
      </div>
    </div>
  );
}
