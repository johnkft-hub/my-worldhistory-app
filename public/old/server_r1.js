const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());

// 정적 파일 서빙 설정 (절대 경로 사용)
app.use(express.static(path.join(__dirname))); 

// 환경 변수(PORT) 설정
const PORT = process.env.PORT || 3000;

/**
 * DB 연결 설정
 * 배포 환경(DATABASE_URL)과 로컬 환경 설정을 통합합니다.
 */
const dbConfig = process.env.DATABASE_URL || {
    host: 'localhost',
    user: 'root', 
    password: '9090', 
    database: 'history_db'
};

const db = mysql.createConnection(dbConfig);

// DB 연결 시도 및 에러 핸들링
db.connect((err) => {
    if (err) {
        console.error('데이터베이스 연결 실패:', err.message);
        // 배포 환경에서는 서버가 죽지 않도록 에러만 출력하고 종료하지 않을 수 있습니다.
    } else {
        console.log('데이터베이스 연결 성공!');
    }
});

// 루트 경로(/) 접속 시 HTML 파일 응답
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'world_history_timeline.html'));
});

// 모든 사건 조회 API
app.get('/api/events', (req, res) => {
    const query = 'SELECT * FROM events ORDER BY year ASC';
    db.query(query, (err, results) => {
        if (err) {
            console.error('조회 에러:', err);
            return res.status(500).json({ error: '데이터 조회 중 오류가 발생했습니다.' });
        }
        
        // 클라이언트(HTML)에서 사용하는 'desc' 필드로 맵핑
        const mappedResults = results.map(row => ({
            id: row.id,
            year: row.year,
            title: row.title,
            region: row.region,
            desc: row.description, // DB의 description -> 클라이언트의 desc
            importance: row.importance
        }));
        res.json(mappedResults);
    });
});

// 새 사건 추가 API
app.post('/api/events', (req, res) => {
    const { year, title, region, desc, importance } = req.body;
    
    if (!year || !title) {
        return res.status(400).json({ error: '연도와 제목은 필수 항목입니다.' });
    }

    const query = 'INSERT INTO events (year, title, region, description, importance) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [year, title, region, desc, importance], (err, result) => {
        if (err) {
            console.error('저장 에러:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: result.insertId, ...req.body });
    });
});

// 사건 수정 API (PUT)
app.put('/api/events/:id', (req, res) => {
    const { year, title, region, desc, importance } = req.body;
    const query = 'UPDATE events SET year=?, title=?, region=?, description=?, importance=? WHERE id=?';
    
    db.query(query, [year, title, region, desc, importance, req.params.id], (err, result) => {
        if (err) {
            console.error('수정 에러:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true });
    });
});

// 사건 삭제 API (DELETE)
app.delete('/api/events/:id', (req, res) => {
    const query = 'DELETE FROM events WHERE id = ?';
    db.query(query, [req.params.id], (err, result) => {
        if (err) {
            console.error('삭제 에러:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true });
    });
});

app.listen(PORT, () => {
    console.log(`서버가 가동되었습니다. 접속 주소: http://localhost:${PORT}`);
});