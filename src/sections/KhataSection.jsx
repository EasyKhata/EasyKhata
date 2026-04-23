import React, { useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import { Avatar, Input, Modal, SectionSkeleton, WorkflowActionStrip, WorkflowRecordCard, WorkflowSetupCard, fmtDate, fmtMoney } from "../components/UI";
import { getFinancialInvoices, getInvoiceStatus, invoiceGrandTotal } from "../utils/analytics";
import { ORG_TYPES, getOrgType } from "../utils/orgTypes";

function normalizeName(value) {
  return String(value || "").trim().toLowerCase();
}

function buildKhataCustomers(data) {
  const invoices = getFinancialInvoices(data.invoices || []).map(invoice => ({
    ...invoice,
    customerLabel: String(invoice.customer?.name || invoice.billTo?.name || invoice.customerName || "Walk-in Customer").trim(),
    total: invoiceGrandTotal(invoice),
    status: getInvoiceStatus(invoice)
  }));

  return (data.customers || [])
    .filter(customer => String(customer?.name || "").trim())
    .map(customer => {
      const customerName = String(customer.name || "").trim();
      const customerKey = normalizeName(customerName);
      const customerInvoices = invoices.filter(invoice => (
        invoice.customer?.id === customer.id || normalizeName(invoice.customerLabel) === customerKey
      ));

      const passbookEntries = customerInvoices
        .flatMap(invoice => {
          const invoiceNumber = String(invoice.number || "Invoice").trim();
          const debitEntry = {
            id: `sale-${invoice.id}`,
            date: invoice.date || "",
            description: `Sale ${invoiceNumber}`,
            note: invoice.status === "paid" ? "Billed and collected" : invoice.status === "overdue" ? "Payment overdue" : "Awaiting payment",
            debit: invoice.total,
            credit: 0,
            sortWeight: 0
          };

          if (invoice.status !== "paid") {
            return [debitEntry];
          }

          return [
            debitEntry,
            {
              id: `payment-${invoice.id}`,
              date: invoice.paidDate || invoice.date || "",
              description: `Payment ${invoiceNumber}`,
              note: "Amount received",
              debit: 0,
              credit: invoice.total,
              sortWeight: 1
            }
          ];
        })
        .sort((left, right) => {
          const dateCompare = String(left.date || "").localeCompare(String(right.date || ""));
          if (dateCompare !== 0) return dateCompare;
          return (left.sortWeight || 0) - (right.sortWeight || 0);
        });

      let runningBalance = 0;
      const entries = passbookEntries.map(entry => {
        runningBalance += Number(entry.debit || 0) - Number(entry.credit || 0);
        return {
          ...entry,
          balance: runningBalance
        };
      });

      const totalSales = customerInvoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);
      const totalPaid = customerInvoices.filter(invoice => invoice.status === "paid").reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);
      const outstanding = customerInvoices.filter(invoice => invoice.status !== "paid").reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);

      return {
        ...customer,
        totalSales,
        totalPaid,
        outstanding,
        invoiceCount: customerInvoices.length,
        entries
      };
    })
    .sort((left, right) => right.totalSales - left.totalSales || left.name.localeCompare(right.name));
}

