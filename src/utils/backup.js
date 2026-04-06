export function exportUserData(userId) {
  const key = `ledgerApp_v1_user_${userId}_appData`;
  const data = localStorage.getItem(key);

  if (!data) {
    alert("No data found to export.");
    return;
  }

  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `ledger-backup-${userId}-${Date.now()}.json`;
  a.click();

  URL.revokeObjectURL(url);
}

export function importUserData(userId, file, onSuccess) {
  const reader = new FileReader();

  reader.onload = function (e) {
    try {
      const parsed = JSON.parse(e.target.result);

      const key = `ledgerApp_v1_user_${userId}_appData`;
      localStorage.setItem(key, JSON.stringify(parsed));

      alert("Backup restored successfully!");
      onSuccess && onSuccess();

    } catch (err) {
      alert("Invalid backup file.");
    }
  };

  reader.readAsText(file);
}