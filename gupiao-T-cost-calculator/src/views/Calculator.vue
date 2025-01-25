<template>
  <div class="calculator">
    <h1>股票做T成本计算器</h1>
    <form @submit.prevent="calculate">
      <div>
        <label>股票名称：</label>
        <input v-model="stockName" type="text" required />
      </div>
      <div>
        <label>股票代码：</label>
        <input v-model="stockCode" type="text" required />
      </div>
      <div>
        <label>日期：</label>
        <input v-model="date" type="date" required />
      </div>
      <div>
        <label>原持仓数量：</label>
        <input v-model.number="originalQuantity" type="number" required />
      </div>
      <div>
        <label>原持仓成本价：</label>
        <input v-model.number="originalCost" type="number" step="0.01" required />
      </div>
      <div>
        <label>买入数量：</label>
        <input v-model.number="buyQuantity" type="number" required />
      </div>
      <div>
        <label>买入价格：</label>
        <input v-model.number="buyPrice" type="number" step="0.01" required />
      </div>
      <div>
        <label>卖出数量：</label>
        <input v-model.number="sellQuantity" type="number" required />
      </div>
      <div>
        <label>卖出价格：</label>
        <input v-model.number="sellPrice" type="number" step="0.01" required />
      </div>
      <div>
        <label>佣金费率（%）：</label>
        <input v-model.number="commissionRate" type="number" step="0.001" required />
      </div>
      <div>
        <label>印花税率（%）：</label>
        <input v-model.number="stampTaxRate" type="number" step="0.001" required />
      </div>
      <div>
        <label>过户费率（%）：</label>
        <input v-model.number="transferFee" type="number" step="0.001" required />
      </div>
      <button type="submit">计算</button>
    </form>
    <div v-if="result" class="result">
      <h2>计算结果</h2>
      <p>做T后的持仓成本价：{{ result.new_cost.toFixed(2) }}</p>
      <p>做T操作的盈亏：{{ result.profit_loss.toFixed(2) }}</p>
      <p>总交易费用：{{ result.total_fees.toFixed(2) }}</p>
    </div>
    <div v-if="error" class="error">
      <p>{{ error }}</p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    // 获取当前日期并格式化为 YYYY-MM-DD
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // 月份从 0 开始，需要加 1
    const day = String(today.getDate()).padStart(2, '0');
    const defaultDate = `${year}-${month}-${day}`;

    return {
      stockName: '', // 股票名称
      stockCode: '', // 股票代码
      date: defaultDate, // 默认日期为当天
      originalQuantity: 0,
      originalCost: 0,
      buyQuantity: 0,
      buyPrice: 0,
      sellQuantity: 0,
      sellPrice: 0,
      commissionRate: 0.03, // 默认佣金费率（%）
      stampTaxRate: 0.1, // 默认印花税率（%）
      transferFee: 0.002, // 默认过户费率（%）
      result: null,
      error: null, // 错误信息
    };
  },
  computed: {
    inputValidation() {
      return {
        isValid: this.sellQuantity <= this.originalQuantity,
        errorMessage: this.sellQuantity > this.originalQuantity ? 
          '卖出数量不能大于持仓数量' : ''
      }
    }
  },
  methods: {
    validate() {
      if (!this.inputValidation.isValid) {
        this.$notify({
          type: 'error',
          message: this.inputValidation.errorMessage
        });
        return false;
      }
      return true;
    },
    async calculate() {
      if (!this.validate()) return;
      this.error = null; // 清空错误信息
      try {
        const response = await fetch('http://localhost:3000/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stock_name: this.stockName,
            stock_code: this.stockCode,
            date: this.date,
            original_quantity: this.originalQuantity,
            original_cost: this.originalCost,
            buy_quantity: this.buyQuantity,
            buy_price: this.buyPrice,
            sell_quantity: this.sellQuantity,
            sell_price: this.sellPrice,
            commission_rate: this.commissionRate / 100,
            stamp_tax_rate: this.stampTaxRate / 100,
            transfer_fee: this.transferFee / 100,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '请求失败');
        }

        const result = await response.json();
        console.log('Calculation result:', result);
        this.result = result;
      } catch (error) {
        console.error('计算失败:', error);
        this.error = error.message || '计算失败，请检查输入或后端服务';
      }
    },
  },
};
</script>

<style>
.calculator {
  max-width: 600px;
  width: 90%;
  margin: 0 auto;
  padding: 20px;
}

@media (max-width: 768px) {
  .calculator form div {
    display: flex;
    flex-direction: column;
  }
  
  .calculator input {
    width: 100%;
    margin-top: 5px;
  }
  
  .calculator label {
    width: 100%;
  }
}

form div {
  margin-bottom: 10px;
}
label {
  display: inline-block;
  width: 160px;
}
input {
  width: 120px;
}
button {
  margin-top: 10px;
}
.result {
  margin-top: 20px;
}
.error {
  color: red;
  margin-top: 20px;
}
</style> 