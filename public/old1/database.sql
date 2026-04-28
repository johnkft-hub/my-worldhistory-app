-- Render PostgreSQL용 스키마
-- Render 대시보드 → PostgreSQL → PSQL Command 에서 실행하거나
-- server.js 시작 시 자동으로 테이블이 생성됩니다 (initDB 함수)

CREATE TABLE IF NOT EXISTS events (
    id          SERIAL PRIMARY KEY,
    year        INTEGER      NOT NULL,
    title       VARCHAR(255) NOT NULL,
    region      VARCHAR(50),
    description TEXT,
    importance  INTEGER DEFAULT 3,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
