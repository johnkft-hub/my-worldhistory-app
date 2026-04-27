-- 1. 데이터베이스 생성 (로컬에서 직접 작업 시)
-- CREATE DATABASE history_db;

-- 2. 사건 저장용 테이블 생성 (PostgreSQL 문법)
CREATE TABLE events (
    id SERIAL PRIMARY KEY, -- AUTO_INCREMENT 대신 SERIAL 사용
    year INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    region VARCHAR(50),
    description TEXT,
    importance INTEGER DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 초기 데이터 예시
INSERT INTO events (year, title, region, description, importance) 
VALUES (-3500, '수메르 문명 발생', 'Mesopotamia', '인류 최초의 문명 형성 및 쐐기 문자 발명', 5);