<template>
  <div class="w-full h-full pt-[100px] mobile:pt-[80px] overflow-y-auto p-6">
    <div class="w-full max-w-7xl mx-auto">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-white">Database Management</h2>
        <div class="flex gap-2">
          <button 
            @click="insertRow"
            :disabled="!currentTable || loading"
            class="bg-secondary-button text-black px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50">
            <span class="material-icons text-sm">add</span>
            Insert Row
          </button>
          <button 
            @click="deleteSelectedRow"
            :disabled="!selectedRow || loading"
            class="bg-error text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50">
            <span class="material-icons text-sm">delete</span>
            Delete Row
          </button>
          <button 
            @click="clearSelectedCell"
            :disabled="!selectedCell || loading"
            class="bg-yellow-500 text-black px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50">
            <span class="material-icons text-sm">clear</span>
            Clear Cell
          </button>
          <button 
            @click="refreshData"
            :disabled="!currentTable || loading"
            class="bg-primary-button text-black px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50">
            <span 
              :class="[
                'material-icons text-sm',
                loading ? 'animate-spin-slow' : ''
              ]">refresh</span>
            Refresh
          </button>
          <button 
            @click="saveAllChanges"
            :disabled="!currentTable || loading || !hasChanges"
            class="bg-green-500 text-black px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50">
            <span class="material-icons text-sm">save</span>
            Save
          </button>
        </div>
      </div>

      <!-- Table selector and search controls -->
      <div class="mb-6 flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <label class="block text-gray-300 text-sm font-medium mb-2">Select Table:</label>
          <select 
            v-model="currentTable"
            @change="loadTableData"
            :disabled="loading"
            class="bg-black/30 border border-[#444] text-white px-4 py-2 rounded-lg focus:outline-none focus:border-primary-button w-full disabled:opacity-50">
            <option value="">Select a table...</option>
            <option 
              v-for="table in databaseTables" 
              :key="table" 
              :value="table">
              {{ table }}
            </option>
          </select>
        </div>
        <div class="flex-1">
          <label class="block text-gray-300 text-sm font-medium mb-2">Search Table Data:</label>
          <div class="relative">
            <span class="material-icons-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">search</span>
            <input 
              v-model="searchQuery"
              type="text" 
              placeholder="Search all columns..." 
              @input="filterTableData"
              :disabled="!currentTable || loading"
              class="w-full pl-10 pr-4 py-2 bg-black/30 border border-[#444] rounded-lg text-white focus:border-primary-button focus:outline-none disabled:opacity-50">
          </div>
        </div>
        <div class="flex items-end">
          <select 
            v-model="sortColumn"
            @change="sortTableData"
            :disabled="!currentTable || loading"
            class="bg-black/30 border border-[#444] text-white px-4 py-2 rounded-lg focus:outline-none focus:border-primary-button disabled:opacity-50">
            <option value="">No sorting</option>
            <option 
              v-for="column in tableColumns" 
              :key="column" 
              :value="column">
              {{ column }}
            </option>
          </select>
        </div>
      </div>

      <div v-if="loading && !currentTable" class="flex justify-center items-center py-12">
        <span class="material-icons-outlined animate-spin-slow text-4xl text-primary-button">hourglass_empty</span>
      </div>

      <div v-else-if="error" class="bg-error/20 border border-error rounded-lg p-4 text-error text-center">
        {{ error }}
      </div>

      <div v-else-if="!currentTable" class="text-center py-12 text-gray-400">
        <span class="material-icons-outlined text-4xl mb-4">storage</span>
        <p class="text-lg">Select a table to view and edit its data</p>
      </div>

      <!-- Database table -->
      <div v-else class="bg-black/20 backdrop-blur-[20px] rounded-xl border border-[#444] overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-black/30">
              <tr>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-300 w-12">#</th>
                <th 
                  v-for="column in tableColumns" 
                  :key="column"
                  class="px-4 py-3 text-left text-sm font-medium text-gray-300 cursor-pointer hover:text-primary-button"
                  @click="sortBy = sortBy === column ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'asc'; sortColumn = column; sortTableData()">
                  {{ column }}
                  <span 
                    v-if="sortColumn === column"
                    class="material-icons-outlined text-xs ml-1">
                    {{ sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="(row, index) in filteredTableData" 
                :key="getRowId(row)"
                :class="[
                  'border-b border-[#444] hover:bg-black/20 transition-colors cursor-pointer',
                  selectedRow === getRowId(row) ? 'bg-primary-button/10' : ''
                ]"
                @click="selectRow(getRowId(row))">
                <td class="px-4 py-3 text-sm text-gray-400">{{ index + 1 }}</td>
                <td 
                  v-for="column in tableColumns" 
                  :key="column"
                  :class="[
                    'px-4 py-3 text-sm',
                    selectedCell === `${getRowId(row)}-${column}` ? 'bg-yellow-500/20' : ''
                  ]"
                  @click.stop="selectCell(getRowId(row), column, $event)">
                  <input 
                    v-if="editingCell === `${getRowId(row)}-${column}`"
                    v-model="row[column]"
                    @blur="stopEditingCell"
                    @keydown.enter="stopEditingCell"
                    @keydown.esc="cancelEditCell"
                    class="w-full bg-black/50 border border-primary-button rounded px-2 py-1 text-white focus:outline-none"
                    ref="editInput">
                  <span v-else>{{ formatCellValue(row[column]) }}</span>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="filteredTableData.length === 0" class="text-center py-8 text-gray-400">
            No data found
          </div>
        </div>
      </div>

      <!-- Status message -->
      <div v-if="statusMessage" class="mt-4">
        <div :class="[
          'p-3 rounded-lg',
          statusMessage.type === 'success' ? 'bg-ok/20 text-ok border border-ok/30' : 'bg-error/20 text-error border border-error/30'
        ]">
          {{ statusMessage.text }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useAdmin } from '../composables/useAdmin.js'

