const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// db 연결 설정
const db = mysql.createConnection({
  host: 'db',
  user: 'root',
  password: 'password123',
  database: 'financedb'
});

// db연결 함수 - 연결 안되면 계속 재시도함
const connectDB = () => {
  db.connect((err) => {
    if (err) {
      console.log('연결 실패, 재시도중...');
      setTimeout(connectDB, 5000); // 5초마다 재시도
    } else {
      console.log('DB 연결됨');
      // 테이블 만들기
      db.query(`
        CREATE TABLE IF NOT EXISTS transactions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          type ENUM('income', 'expense') NOT NULL,
          amount INT NOT NULL,
          description VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
  });
}

connectDB();

// 헬스체크 api
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: '서버 정상 작동중' });
});

// 오늘 거래내역 가져오기
app.get('/transactions', (req, res) => {
  const query = 'SELECT * FROM transactions WHERE DATE(created_at) = CURDATE() ORDER BY created_at DESC';
  db.query(query, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
  });
});

// 달력용 - 월별 데이터
app.get('/transactions/monthly/:year/:month', (req, res) => {
  const year = req.params.year;
  const month = req.params.month;
  
  // 날짜별로 수익 지출 합계 계산
  const query = `SELECT 
      DATE(created_at) as date,
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
    FROM transactions 
    WHERE YEAR(created_at) = ? AND MONTH(created_at) = ?
    GROUP BY DATE(created_at)
    ORDER BY date`;
    
  db.query(query, [year, month], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
  });
});

// 날짜 클릭하면 그날 거래내역 보여주기
app.get('/transactions/date/:date', (req, res) => {
  const date = req.params.date;
  db.query('SELECT * FROM transactions WHERE DATE(created_at) = ? ORDER BY created_at DESC', 
    [date], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
  });
});

// 오늘 요약 (수익, 지출, 순이익)
app.get('/summary', (req, res) => {
  const summaryQuery = `SELECT 
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as totalIncome,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as totalExpense
    FROM transactions 
    WHERE DATE(created_at) = CURDATE()`;
    
  db.query(summaryQuery, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      
      const totalIncome = results[0].totalIncome || 0;
      const totalExpense = results[0].totalExpense || 0;
      const balance = totalIncome - totalExpense; // 순이익 계산
      
      res.json({
        totalIncome: totalIncome,
        totalExpense: totalExpense,
        balance: balance
      });
  });
});

// 거래 추가
app.post('/transactions', (req, res) => {
  const type = req.body.type;
  const amount = req.body.amount;
  const description = req.body.description;
  
  // 검증
  if (!type || !amount) {
    return res.status(400).json({ error: 'type과 amount는 필수입니다' });
  }
  
  if (type !== 'income' && type !== 'expense') {
    return res.status(400).json({ error: 'type은 income 또는 expense여야 합니다' });
  }

  const insertQuery = 'INSERT INTO transactions (type, amount, description) VALUES (?, ?, ?)';
  db.query(insertQuery, [type, amount, description || ''], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      
      res.json({ 
        id: result.insertId, 
        type: type, 
        amount: amount, 
        description: description,
        message: '거래가 추가되었습니다' 
      });
  });
});

// 수정 기능
app.put('/transactions/:id', (req, res) => {
  const id = req.params.id;
  const type = req.body.type;
  const amount = req.body.amount;
  const description = req.body.description;
  
  // 검증
  if (!type || !amount) {
    return res.status(400).json({ error: 'type과 amount는 필수입니다' });
  }
  
  if (type !== 'income' && type !== 'expense') {
    return res.status(400).json({ error: 'type은 income 또는 expense여야 합니다' });
  }

  const updateQuery = 'UPDATE transactions SET type = ?, amount = ?, description = ? WHERE id = ?';
  db.query(updateQuery, [type, amount, description || '', id], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: '거래를 찾을 수 없습니다' });
      }
      
      res.json({ 
        id: id, 
        type: type, 
        amount: amount, 
        description: description,
        message: '거래가 수정되었습니다' 
      });
  });
});

// 삭제
app.delete('/transactions/:id', (req, res) => {
  const id = req.params.id;
  
  db.query('DELETE FROM transactions WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '거래를 찾을 수 없습니다' });
    }
    
    res.json({ message: '거래가 삭제되었습니다' });
  });
});

// 서버 시작
const PORT = 5000;
app.listen(PORT, () => {
  console.log('수익/지출 서버 실행됨 - 포트 ' + PORT);
});

