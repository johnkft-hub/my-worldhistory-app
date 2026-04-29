const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const PORT = process.env.PORT || 3000;

if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
    console.error('❌ DATABASE_URL 환경변수가 설정되지 않았습니다.');
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

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
        await pool.query(`
            CREATE TABLE IF NOT EXISTS regions (
                id         SERIAL PRIMARY KEY,
                name       VARCHAR(50) NOT NULL UNIQUE,
                color      VARCHAR(20) DEFAULT '#7BA3FF',
                sort_order INTEGER DEFAULT 99,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await pool.query(`
            INSERT INTO regions (name, color, sort_order) VALUES
                ('아시아',   '#C9A84C', 1),
                ('유럽',     '#7BA3FF', 2),
                ('아프리카', '#5DCAA5', 3),
                ('아메리카', '#F0997B', 4),
                ('중동',     '#AFA9EC', 5),
                ('전세계',   '#73c991', 6)
            ON CONFLICT (name) DO NOTHING
        `);
        console.log('✅ DB 테이블 준비 완료');
    } catch (err) {
        console.error('❌ 테이블 초기화 실패:', err.message);
    }
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'world_history_timeline.html'));
});

// 지역 전체 조회
app.get('/api/regions', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM regions ORDER BY sort_order ASC, id ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 지역 추가
app.post('/api/regions', async (req, res) => {
    const { name, color } = req.body;
    if (!name) return res.status(400).json({ error: '지역명은 필수입니다.' });
    try {
        const result = await pool.query(
            'INSERT INTO regions (name, color) VALUES ($1, $2) RETURNING *',
            [name.trim(), color || '#7BA3FF']
        );
        res.json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') return res.status(400).json({ error: '이미 존재하는 지역명입니다.' });
        res.status(500).json({ error: err.message });
    }
});

// 지역 삭제
app.delete('/api/regions/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM regions WHERE id=$1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 이벤트 전체 조회
app.get('/api/events', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM events ORDER BY year ASC');
        const mapped = result.rows.map(row => ({
            id: row.id, year: row.year, title: row.title,
            region: row.region, desc: row.description, importance: row.importance
        }));
        res.json(mapped);
    } catch (err) {
        res.status(500).json({ error: '데이터 조회 중 오류가 발생했습니다.' });
    }
});

// 이벤트 추가
app.post('/api/events', async (req, res) => {
    const { year, title, region, desc, description, importance } = req.body;
    const finalDesc = desc || description || '';
    if (!year || !title) return res.status(400).json({ error: '연도와 제목은 필수 항목입니다.' });
    try {
        const result = await pool.query(
            'INSERT INTO events (year, title, region, description, importance) VALUES ($1,$2,$3,$4,$5) RETURNING id',
            [year, title, region, finalDesc, importance]
        );
        res.json({ id: result.rows[0].id, year, title, region, desc: finalDesc, importance });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 이벤트 수정
app.put('/api/events/:id', async (req, res) => {
    const { year, title, region, desc, description, importance } = req.body;
    const finalDesc = desc || description || '';
    if (!year || !title) return res.status(400).json({ error: '연도와 제목은 필수 항목입니다.' });
    try {
        const result = await pool.query(
            'UPDATE events SET year=$1, title=$2, region=$3, description=$4, importance=$5 WHERE id=$6',
            [year, title, region, finalDesc, importance, req.params.id]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: '사건을 찾을 수 없습니다.' });
        res.json({ success: true, year, title, region, desc: finalDesc, importance });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 일별 업데이트 통계
app.get('/api/stats/daily', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                DATE(created_at AT TIME ZONE 'Asia/Seoul') AS day,
                COUNT(*)::int AS count
            FROM events
            GROUP BY DATE(created_at AT TIME ZONE 'Asia/Seoul')
            ORDER BY day DESC
            LIMIT 30
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 이벤트 삭제
app.delete('/api/events/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM events WHERE id=$1', [req.params.id]);
        if (result.rowCount === 0) return res.status(404).json({ error: '사건을 찾을 수 없습니다.' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

initDB().then(() => {
    app.listen(PORT, () => console.log(`🚀 서버 실행 중: http://localhost:${PORT}`));
});
