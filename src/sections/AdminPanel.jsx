import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function AdminPanel() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);

  // 🔒 Only admin access
  if (user?.role !== "admin") {
    return <div style={{ padding: 20 }}>Access Denied</div>;
  }

  async function fetchUsers() {
    const snapshot = await getDocs(collection(db, "users"));
    const list = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setUsers(list);
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  // 🔥 Block user
const toggleBlock = async (id, blocked) => {
  if (id === user.id) {
    alert("You cannot block your own account.");
    return;
  }

  await updateDoc(doc(db, "users", id), {
    blocked: !blocked
  });

  fetchUsers();
};

  // 🔥 Delete user
  const deleteUser = async (id) => {
  if (id === user.id) {
    alert("You cannot delete your own admin account.");
    return;
  }

  if (!window.confirm("Are you sure you want to delete this user?")) return;

  await deleteDoc(doc(db, "users", id));
  fetchUsers();
};

  return (
    <div style={{ padding: 20 }}>
      <h2>Admin Panel</h2>

      {users.map(u => (
        <div key={u.id} style={{
          border: "1px solid #ddd",
          padding: 12,
          marginBottom: 10,
          borderRadius: 8
        }}>
          <div><b>{u.name}</b></div>
          <div>{u.email}</div>
          <div>{u.phone}</div>
          <div>Status: {u.blocked ? "Blocked ❌" : "Active ✅"}</div>

          {u.id !== user.id && (
  <>
    <button onClick={() => toggleBlock(u.id, u.blocked)}>
      {u.blocked ? "Unblock" : "Block"}
    </button>

    <button
      onClick={() => deleteUser(u.id)}
      style={{ marginLeft: 10, color: "red" }}
    >
      Delete
    </button>
  </>
)}
        </div>
      ))}
    </div>
  );
}