export default {
  name: 'DatabaseView',
  props: {
    token: String
  },
  setup(props) {
    const { 
      databaseTables,
      currentTable,
      tableData,
      loading,
      error,
      loadTables,
      loadTableData,
      saveTableData,
      deleteTableRow
    } = useAdmin()

    const searchQuery = ref('')
    const sortColumn = ref('')
    const sortBy = ref('')
    const sortOrder = ref('asc')
    const selectedRow = ref(null)
    const selectedCell = ref(null)
    const editingCell = ref(null)
    const originalValue = ref(null)
    const statusMessage = ref('')
    const hasChanges = ref(false)

    const tableColumns = computed(() => {
      if (tableData.value.length === 0) return []
      return Object.keys(tableData.value[0])
    })

    const filteredTableData = computed(() => {
      let filtered = [...tableData.value]

      // Apply search filter
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(row => 
          Object.values(row).some(value => 
            String(value).toLowerCase().includes(query)
          )
        )
      }

      // Apply sorting
      if (sortBy.value) {
        filtered.sort((a, b) => {
          const aVal = a[sortBy.value]
          const bVal = b[sortBy.value]
          
          if (aVal === null || aVal === undefined) return 1
          if (bVal === null || bVal === undefined) return -1
          
          let comparison = 0
          if (typeof aVal === 'number' && typeof bVal === 'number') {
            comparison = aVal - bVal
          } else {
            comparison = String(aVal).localeCompare(String(bVal))
          }
          
          return sortOrder.value === 'asc' ? comparison : -comparison
        })
      }

      return filtered
    })

    const getRowId = (row) => {
      return row.id || row.ID || JSON.stringify(row)
    }

    const formatCellValue = (value) => {
      if (value === null || value === undefined) return 'NULL'
      if (typeof value === 'boolean') return value ? 'true' : 'false'
      if (typeof value === 'object') return JSON.stringify(value)
      return String(value)
    }

    const selectRow = (rowId) => {
      selectedRow.value = rowId
      selectedCell.value = null
    }

    const selectCell = (rowId, column, event) => {
      event.stopPropagation()
      selectedCell.value = `${rowId}-${column}`
      selectedRow.value = null
    }

    const startEditingCell = (rowId, column) => {
      const cellKey = `${rowId}-${column}`
      const row = tableData.value.find(r => getRowId(r) === rowId)
      originalValue.value = row ? row[column] : null
      editingCell.value = cellKey
      
      nextTick(() => {
        const input = document.querySelector(`input`)
        if (input) {
          input.focus()
          input.select()
        }
      })
    }

    const stopEditingCell = () => {
      if (editingCell.value) {
        hasChanges.value = true
      }
      editingCell.value = null
      originalValue.value = null
    }

    const cancelEditCell = () => {
      if (editingCell.value && originalValue.value !== null) {
        const [rowId, column] = editingCell.value.split('-')
        const row = tableData.value.find(r => getRowId(r) === rowId)
        if (row) {
          row[column] = originalValue.value
        }
      }
      editingCell.value = null
      originalValue.value = null
    }

    const insertRow = () => {
      if (!currentTable.value || tableColumns.value.length === 0) return
      
      const newRow = {}
      tableColumns.value.forEach(column => {
        newRow[column] = null
      })
      
      tableData.value.unshift(newRow)
      hasChanges.value = true
      showStatusMessage('New row added. Click Save to persist changes.', 'success')
    }

    const deleteSelectedRow = () => {
      if (!selectedRow.value) return
      
      if (confirm('Are you sure you want to delete this row?')) {
        const index = tableData.value.findIndex(row => getRowId(row) === selectedRow.value)
        if (index > -1) {
          tableData.value.splice(index, 1)
          selectedRow.value = null
          hasChanges.value = true
          showStatusMessage('Row marked for deletion. Click Save to persist changes.', 'success')
        }
      }
    }

    const clearSelectedCell = () => {
      if (!selectedCell.value) return
      
      const [rowId, column] = selectedCell.value.split('-')
      const row = tableData.value.find(r => getRowId(r) === rowId)
      if (row) {
        row[column] = null
        hasChanges.value = true
        showStatusMessage('Cell cleared. Click Save to persist changes.', 'success')
      }
    }

    const refreshData = () => {
      if (currentTable.value) {
        loadTableData(props.token, currentTable.value)
        hasChanges.value = false
        showStatusMessage('Data refreshed.', 'success')
      }
    }

    const saveAllChanges = async () => {
      if (!currentTable.value) return
      
      loading.value = true
      try {
        const result = await saveTableData(props.token, currentTable.value, tableData.value)
        if (result.success) {
          hasChanges.value = false
          showStatusMessage('Changes saved successfully!', 'success')
          await loadTableData(props.token, currentTable.value)
        } else {
          showStatusMessage('Failed to save changes: ' + result.error, 'error')
        }
      } catch (error) {
        showStatusMessage('Failed to save changes: ' + error.message, 'error')
      } finally {
        loading.value = false
      }
    }

    const filterTableData = () => {
      // This is handled by the computed property
    }

    const sortTableData = () => {
      // This is handled by the computed property
    }

    const showStatusMessage = (text, type) => {
      statusMessage.value = { text, type }
      setTimeout(() => {
        statusMessage.value = ''
      }, 3000)
    }

    onMounted(() => {
      loadTables(props.token)
    })

    return {
      databaseTables,
      currentTable,
      tableData,
      loading,
      error,
      searchQuery,
      sortColumn,
      sortBy,
      sortOrder,
      selectedRow,
      selectedCell,
      editingCell,
      hasChanges,
      statusMessage,
      tableColumns,
      filteredTableData,
      getRowId,
      formatCellValue,
      selectRow,
      selectCell,
      startEditingCell,
      stopEditingCell,
      cancelEditCell,
      insertRow,
      deleteSelectedRow,
      clearSelectedCell,
      refreshData,
      saveAllChanges,
      filterTableData,
      sortTableData,
      loadTableData: () => loadTableData(props.token, currentTable.value)
    }
  }
}
</script>