export default function KhataSection({ orgType }) {
  const data = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const sym = data.currency?.symbol || "Rs";
  const isSmallBusinessOrg = getOrgType(orgType) === ORG_TYPES.SMALL_BUSINESS;

  const customers = useMemo(() => buildKhataCustomers(data), [data]);
  const filteredCustomers = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) return customers;

    return customers.filter(customer => {
      const fields = [
        customer.name,
        customer.company,
        customer.phone,
        customer.email
      ].filter(Boolean).join(" ").toLowerCase();
      return fields.includes(needle);
    });
  }, [customers, searchTerm]);

  const totalOutstanding = customers.reduce((sum, customer) => sum + Number(customer.outstanding || 0), 0);
  const totalSales = customers.reduce((sum, customer) => sum + Number(customer.totalSales || 0), 0);

  function customerMeta(customer) {
    const parts = [
      customer.company || "",
      `${customer.invoiceCount || 0} invoice${customer.invoiceCount === 1 ? "" : "s"}`
    ].filter(Boolean);
    return parts.join(" · ") || "No extra details";
  }

  function CustomerCard({ customer }) {
    return (
      <WorkflowRecordCard
        avatar={<Avatar name={customer.name || "?"} size={38} fontSize={13} />}
        title={customer.name}
        meta={customerMeta(customer)}
        amount={fmtMoney(customer.outstanding || 0, sym)}
        amountTone={(customer.outstanding || 0) > 0 ? "gold" : "accent"}
        badges={[
          {
            label: (customer.outstanding || 0) > 0 ? "Open balance" : "Settled",
            tone: (customer.outstanding || 0) > 0 ? "gold" : "accent"
          }
        ]}
        onClick={() => setSelectedCustomer(customer)}
      />
    );
  }

  if (!data.loaded) {
    return <SectionSkeleton rows={4} />;
  }

  if (!isSmallBusinessOrg) {
    return null;
  }

  return (
    <div className="ledger-screen">
      <WorkflowActionStrip
        title="Open a customer to view passbook-style sales, payments, and running balance."
        actions={[]}
      />
      <div className="card" style={{ padding: "14px 16px", marginBottom: 18, borderLeft: "4px solid var(--gold)" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>Customer Khata</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "var(--gold)" }}>{fmtMoney(totalOutstanding, sym)}</div>
          <div style={{ fontSize: 12, color: "var(--text-sec)", marginTop: 3 }}>
            Open balance across {customers.length} customer{customers.length === 1 ? "" : "s"} · Total sales: {fmtMoney(totalSales, sym)}
          </div>
        </div>
      </div>

      <div className="ledger-block">
        <div className="card ledger-search-card">
          <div className="ledger-inline-note">
            Open a customer to view a passbook-style khata history with sales, payments, and running balance.
          </div>
          <Input placeholder="Search customers by name, company, phone, or email" value={searchTerm} onChange={event => setSearchTerm(event.target.value)} />
        </div>

        <div className="card">
          {customers.length === 0 ? (
            <WorkflowSetupCard
              title="Add your first customer"
              description="Customer balances and passbook-style khata history will appear here once you add a customer and start billing."
              tone="warning"
            />
          ) : filteredCustomers.length === 0 ? (
            <WorkflowSetupCard
              title="No matching customers"
              description="Try a different search term to find the customer you need."
              tone="warning"
            />
          ) : (
            filteredCustomers.map(customer => <CustomerCard key={customer.id} customer={customer} />)
          )}
        </div>
      </div>

      {selectedCustomer && (
        <Modal title={`${selectedCustomer.name} Khata`} onClose={() => setSelectedCustomer(null)} canSave={false}>
          <div className="ledger-summary-grid" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))", marginBottom: 16 }}>
            <div className="ledger-summary-card" style={{ borderColor: "var(--accent-deep)" }}>
              <div className="ledger-summary-label" style={{ color: "var(--text-dim)" }}>Total Sales</div>
              <div className="ledger-summary-value" style={{ color: "var(--accent)", fontSize: 24 }}>{fmtMoney(selectedCustomer.totalSales || 0, sym)}</div>
            </div>
            <div className="ledger-summary-card" style={{ borderColor: "var(--gold-deep)" }}>
              <div className="ledger-summary-label" style={{ color: "var(--text-dim)" }}>Open Balance</div>
              <div className="ledger-summary-value" style={{ color: (selectedCustomer.outstanding || 0) > 0 ? "var(--gold)" : "var(--accent)", fontSize: 24 }}>
                {fmtMoney(selectedCustomer.outstanding || 0, sym)}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="ledger-feed-row" style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase" }}>
              <span style={{ width: 72 }}>Date</span>
              <span style={{ flex: 1 }}>Details</span>
              <span style={{ width: 78, textAlign: "right" }}>Debit</span>
              <span style={{ width: 78, textAlign: "right" }}>Credit</span>
              <span style={{ width: 88, textAlign: "right" }}>Balance</span>
            </div>
            {selectedCustomer.entries.length === 0 ? (
              <WorkflowSetupCard
                title="No khata history yet"
                description="Create invoices for this customer to build their sale and payment history here."
                tone="warning"
              />
            ) : (
              selectedCustomer.entries.map(entry => (
                <div key={entry.id} className="ledger-feed-row" style={{ alignItems: "flex-start", gap: 10 }}>
                  <div style={{ width: 72, fontSize: 12, color: "var(--text-dim)" }}>{fmtDate(entry.date)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{entry.description}</div>
                    <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 3 }}>{entry.note}</div>
                  </div>
                  <div style={{ width: 78, textAlign: "right", fontSize: 13, fontWeight: 700, color: entry.debit > 0 ? "var(--danger)" : "var(--text-dim)" }}>
                    {entry.debit > 0 ? fmtMoney(entry.debit, sym) : "--"}
                  </div>
                  <div style={{ width: 78, textAlign: "right", fontSize: 13, fontWeight: 700, color: entry.credit > 0 ? "var(--accent)" : "var(--text-dim)" }}>
                    {entry.credit > 0 ? fmtMoney(entry.credit, sym) : "--"}
                  </div>
                  <div style={{ width: 88, textAlign: "right", fontSize: 13, fontWeight: 700, color: (entry.balance || 0) > 0 ? "var(--gold)" : "var(--accent)" }}>
                    {fmtMoney(entry.balance || 0, sym)}
                  </div>
                </div>
              ))
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
