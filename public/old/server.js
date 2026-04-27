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

// MariaDB 연결 설정 (비밀번호: 9090)
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: '9090', 
    database: 'history_db'
});

// 루트 경로(/) 접속 시 HTML 파일 응답
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'world_history_timeline.html'));
});

// 2단계: DB와 테이블 자동 생성 후 본 연결
initConnection.connect((err) => {
    if (err) {
        console.error('MariaDB 초기 연결 실패:', err.message);
        process.exit(1);
    }
    console.log('MariaDB 초기 연결 성공');

    // DB 없으면 자동 생성
    initConnection.query('CREATE DATABASE IF NOT EXISTS history_db', (err) => {
        if (err) {
            console.error('DB 생성 실패:', err.message);
            process.exit(1);
        }
        console.log('history_db 준비 완료');

        initConnection.query('USE history_db', (err) => {
            if (err) { console.error(err); process.exit(1); }

            // 테이블 없으면 자동 생성
            const createTable = `
                CREATE TABLE IF NOT EXISTS events (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    year INT NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    region VARCHAR(50),
                    description TEXT,
                    importance INT DEFAULT 3,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `;
            initConnection.query(createTable, (err) => {
                if (err) {
                    console.error('테이블 생성 실패:', err.message);
                    process.exit(1);
                }
                console.log('events 테이블 준비 완료');
                initConnection.destroy();

                // 3단계: 정상 DB 연결로 교체 후 서버 시작
                startServer();
            });
        });
    });
});

// 실제 사용할 DB 연결
let db;

function startServer() {
    db = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '9090',
        database: 'history_db'
    });

    db.connect((err) => {
        if (err) {
            console.error('DB 연결 실패:', err.message);
            process.exit(1);
        }
        console.log('history_db 연결 성공');

        app.listen(3000, () => {
            console.log('서버 실행 중: http://localhost:3000');
        });
    });
}

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

app.listen(3000, () => console.log('Server running on port 3000. Access at http://localhost:3000'));