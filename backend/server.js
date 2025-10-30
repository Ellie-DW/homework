const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: 'db',
  user: 'root',
  password: 'password123',
  database: 'counterdb'
});

const connectDB = () => {
  db.connect((err) => {
    if (err) {
      console.log('연결 실패, 재시도중...');
      setTimeout(connectDB, 5000);
    } else {
      console.log('DB 연결됨');
      db.query('CREATE TABLE IF NOT EXISTS counter (id INT PRIMARY KEY, count INT DEFAULT 0)');
      db.query('INSERT IGNORE INTO counter (id, count) VALUES (1, 0)');
    }
  });
}

connectDB();

app.get('/count', (req, res) => {
  db.query('SELECT count FROM counter WHERE id = 1', (err, results) => {
    res.json({ count: results[0].count });
  });
});

app.post('/increment', (req, res) => {
  db.query('UPDATE counter SET count = count + 1 WHERE id = 1', () => {
    db.query('SELECT count FROM counter WHERE id = 1', (err, results) => {
      res.json({ count: results[0].count });
    });
  });
});

app.post('/decrement', (req, res) => {
  db.query('UPDATE counter SET count = count - 1 WHERE id = 1', () => {
    db.query('SELECT count FROM counter WHERE id = 1', (err, results) => {
      res.json({ count: results[0].count });
    });
  });
});

app.listen(5000, () => console.log('서버 실행됨'));

