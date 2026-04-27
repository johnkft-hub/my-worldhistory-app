# 세계사 연대기 (World History Timeline)

## Render 배포 방법

### 1단계 — GitHub에 코드 올리기
```
git add .
git commit -m "PostgreSQL 마이그레이션"
git push origin main
```

### 2단계 — Render에서 PostgreSQL 생성
1. https://render.com 로그인
2. **New +** → **PostgreSQL** 클릭
3. Name: `history-db` 입력
4. Plan: **Free** 선택
5. **Create Database** 클릭
6. 생성 후 **Internal Database URL** 복사해두기

### 3단계 — Render에서 Web Service 생성
1. **New +** → **Web Service** 클릭
2. GitHub 저장소 연결 (`my-worldhistory-app`)
3. 아래 설정 입력:

| 항목 | 값 |
|------|-----|
| Name | `my-worldhistory-app` |
| Runtime | `Node` |
| Build Command | `npm install` |
| Start Command | `npm start` |

### 4단계 — 환경변수 설정 (핵심!)
Web Service → **Environment** 탭에서 추가:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | (2단계에서 복사한 Internal Database URL) |
| `NODE_ENV` | `production` |

### 5단계 — 배포 확인
- **Deploy** 클릭 후 로그에서 아래 메시지 확인:
  ```
  ✅ events 테이블 준비 완료
  🚀 서버 실행 중
  ```

---

## 로컬 실행 방법
```bash
npm install
# .env 파일 생성 후 아래 내용 추가:
# DATABASE_URL=postgresql://root:9090@localhost:5432/history_db
npm start
```

## 기술 스택
- Frontend: HTML / CSS / JavaScript (Vanilla)
- Backend: Node.js + Express
- Database: PostgreSQL (Render Free Tier)
- Hosting: Render
