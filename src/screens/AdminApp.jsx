import React,{ useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Avatar } from "../components/UI";
import { getUserData } from "../utils/storage";

export default function AdminApp() {
  const { user, logout, adminGetUsers, adminIssueTempPassword, adminBlockUser, adminRemoveUser } = useAuth();
  const { theme, toggle } = useTheme();

  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [tempPass, setTempPass] = useState("");
  const [showTempForm, setShowTempForm] = useState(false);
  const [msg, setMsg] = useState("");

  function refresh() { setUsers(adminGetUsers()); }
  useEffect(() => { refresh(); }, []);

  function issueTempPass() {
    if (!tempPass || tempPass.length < 4) { setMsg("Enter at least 4 characters."); return; }
    adminIssueTempPassword(selected.id, tempPass);
    setMsg(`Temp password "${tempPass}" issued to ${selected.name}. They can log in with it once.`);
    setTempPass(""); setShowTempForm(false);
    refresh();
  }

  function toggleBlock(u) {
    if (!window.confirm(`${u.blocked ? "Unblock" : "Block"} ${u.name}?`)) return;
    adminBlockUser(u.id);
    refresh();
    if (selected?.id === u.id) setSelected({ ...u, blocked: !u.blocked });
  }

  function removeUser(u) {
    if (!window.confirm(`Permanently remove ${u.name} and all their data?`)) return;
    adminRemoveUser(u.id);
    setSelected(null);
    refresh();
  }

  // ✅ SAFE + BACKWARD COMPATIBLE DATA FETCH
  function getUserDataSafe(uid) {
    const data = getUserData(uid, "appData");

    // fallback for old users
    if (!data) {
      try {
        const old = JSON.parse(localStorage.getItem(`ledger_data_${uid}`));
        if (old) return old;
      } catch {}
    }

    return data || {
      invoices: [],
      customers: [],
      income: [],
      expenses: [],
      currency: { symbol: "₹" }
    };
  }

  return (
    <div style={{ background:"var(--bg)", minHeight:"100vh", maxWidth:480, margin:"0 auto", fontFamily:"var(--font)" }}>

      {/* Header */}
      <div style={{ background:"var(--surface)", borderBottom:"1px solid var(--border)", padding:"52px 20px 16px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:"var(--accent-text)", textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>Admin Panel</div>
          <div style={{ fontFamily:"var(--serif)", fontSize:26, color:"var(--text)" }}>Ledger</div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button className="theme-toggle" onClick={toggle} />
          <button onClick={() => { if(window.confirm("Sign out?")) logout(); }}
            style={{ background:"var(--danger-deep)", border:"1px solid var(--danger)33", borderRadius:12, padding:"8px 14px", fontSize:13, fontWeight:600, color:"var(--danger)", cursor:"pointer", fontFamily:"var(--font)" }}>
            Sign Out
          </button>
        </div>
      </div>

      <div style={{ padding:"20px 18px" }}>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:24 }}>
          {[
            ["Total Users", users.length, "var(--blue)"],
            ["Active", users.filter(u=>!u.blocked).length, "var(--accent)"],
            ["Blocked", users.filter(u=>u.blocked).length, "var(--danger)"],
          ].map(([label, val, col]) => (
            <div key={label} style={{ background:"var(--surface)", border:`1px solid ${col}33`, borderRadius:16, padding:"14px 12px", textAlign:"center" }}>
              <div style={{ fontFamily:"var(--serif)", fontSize:28, color:col, marginBottom:4 }}>{val}</div>
              <div style={{ fontSize:11, fontWeight:700, color:"var(--text-sec)", textTransform:"uppercase", letterSpacing:0.6 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* User list */}
        <div style={{ fontSize:11, fontWeight:700, color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>Users</div>

        {users.length === 0
          ? <div style={{ background:"var(--surface)", borderRadius:18, border:"1px solid var(--border)", padding:"32px", textAlign:"center", fontSize:14, color:"var(--text-dim)" }}>No users registered yet.</div>
          : <div style={{ background:"var(--surface)", borderRadius:18, border:"1px solid var(--border)", overflow:"hidden" }}>
              {users.map((u, idx) => {
                const uData = getUserDataSafe(u.id);

                const invCount = (uData.invoices || []).length;
                const custCount = (uData.customers || []).length;

                return (
                  <div key={u.id}
                    onClick={() => {
                      setSelected({ ...u });
                      setMsg("");
                      setShowTempForm(false);
                    }}
                    style={{
                      padding:"14px 18px",
                      borderBottom: idx < users.length-1 ? "1px solid var(--border)" : "none",
                      cursor:"pointer",
                      background: selected?.id === u.id ? "var(--surface-high)" : "transparent"
                    }}>

                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <Avatar name={u.name} size={40} fontSize={14} />

                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <span style={{ fontSize:15, fontWeight:600, color:"var(--text)" }}>{u.name}</span>

                          {u.blocked && (
                            <span style={{ background:"var(--danger-deep)", color:"var(--danger)", fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:10 }}>
                              BLOCKED
                            </span>
                          )}

                          {u.tempPassword && (
                            <span style={{ background:"var(--gold-deep)", color:"var(--gold)", fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:10 }}>
                              TEMP PASS
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize:12, color:"var(--text-dim)", marginTop:2 }}>
                          +{u.phone} · {invCount} invoices · {custCount} customers
                        </div>

                        <div style={{ fontSize:11, color:"var(--text-dim)", marginTop:1 }}>
                          Joined {new Date(u.createdAt).toLocaleDateString("en-IN")}
                        </div>
                      </div>

                      <span style={{ color:"var(--text-dim)", fontSize:18 }}>›</span>
                    </div>
                  </div>
                );
              })}
            </div>
        }

        {/* Selected user actions */}
        {selected && (
          <div style={{ marginTop:20 }}>

            <div style={{ fontSize:11, fontWeight:700, color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>
              Actions for {selected.name}
            </div>

            {msg && (
              <div style={{ marginBottom:10 }}>{msg}</div>
            )}
            <div style={{ marginTop:14, display:"flex", flexDirection:"column", gap:10 }}>

  {/* Issue temp password */}
  <button onClick={() => setShowTempForm(s => !s)}
    style={{
      border:"none",
      borderRadius:14,
      padding:"14px",
      fontFamily:"var(--font)",
      fontSize:15,
      fontWeight:600,
      cursor:"pointer",
      background:"var(--gold-deep)",
      color:"var(--gold)",
      textAlign:"left"
    }}>
    🔑 Issue Temporary Password
  </button>

  {showTempForm && (
    <div style={{
      background:"var(--surface-high)",
      borderRadius:14,
      padding:"16px",
      border:"1px solid var(--border)"
    }}>
      <div style={{ fontSize:13, color:"var(--text-sec)", marginBottom:10 }}>
        User will log in once with this, then it clears.
      </div>

      <input
        className="input-field"
        placeholder="Enter temp password"
        value={tempPass}
        onChange={e=>setTempPass(e.target.value)}
        style={{ marginBottom:10 }}
      />

      <button onClick={issueTempPass}
        style={{
          border:"none",
          borderRadius:12,
          padding:"12px",
          width:"100%",
          fontFamily:"var(--font)",
          fontSize:15,
          fontWeight:700,
          cursor:"pointer",
          background:"var(--gold)",
          color:"#0C0C10"
        }}>
        Issue Password
      </button>
    </div>
  )}

  {/* Block */}
  <button onClick={() => toggleBlock(selected)}
    style={{
      border:"none",
      borderRadius:14,
      padding:"14px",
      fontFamily:"var(--font)",
      fontSize:15,
      fontWeight:600,
      cursor:"pointer",
      background: selected.blocked ? "var(--accent-deep)" : "var(--danger-deep)",
      color: selected.blocked ? "var(--accent)" : "var(--danger)",
      textAlign:"left"
    }}>
    {selected.blocked ? "✅ Unblock User" : "🚫 Block User"}
  </button>

  {/* Remove */}
  <button onClick={() => removeUser(selected)}
    style={{
      border:"1px solid var(--danger)44",
      borderRadius:14,
      padding:"14px",
      fontFamily:"var(--font)",
      fontSize:15,
      fontWeight:600,
      cursor:"pointer",
      background:"var(--danger-deep)",
      color:"var(--danger)",
      textAlign:"left"
    }}>
    🗑 Remove User Permanently
  </button>

</div>
              
          </div>
        )}

      </div>
    </div>
  );
}