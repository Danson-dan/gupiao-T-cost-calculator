<template>
  <div class="history">
    <h1>历史记录</h1>
    <button @click="deleteAllRecords" class="delete-all-button">删除所有记录</button>
    <div v-if="deletedRecord" class="undo-notification">
      记录已删除。
      <button @click="undoDelete" class="undo-button">撤销删除</button>
    </div>
 
    <div v-if="history.length === 0" class="no-data">
      暂无历史记录
    </div>

    <template v-else>
      <table>
        <thead>
          <tr>
            <th>股票名称</th>
            <th>股票代码</th>
            <th>日期</th>
            <th>提交时间</th>
            <th>原持仓数量</th>
            <th>原持仓成本价</th>
            <th>买入数量</th>
            <th>买入价格</th>
            <th>卖出数量</th>
            <th>卖出价格</th>
            <th>做T后成本价</th>
            <th>做T盈亏</th>
            <th>总交易费用</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="record in history" :key="record.id">
            <td>{{ record.stock_name }}</td>
            <td>{{ record.stock_code }}</td>
            <td>{{ record.date }}</td>
            <td>{{ formatDateTime(record.created_at) }}</td>
            <td>{{ record.original_quantity }}</td>
            <td>{{ record.original_cost.toFixed(2) }}</td>
            <td>{{ record.buy_quantity }}</td>
            <td>{{ record.buy_price.toFixed(2) }}</td>
            <td>{{ record.sell_quantity }}</td>
            <td>{{ record.sell_price.toFixed(2) }}</td>
            <td>{{ record.new_cost.toFixed(2) }}</td>
            <td>{{ record.profit_loss.toFixed(2) }}</td>
            <td>{{ record.total_fees.toFixed(2) }}</td>
          </tr>
        </tbody>
      </table>

      <div class="pagination">
        <button 
          :disabled="currentPage === 1" 
          @click="changePage(currentPage - 1)"
        >上一页</button>
        <span>第 {{ currentPage }} 页 / 共 {{ totalPages }} 页</span>
        <button 
          :disabled="currentPage === totalPages" 
          @click="changePage(currentPage + 1)"
        >下一页</button>
      </div>
    </template>

    <div class="actions">
      <button  @click="exportToExcel" class="export-button">导出到Excel</button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      history: [],
      currentPage: 1,
      pageSize: 10,
      total: 0,
      deletedRecord: null,
      undoTimeout: null,
    };
  },
  async created() {
    await this.fetchHistory();
  },
  methods: {
    async fetchHistory() {
      try {
        const response = await fetch(`http://localhost:3000/history?page=${this.currentPage}&limit=${this.pageSize}`);
        if (!response.ok) {
          throw new Error('请求失败');
        }
        const data = await response.json();
        this.history = data.data;
        this.total = data.total;
      } catch (error) {
        console.error('获取历史记录失败:', error);
        alert('获取历史记录失败，请稍后重试');
      }
    },
    formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) {
      return '无效时间'; // 如果时间无效，返回提示
    }
    // 将 UTC 时间转换为本地时间
    const localDate = new Date(date.getTime() + 8 * 60 * 60 * 1000); // 加上 8 小时
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0'); // 月份从 0 开始，需要加 1
    const day = String(localDate.getDate()).padStart(2, '0');
    const hours = String(localDate.getHours()).padStart(2, '0');
    const minutes = String(localDate.getMinutes()).padStart(2, '0');
    const seconds = String(localDate.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  },
    async deleteRecord(record) {
      if (confirm('确定要删除这条记录吗？')) {
        try {
          const response = await fetch(`http://localhost:3000/history/${record.id}`, {
            method: 'DELETE',
          });
          if (!response.ok) {
            throw new Error('删除失败');
          }
          // 缓存删除的记录
          this.deletedRecord = record;
          // 设置 10 秒后清除缓存的记录
          this.undoTimeout = setTimeout(() => {
            this.deletedRecord = null;
          }, 10000); // 10 秒
          await this.fetchHistory(); // 重新加载历史记录
        } catch (error) {
          console.error('删除记录失败:', error);
          alert('删除记录失败，请稍后重试');
        }
      }
    },
    async undoDelete() {
      if (this.deletedRecord) {
        try {
          const response = await fetch('http://localhost:3000/history/restore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.deletedRecord),
          });
          if (!response.ok) {
            throw new Error('恢复失败');
          }
          this.deletedRecord = null; // 清除缓存的记录
          clearTimeout(this.undoTimeout); // 清除定时器
          await this.fetchHistory(); // 重新加载历史记录
        } catch (error) {
          console.error('恢复记录失败:', error);
          alert('恢复记录失败，请稍后重试');
        }
      }
    },
    async deleteAllRecords() {
      if (confirm('确定要删除所有记录吗？此操作不可恢复！')) {
        try {
          const response = await fetch('http://localhost:3000/history', {
            method: 'DELETE',
          });
          if (!response.ok) {
            throw new Error('删除失败');
          }
          await this.fetchHistory(); // 重新加载历史记录
        } catch (error) {
          console.error('删除所有记录失败:', error);
          alert('删除所有记录失败，请稍后重试');
        }
      }
    },
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleString();
    },
    exportToExcel() {
      const headers = [
        '时间', '原持仓数量', '原持仓成本价', '买入数量', 
        '买入价格', '卖出数量', '卖出价格', '做T后成本价', 
        '做T盈亏', '总交易费用'
      ];
      
      const csvContent = [
        headers.join(','),
        ...this.history.map(record => [
          record.created_at,
          record.original_quantity,
          record.original_cost,
          record.buy_quantity,
          record.buy_price,
          record.sell_quantity,
          record.sell_price,
          record.new_cost,
          record.profit_loss,
          record.total_fees
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `交易记录_${new Date().toLocaleDateString()}.csv`;
      link.click();
    },
    changePage(page) {
      this.currentPage = page;
      this.fetchHistory();
    }
  },
  computed: {
    totalPages() {
      return Math.ceil(this.total / this.pageSize);
    }
  }
};
</script>

<style>
.history {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.no-data {
  text-align: center;
  padding: 20px;
  color: #666;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.pagination button {
  padding: 5px 10px;
  border: 1px solid #ccc;
  background-color: #fff;
  cursor: pointer;
}

.pagination button:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}
th, td {
  padding: 10px;
  border: 1px solid #ccc;
  text-align: center;
  width: 900px;
}
th {
  background-color: #f5f5f5;
}
.export-button{
  background-color: #2edb84;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 20px;
}
.delete-button {
  background-color: #ff4d4d;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
}
.delete-button:hover {
  background-color: #cc0000;
}
.delete-all-button {
  background-color: #ff4d4d;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 20px;
}
.delete-all-button:hover {
  background-color: #cc0000;
}
.undo-notification {
  background-color: #f8d7da;
  color: #721c24;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.undo-button {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
}
.undo-button:hover {
  background-color: #218838;
}
th {
  background-color: black; /* 表头背景为黑色 */
  color: white; /* 文字颜色为白色 */
  min-width: 110px;
 
}
</style>