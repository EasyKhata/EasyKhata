import React, { useState, useMemo } from "react";
import { Modal, Field, Input, Select, Avatar, fmtMoney } from "./UI";

/**
 * QuickInvoiceModal - Streamlined invoice creation for common scenarios
 * Features: frequent customers, item templates, smart defaults
 */
export default function QuickInvoiceModal({ 
  open, 
  onClose, 
  onSave, 
  customers = [], 
  recentItems = [],
  currency = { symbol: "Rs" }
}) {
  const sym = currency?.symbol || "Rs";
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState("Thanks for your business.");
  const [error, setError] = useState("");

  // Get most recent customers (used in last 30 days)
  const frequentCustomers = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return customers
      .sort((a, b) => {
        const aDate = a.lastInvoiceDate ? new Date(a.lastInvoiceDate) : new Date(0);
        const bDate = b.lastInvoiceDate ? new Date(b.lastInvoiceDate) : new Date(0);
        return bDate - aDate;
      })
      .slice(0, 8);
  }, [customers]);

  // Popular item templates for Indian businesses
  const itemTemplates = [
    { label: "Consulting Service", desc: "Professional consulting", rate: 2500, taxRate: 18 },
    { label: "Software Development", desc: "Custom development", rate: 5000, taxRate: 18 },
    { label: "Design Service", desc: "Graphic/UI design", rate: 3000, taxRate: 18 },
    { label: "GST Return Filing", desc: "Monthly GST return", rate: 1500, taxRate: 0 },
    { label: "Digital Marketing", desc: "Social media & ads", rate: 4000, taxRate: 18 },
    { label: "Website Maintenance", desc: "Monthly support", rate: 2000, taxRate: 18 },
    { label: "Photography", desc: "Event/product photography", rate: 3500, taxRate: 18 },
    { label: "Content Writing", desc: "Blog/web content", rate: 1500, taxRate: 18 }
  ];

  const addQuickItem = (template) => {
    setItems(current => [
      ...current,
      {
        id: Math.random().toString(36).substr(2, 9),
        desc: template.label,
        subDesc: template.desc,
        qty: 1,
        rate: template.rate,
        taxRate: template.taxRate,
        hsn: ""
      }
    ]);
  };

  const removeItem = (id) => {
    setItems(current => current.filter(item => item.id !== id));
  };

  const updateItem = (id, key, value) => {
    setItems(current =>
      current.map(item => item.id === id ? { ...item, [key]: value } : item)
    );
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const itemSubtotal = (Number(item.qty) || 0) * (Number(item.rate) || 0);
      const tax = (itemSubtotal * (Number(item.taxRate) || 0)) / 100;
      return sum + itemSubtotal + tax;
    }, 0);
  };

  const handleSave = () => {
    setError("");

    if (!selectedCustomer) {
      setError("Please select a customer.");
      return;
    }

    if (items.length === 0) {
      setError("Add at least one item.");
      return;
    }

    const invalidItem = items.find(
      item => !item.desc || !item.qty || !item.rate
    );
    if (invalidItem) {
      setError("All items need a description, quantity, and rate.");
      return;
    }

    const payload = {
      customerId: selectedCustomer,
      items,
      notes,
      quickMode: true
    };

    onSave(payload);
    handleClose();
  };

  const handleClose = () => {
    setSelectedCustomer("");
    setItems([]);
    setNotes("Thanks for your business.");
    setError("");
    onClose();
  };

  if (!open) return null;

  const customer = customers.find(c => c.id === selectedCustomer);
  const total = calculateTotal();

  return (
    <Modal 
      title="Quick Invoice" 
      onClose={handleClose} 
      onSave={handleSave}
      saveLabel="Create Invoice"
      canSave={!!selectedCustomer && items.length > 0}
      accentColor="var(--blue)"
    >
      {error && (
        <div style={{ background: "var(--danger-deep)", border: "1px solid var(--danger)44", borderRadius: 12, padding: "12px 14px", color: "var(--danger)", fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Customer Quick Select */}
      <Field label="Select Customer" hint="Pick from recent customers or scroll to see all">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 12 }}>
          {frequentCustomers.map(cust => (
            <button
              key={cust.id}
              onClick={() => setSelectedCustomer(cust.id)}
              style={{
                border: selectedCustomer === cust.id ? "2px solid var(--blue)" : "1px solid var(--border)",
                borderRadius: 10,
                padding: "12px",
                background: selectedCustomer === cust.id ? "var(--blue-deep)" : "var(--surface)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s"
              }}
            >
              <Avatar name={cust.name || cust.email} size={32} fontSize={12} />
              <div style={{ textAlign: "left", minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {cust.name || cust.email}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-dim)" }}>
                  {cust.lastInvoiceDate ? `Used ${new Date(cust.lastInvoiceDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}` : "New"}
                </div>
              </div>
            </button>
          ))}
        </div>
        <Select 
          value={selectedCustomer} 
          onChange={e => setSelectedCustomer(e.target.value)}
          style={{ fontSize: 14 }}
        >
          <option value="">-- Select or see all customers --</option>
          {customers.map(cust => (
            <option key={cust.id} value={cust.id}>
              {cust.name || cust.email}
            </option>
          ))}
        </Select>
      </Field>

      {/* Quick Item Templates */}
      <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-sec)", textTransform: "uppercase", letterSpacing: 0.7, display: "block", marginBottom: 10, marginTop: 16 }}>
        Quick Item Templates
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 16 }}>
        {itemTemplates.map((template, idx) => (
          <button
            key={idx}
            onClick={() => addQuickItem(template)}
            style={{
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "10px",
              background: "var(--surface-high)",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text)",
              textAlign: "left",
              transition: "all 0.2s",
              fontFamily: "var(--font)"
            }}
            onMouseEnter={e => {
              e.target.style.background = "var(--blue-deep)";
              e.target.style.color = "var(--blue)";
              e.target.style.borderColor = "var(--blue)";
            }}
            onMouseLeave={e => {
              e.target.style.background = "var(--surface-high)";
              e.target.style.color = "var(--text)";
              e.target.style.borderColor = "var(--border)";
            }}
          >
            <div>{template.label}</div>
            <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>
              {fmtMoney(template.rate, sym)}
            </div>
          </button>
        ))}
      </div>

      {/* Added Items Summary */}
      {items.length > 0 && (
        <>
          <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-sec)", textTransform: "uppercase", letterSpacing: 0.7, display: "block", marginBottom: 10 }}>
            Items ({items.length})
          </label>
          <div className="card" style={{ marginBottom: 16 }}>
            {items.map((item, idx) => (
              <div key={item.id} className="card-row" style={{ borderBottom: idx === items.length - 1 ? "none" : "1px solid var(--border)" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{item.desc}</div>
                  {item.subDesc && <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{item.subDesc}</div>}
                  <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 3 }}>
                    {item.qty} × {fmtMoney(item.rate, sym)} {item.taxRate > 0 && `+ ${item.taxRate}% tax`}
                  </div>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  style={{
                    background: "var(--danger-deep)",
                    border: "none",
                    borderRadius: 6,
                    color: "var(--danger)",
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "4px 8px",
                    cursor: "pointer",
                    fontFamily: "var(--font)"
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
            <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Total</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: "var(--blue)" }}>{fmtMoney(total, sym)}</span>
            </div>
          </div>
        </>
      )}

      {/* Notes */}
      <Field label="Notes (Optional)">
        <input
          type="text"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Thanks for your business."
          style={{
            width: "100%",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "10px 14px",
            fontFamily: "var(--font)",
            fontSize: 14,
            color: "var(--text)",
            background: "var(--surface)"
          }}
        />
      </Field>

      {/* Tip */}
      <div style={{ background: "var(--accent-deep)", borderRadius: 10, padding: "12px 14px", marginTop: 16, fontSize: 13, color: "var(--accent)", lineHeight: 1.5 }}>
        💡 <strong>Pro tip:</strong> Create the invoice now, then edit for advanced options like shipping address or terms.
      </div>
    </Modal>
  );
}
