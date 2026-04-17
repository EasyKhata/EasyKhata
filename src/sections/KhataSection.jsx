import React, { useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import { Avatar, EmptyState, Input, Modal, SectionSkeleton, fmtDate, fmtMoney } from "../components/UI";
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

  if (!data.loaded) {
    return <SectionSkeleton rows={4} />;
  }

  if (!isSmallBusinessOrg) {
    return null;
  }

  return (
    <div style={{ paddingBottom: 100 }}>
      <div className="section-hero" style={{ background: "linear-gradient(145deg, var(--gold-deep) 0%, var(--bg) 60%)" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
          Customer Khata
        </div>
        <div style={{ fontFamily: "var(--serif)", fontSize: 42, color: "var(--gold)", letterSpacing: -0.5 }}>{fmtMoney(totalOutstanding, sym)}</div>
        <div style={{ fontSize: 13, color: "var(--text-sec)", marginTop: 6 }}>
          Open customer balance across {customers.length} customer{customers.length === 1 ? "" : "s"}. Total sales: {fmtMoney(totalSales, sym)}.
        </div>
      </div>

      <div style={{ padding: "22px 18px 0" }}>
        <div className="card" style={{ padding: 16, marginBottom: 18 }}>
          <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 10 }}>
            Open a customer to view a passbook-style khata history with sales, payments, and running balance.
          </div>
          <Input placeholder="Search customers by name, company, phone, or email" value={searchTerm} onChange={event => setSearchTerm(event.target.value)} />
        </div>

        <div className="card">
          {customers.length === 0 ? (
            <EmptyState title="No customers added yet" message="Add customers in Khata to start tracking khata history and balances." accentColor="var(--gold)" />
          ) : filteredCustomers.length === 0 ? (
            <EmptyState title="No matching customers" message="Try a different search term to find the customer you need." accentColor="var(--gold)" />
          ) : (
            filteredCustomers.map(customer => (
              <div key={customer.id} className="card-row" style={{ cursor: "pointer" }} onClick={() => setSelectedCustomer(customer)}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <Avatar name={customer.name || "?"} size={36} fontSize={12} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{customer.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-dim)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {[customer.company || "", `${customer.invoiceCount || 0} invoice${customer.invoiceCount === 1 ? "" : "s"}`].filter(Boolean).join(" · ") || "No extra details"}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: (customer.outstanding || 0) > 0 ? "var(--gold)" : "var(--accent)" }}>{fmtMoney(customer.outstanding || 0, sym)}</div>
                  <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>{(customer.outstanding || 0) > 0 ? "Open balance" : "Settled"}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedCustomer && (
        <Modal title={`${selectedCustomer.name} Khata`} onClose={() => setSelectedCustomer(null)} canSave={false}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <div className="card" style={{ padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 6 }}>Total Sales</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--accent)" }}>{fmtMoney(selectedCustomer.totalSales || 0, sym)}</div>
            </div>
            <div className="card" style={{ padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 6 }}>Open Balance</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: (selectedCustomer.outstanding || 0) > 0 ? "var(--gold)" : "var(--accent)" }}>{fmtMoney(selectedCustomer.outstanding || 0, sym)}</div>
            </div>
          </div>

          <div className="card">
            <div className="card-row" style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase" }}>
              <span style={{ width: 72 }}>Date</span>
              <span style={{ flex: 1 }}>Details</span>
              <span style={{ width: 78, textAlign: "right" }}>Debit</span>
              <span style={{ width: 78, textAlign: "right" }}>Credit</span>
              <span style={{ width: 88, textAlign: "right" }}>Balance</span>
            </div>
            {selectedCustomer.entries.length === 0 ? (
              <EmptyState title="No khata history yet" message="Create invoices for this customer to build their passbook history." accentColor="var(--gold)" />
            ) : (
              selectedCustomer.entries.map(entry => (
                <div key={entry.id} className="card-row" style={{ alignItems: "flex-start", gap: 10 }}>
                  <div style={{ width: 72, fontSize: 12, color: "var(--text-dim)" }}>{fmtDate(entry.date)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{entry.description}</div>
                    <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 3 }}>{entry.note}</div>
                  </div>
                  <div style={{ width: 78, textAlign: "right", fontSize: 13, fontWeight: 700, color: entry.debit > 0 ? "var(--danger)" : "var(--text-dim)" }}>{entry.debit > 0 ? fmtMoney(entry.debit, sym) : "--"}</div>
                  <div style={{ width: 78, textAlign: "right", fontSize: 13, fontWeight: 700, color: entry.credit > 0 ? "var(--accent)" : "var(--text-dim)" }}>{entry.credit > 0 ? fmtMoney(entry.credit, sym) : "--"}</div>
                  <div style={{ width: 88, textAlign: "right", fontSize: 13, fontWeight: 700, color: (entry.balance || 0) > 0 ? "var(--gold)" : "var(--accent)" }}>{fmtMoney(entry.balance || 0, sym)}</div>
                </div>
              ))
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
