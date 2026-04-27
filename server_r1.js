const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path'); // 경로 처리를 위한 모듈 추가
const app = express();

app.use(cors());
app.use(express.json());

// 현재 폴더 자체를 정적 파일 폴더로 지정하거나, 
// 파일이 있는 정확한 위치를 지정해야 합니다.
app.use(express.static(__dirname)); 

// 환경 변수(PORT)가 있으면 사용하고, 없으면 3000번 사용 (배포용)
const PORT = process.env.PORT || 3000;

// 배포 환경을 고려한 MariaDB 연결 설정
// 환경 변수(DATABASE_URL 등)가 있으면 그것을 사용하도록 설정합니다.
const db = mysql.createConnection(process.env.DATABASE_URL || {
    host: 'localhost',
    user: 'root', 
    password: '9090', 
    database: 'history_db'
});

// 루트 경로(/) 접속 시 HTML 파일 응답
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'world_history_timeline.html'));
});

// 모든 사건 조회 API
app.get('/api/events', (req, res) => {
    db.query('SELECT * FROM events ORDER BY year ASC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        // 클라이언트가 'desc' 필드를 기대하므로 맵핑 처리
        const mappedResults = results.map(row => ({
            id: row.id,
            year: row.year,
            title: row.title,
            region: row.region,
            desc: row.description, // DB의 description을 클라이언트의 desc로 전달
            importance: row.importance
        }));
        res.json(mappedResults);
    });
});

// 새 사건 추가 API
app.post('/api/events', (req, res) => {
    const { year, title, region, desc, importance } = req.body;
    // DB 컬럼명은 description임을 주의
    const query = 'INSERT INTO events (year, title, region, description, importance) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [year, title, region, desc, importance], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: result.insertId, ...req.body });
    });
});

// 사건 수정 API (PUT) 추가
app.put('/api/events/:id', (req, res) => {
    const { year, title, region, desc, importance } = req.body;
    const query = 'UPDATE events SET year=?, title=?, region=?, description=?, importance=? WHERE id=?';
    db.query(query, [year, title, region, desc, importance, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// 사건 삭제 API (DELETE) 추가
app.delete('/api/events/:id', (req, res) => {
    db.query('DELETE FROM events WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));