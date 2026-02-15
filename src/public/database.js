// Database management JavaScript
let authToken = localStorage.getItem("token");
let currentTable = "";
let selectedRow = null;
let selectedCell = null;

// Check admin authentication on page load
document.addEventListener("DOMContentLoaded", function () {
  if (!authToken) {
    window.location.href = "/";
    return;
  }

  // Verify admin session
  fetch("/verifySession", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({ token: authToken }),
  })
    .then((response) => {
      if (!response.ok) {
        window.location.href = "/";
        return;
      }
      return response.json();
    })
    .then((data) => {
      if (data.permission !== "admin") {
        window.location.href = "/";
        return;
      }
      // Load initial data
      loadTables();
    })
    .catch((error) => {
      console.error("Authentication error:", error);
      window.location.href = "/";
    });
});

async function loadTables() {
  try {
    const response = await fetch("/admin/getTables", {
      method: "GET",
      headers: {
        Authorization: authToken,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to load tables");
    }

    const tables = await response.json();
    populateTableSelector(tables);
  } catch (error) {
    console.error("Error loading tables:", error);
    showError("Failed to load database tables");
  }
}

function populateTableSelector(tables) {
  const selector = document.getElementById("tableSelector");
  selector.innerHTML = `
    <option value="">Select a table...</option>
    ${tables.map(table => `<option value="${table}">${table}</option>`).join('')}
  `;
}

async function loadTableData() {
  const selector = document.getElementById("tableSelector");
  currentTable = selector.value;

  if (!currentTable) {
    clearTable();
    return;
  }

  try {
    const response = await fetch(`/admin/getTableData?table=${currentTable}`, {
      method: "GET",
      headers: {
        Authorization: authToken,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to load table data");
    }

    const data = await response.json();
    displayTableData(data);
  } catch (error) {
    console.error("Error loading table data:", error);
    showError("Failed to load table data");
  }
}

function displayTableData(data) {
  const header = document.getElementById("tableHeader");
  const body = document.getElementById("tableBody");

  if (!data.columns || !data.rows) {
    header.innerHTML = '<tr><th class="px-4 py-3 text-left text-white border-b border-[#444]">No data</th></tr>';
    body.innerHTML = '<tr><td class="px-4 py-3 text-white">No data available</td></tr>';
    return;
  }

  // Create headers
  header.innerHTML = `
    <tr>
      <th class="px-4 py-3 text-left text-white border-b border-[#444]">#</th>
      ${data.columns.map(col => `<th class="px-4 py-3 text-left text-white border-b border-[#444]">${col}</th>`).join('')}
    </tr>
  `;

  // Create rows
  body.innerHTML = data.rows.map((row, index) => `
    <tr class="border-b border-[#444] hover:bg-black/10 transition-colors cursor-pointer" 
        onclick="selectRow(this, ${index})">
      <td class="px-4 py-3 text-white font-medium">${index + 1}</td>
      ${row.map((cell, cellIndex) => `
        <td class="px-4 py-3 text-white font-mono text-sm" 
            onclick="selectCell(event, this, ${index}, ${cellIndex})" 
            contenteditable="true"
            onblur="updateCell(${index}, ${cellIndex}, this.textContent)">
          ${cell === null ? '<span class="text-gray-500">NULL</span>' : cell}
        </td>
      `).join('')}
    </tr>
  `).join('');
}

function clearTable() {
  document.getElementById("tableHeader").innerHTML = '';
  document.getElementById("tableBody").innerHTML = '';
  selectedRow = null;
  selectedCell = null;
}

function selectRow(row, index) {
  // Remove previous selection
  if (selectedRow) {
    selectedRow.classList.remove('bg-primary-button/20');
  }
  
  // Add selection to current row
  selectedRow = row;
  selectedRow.classList.add('bg-primary-button/20');
}

function selectCell(event, cell, rowIndex, cellIndex) {
  event.stopPropagation();
  
  // Remove previous cell selection
  if (selectedCell) {
    selectedCell.classList.remove('ring-2', 'ring-primary-button');
  }
  
  // Add selection to current cell
  selectedCell = cell;
  selectedCell.classList.add('ring-2', 'ring-primary-button');
}

async function updateCell(rowIndex, cellIndex, newValue) {
  if (!currentTable) return;

  try {
    const response = await fetch("/admin/updateCell", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
      body: JSON.stringify({
        table: currentTable,
        rowIndex: rowIndex,
        cellIndex: cellIndex,
        value: newValue.trim() === '' ? null : newValue.trim()
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to update cell");
    }

    showSuccess("Cell updated successfully");
    loadTableData(); // Refresh data
  } catch (error) {
    console.error("Error updating cell:", error);
    showError("Failed to update cell");
    loadTableData(); // Refresh to restore original value
  }
}

function insertRow() {
  if (!currentTable) {
    showError("Please select a table first");
    return;
  }

  // Create insert row modal
  const modal = document.createElement("div");
  modal.className = "fixed inset-0 bg-black/50 flex items-center justify-center z-50";
  modal.innerHTML = `
    <div class="bg-main border border-[#444] rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
      <h3 class="text-xl font-bold text-white mb-4">Insert New Row</h3>
      <div id="insertForm" class="space-y-3">
        <!-- Form fields will be populated here -->
      </div>
      <div class="flex gap-3 justify-end mt-6">
        <button onclick="this.closest('.fixed').remove()" 
                class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors">
          Cancel
        </button>
        <button onclick="confirmInsertRow()" 
                class="px-4 py-2 bg-secondary-button text-black rounded hover:opacity-90 transition-opacity">
          Insert Row
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Populate form fields
  populateInsertForm();
}

async function populateInsertForm() {
  try {
    const response = await fetch(`/admin/getTableSchema?table=${currentTable}`, {
      method: "GET",
      headers: {
        Authorization: authToken,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to get table schema");
    }

    const schema = await response.json();
    const form = document.getElementById("insertForm");
    
    form.innerHTML = schema.map(column => `
      <div>
        <label class="block text-white text-sm font-medium mb-1">
          ${column.name} ${column.nullable === 'NO' ? '<span class="text-red-400">*</span>' : ''}
        </label>
        <input type="text" 
               id="insert_${column.name}" 
               class="w-full px-3 py-2 bg-black/30 border border-[#444] rounded text-white focus:border-primary-button focus:outline-none"
               placeholder="${column.nullable === 'YES' ? 'NULL or value' : 'Required value'}"
               ${column.nullable === 'NO' ? 'required' : ''}>
        <div class="text-xs text-gray-400 mt-1">Type: ${column.type}</div>
      </div>
    `).join('');
  } catch (error) {
    console.error("Error getting table schema:", error);
    showError("Failed to get table schema");
  }
}

async function confirmInsertRow() {
  try {
    const response = await fetch(`/admin/getTableSchema?table=${currentTable}`, {
      method: "GET",
      headers: {
        Authorization: authToken,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to get table schema");
    }

    const schema = await response.json();
    const values = {};
    
    schema.forEach(column => {
      const input = document.getElementById(`insert_${column.name}`);
      if (input) {
        const value = input.value.trim();
        values[column.name] = value === '' ? null : value;
      }
    });

    const insertResponse = await fetch("/admin/insertRow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
      body: JSON.stringify({
        table: currentTable,
        values: values
      }),
    });

    if (!insertResponse.ok) {
      throw new Error("Failed to insert row");
    }

    showSuccess("Row inserted successfully");
    document.querySelector(".fixed.inset-0").remove();
    loadTableData(); // Refresh data
  } catch (error) {
    console.error("Error inserting row:", error);
    showError("Failed to insert row");
  }
}

function deleteSelectedRow() {
  if (!selectedRow) {
    showError("Please select a row to delete");
    return;
  }

  if (!currentTable) {
    showError("Please select a table first");
    return;
  }

  // Create delete confirmation modal
  const modal = document.createElement("div");
  modal.className = "fixed inset-0 bg-black/50 flex items-center justify-center z-50";
  modal.innerHTML = `
    <div class="bg-main border border-[#444] rounded-xl p-6 max-w-md w-full mx-4">
      <h3 class="text-xl font-bold text-white mb-4">Delete Row Confirmation</h3>
      <p class="text-gray-300 mb-4">
        Are you sure you want to delete the selected row? This action cannot be undone!
      </p>
      
      <div class="mb-4">
        <label class="block text-white text-sm font-medium mb-2">
          Enter your admin password to confirm:
        </label>
        <input type="password" id="adminPassword" 
               class="w-full px-3 py-2 bg-black/30 border border-[#444] rounded text-white focus:border-primary-button focus:outline-none"
               placeholder="Enter your admin password">
      </div>
      
      <div class="flex gap-3 justify-end">
        <button onclick="this.closest('.fixed').remove()" 
                class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors">
          Cancel
        </button>
        <button onclick="confirmDeleteRow()" 
                class="px-4 py-2 bg-error text-white rounded hover:bg-red-600 transition-colors">
          Delete Row
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById("adminPassword").focus();
}

async function confirmDeleteRow() {
  const password = document.getElementById("adminPassword").value;

  if (!password) {
    showError("Please enter your admin password");
    return;
  }

  try {
    const rowIndex = Array.from(selectedRow.parentNode.children).indexOf(selectedRow);
    
    const response = await fetch("/admin/deleteRow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
      body: JSON.stringify({
        table: currentTable,
        rowIndex: rowIndex,
        adminPassword: password
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to delete row");
    }

    showSuccess("Row deleted successfully");
    document.querySelector(".fixed.inset-0").remove();
    selectedRow = null;
    loadTableData(); // Refresh data
  } catch (error) {
    console.error("Error deleting row:", error);
    showError("Failed to delete row");
  }
}

function clearSelectedCell() {
  if (!selectedCell) {
    showError("Please select a cell to clear");
    return;
  }

  selectedCell.textContent = '';
  selectedCell.focus();
}

function refreshData() {
  if (currentTable) {
    loadTableData();
    showSuccess("Data refreshed");
  } else {
    showError("Please select a table first");
  }
}

function showError(message) {
  const statusDiv = document.getElementById("statusMessage");
  statusDiv.classList.remove("hidden");
  statusDiv.innerHTML = `<div class="p-3 rounded-lg bg-error/20 border border-error/50 text-error">${message}</div>`;
  
  setTimeout(() => {
    statusDiv.classList.add("hidden");
  }, 5000);
}

function showSuccess(message) {
  const statusDiv = document.getElementById("statusMessage");
  statusDiv.classList.remove("hidden");
  statusDiv.innerHTML = `<div class="p-3 rounded-lg bg-ok/20 border border-ok/50 text-ok">${message}</div>`;
  
  setTimeout(() => {
    statusDiv.classList.add("hidden");
  }, 3000);
}
