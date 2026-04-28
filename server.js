const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const PORT = process.env.PORT || 3000;

// ──────────────────────────────────────────────
// 🔴 수정 1: DATABASE_URL 없을 때 조기 종료 (production)
// ──────────────────────────────────────────────
if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
    console.error('❌ DATABASE_URL 환경변수가 설정되지 않았습니다. Render 환경변수를 확인하세요.');
    process.exit(1);
}

// ──────────────────────────────────────────────
// PostgreSQL 연결
// ──────────────────────────────────────────────
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL
        ? { rejectUnauthorized: false }
        : false
});

// ──────────────────────────────────────────────
// 서버 시작 시 테이블 자동 생성
// ──────────────────────────────────────────────
async function initDB() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS events (
                id          SERIAL PRIMARY KEY,
                year        INTEGER      NOT NULL,
                title       VARCHAR(255) NOT NULL,
                region      VARCHAR(50),
                description TEXT,
                importance  INTEGER DEFAULT 3,
                created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ events 테이블 준비 완료');
    } catch (err) {
        console.error('❌ 테이블 초기화 실패:', err.message);
    }
}

// ──────────────────────────────────────────────
// 루트 → HTML 서빙
// ──────────────────────────────────────────────
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'world_history_timeline.html'));
});

// ──────────────────────────────────────────────
// API
// ──────────────────────────────────────────────

// 전체 조회
app.get('/api/events', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM events ORDER BY year ASC');
        const mapped = result.rows.map(row => ({
            id:         row.id,
            year:       row.year,
            title:      row.title,
            region:     row.region,
            desc:       row.description,
            importance: row.importance
        }));
        res.json(mapped);
    } catch (err) {
        console.error('조회 에러:', err.message);
        res.status(500).json({ error: '데이터 조회 중 오류가 발생했습니다.' });
    }
});

// 추가
app.post('/api/events', async (req, res) => {
    const { year, title, region, desc, description, importance } = req.body;
    const finalDesc = desc || description || '';
    if (!year || !title) {
        return res.status(400).json({ error: '연도와 제목은 필수 항목입니다.' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO events (year, title, region, description, importance) VALUES ($1,$2,$3,$4,$5) RETURNING id',
            [year, title, region, finalDesc, importance]
        );
        res.json({ id: result.rows[0].id, year, title, region, desc: finalDesc, importance });
    } catch (err) {
        console.error('저장 에러:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// 수정
app.put('/api/events/:id', async (req, res) => {
    const { year, title, region, desc, description, importance } = req.body;
    const finalDesc = desc || description || '';
    if (!year || !title) {
        return res.status(400).json({ error: '연도와 제목은 필수 항목입니다.' });
    }
    try {
        const result = await pool.query(
            'UPDATE events SET year=$1, title=$2, region=$3, description=$4, importance=$5 WHERE id=$6',
            [year, title, region, finalDesc, importance, req.params.id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: '사건을 찾을 수 없습니다.' });
        }
        res.json({ success: true, year, title, region, desc: finalDesc, importance });
    } catch (err) {
        console.error('수정 에러:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// 삭제
app.delete('/api/events/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM events WHERE id=$1', [req.params.id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: '사건을 찾을 수 없습니다.' });
        }
        res.json({ success: true });
    } catch (err) {
        console.error('삭제 에러:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ──────────────────────────────────────────────
// 서버 시작
// ──────────────────────────────────────────────
initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
    });
});
