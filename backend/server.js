const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const port = 3000;

// 启用 CORS
app.use(cors());
app.use(express.json());

// 连接 SQLite 数据库
const db = new sqlite3.Database('./db/stock.db', (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// 更新表结构
function updateTableSchema() {
  db.run('ALTER TABLE calculations ADD COLUMN stock_name TEXT', (err) => {
    if (err) {
      console.error('Error adding stock_name column:', err);
    } else {
      console.log('stock_name column added successfully');
    }
  });

  db.run('ALTER TABLE calculations ADD COLUMN stock_code TEXT', (err) => {
    if (err) {
      console.error('Error adding stock_code column:', err);
    } else {
      console.log('stock_code column added successfully');
    }
  });

  db.run('ALTER TABLE calculations ADD COLUMN date TEXT', (err) => {
    if (err) {
      console.error('Error adding date column:', err);
    } else {
      console.log('date column added successfully');
    }
  });
}


db.run(`
  CREATE TABLE IF NOT EXISTS calculations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stock_name TEXT,
    stock_code TEXT,
    date TEXT,
    original_quantity REAL,
    original_cost REAL,
    buy_quantity REAL,
    buy_price REAL,
    sell_quantity REAL,
    sell_price REAL,
    new_cost REAL,
    profit_loss REAL,
    total_fees REAL,
    commission_rate REAL,
    stamp_tax_rate REAL,
    transfer_fee REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);


  

// 计算做T成本的 API
app.post('/calculate', (req, res) => {
  const {
    stock_name,
    stock_code,
    date,
    original_quantity,
    original_cost,
    buy_quantity,
    buy_price,
    sell_quantity,
    sell_price,
    commission_rate = 0.0003,
    stamp_tax_rate = 0.001,
    transfer_fee = 0.00002,
  } = req.body;

  // 输入验证
  if (!stock_name || !stock_code || !date || 
      isNaN(original_quantity) || isNaN(original_cost) ||
      isNaN(buy_quantity) || isNaN(buy_price) || 
      isNaN(sell_quantity) || isNaN(sell_price)) {
    return res.status(400).json({ error: 'Invalid input data' });
  }

  // 计算交易费用
  const buy_commission = buy_quantity * buy_price * commission_rate;
  const sell_commission = sell_quantity * sell_price * commission_rate;
  const stamp_tax = sell_quantity * sell_price * stamp_tax_rate;
  const transfer_fee_total = (buy_quantity + sell_quantity) * transfer_fee;
  const total_fees = buy_commission + sell_commission + stamp_tax + transfer_fee_total;

  // 计算做T后的持仓成本价
  const new_quantity = original_quantity + buy_quantity - sell_quantity;
  const new_cost = new_quantity === 0 ? 0 :
    (original_quantity * original_cost + buy_quantity * buy_price - sell_quantity * sell_price) / new_quantity;

  // 计算做T盈亏
  const profit_loss = (sell_price - buy_price) * sell_quantity - total_fees;

  // 保存计算结果到数据库
  const query = `
    INSERT INTO calculations (
      stock_name, stock_code, date,
      original_quantity, original_cost, buy_quantity, buy_price, 
      sell_quantity, sell_price, new_cost, profit_loss, total_fees,
      commission_rate, stamp_tax_rate, transfer_fee
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [
    stock_name, stock_code, date,
    original_quantity, original_cost, buy_quantity, buy_price,
    sell_quantity, sell_price, new_cost, profit_loss, total_fees,
    commission_rate, stamp_tax_rate, transfer_fee
  ], (err) => {
    if (err) {
      console.error('Error saving calculation:', err);
      res.status(500).json({ error: 'Failed to save calculation' });
    } else {
      res.json({ new_cost, profit_loss, total_fees });
    }
  });
});

// 获取分页历史记录的 API
app.get('/history', (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;
  
  const query = 'SELECT * FROM calculations ORDER BY created_at DESC LIMIT ? OFFSET ?';
  db.all(query, [limit, offset], (err, rows) => {
    if (err) {
      console.error('Error fetching history:', err);
      return res.status(500).json({ error: 'Failed to fetch history' });
    }
    
    // 获取总记录数
    db.get('SELECT COUNT(*) AS total FROM calculations', (err, result) => {
      if (err) {
        console.error('Error fetching total records:', err);
        return res.status(500).json({ error: 'Failed to fetch total records' });
      }
      
      res.json({
        data: rows,
        total: result.total,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    });
  });
});

// 删除单条记录的 API
app.delete('/history/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM calculations WHERE id = ?';
  
  db.run(query, [id], (err) => {
    if (err) {
      console.error('Error deleting record:', err);
      return res.status(500).json({ error: 'Failed to delete record' });
    }
    res.json({ success: true });
  });
});

// 删除所有记录的 API
app.delete('/history', (req, res) => {
  const query = 'DELETE FROM calculations';
  
  db.run(query, (err) => {
    if (err) {
      console.error('Error deleting all records:', err);
      return res.status(500).json({ error: 'Failed to delete all records' });
    }
    res.json({ success: true });
  });
});

// 恢复删除记录的 API
app.post('/history/restore', (req, res) => {
  const {
    stock_name,
    stock_code,
    date,
    original_quantity,
    original_cost,
    buy_quantity,
    buy_price,
    sell_quantity,
    sell_price,
    new_cost,
    profit_loss,
    total_fees,
  } = req.body;

  const query = `
    INSERT INTO calculations (
      stock_name, stock_code, date,
      original_quantity, original_cost, buy_quantity, buy_price,
      sell_quantity, sell_price, new_cost, profit_loss, total_fees
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.run(query, [
    stock_name, stock_code, date,
    original_quantity, original_cost, buy_quantity, buy_price,
    sell_quantity, sell_price, new_cost, profit_loss, total_fees
  ], (err) => {
    if (err) {
      console.error('Error restoring record:', err);
      return res.status(500).json({ error: 'Failed to restore record' });
    }
    res.json({ success: true });
  });
});

// 启动服务器
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
}); 