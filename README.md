# teampj3-fe

GTest 케이스 생성 리포트를 확인하기 위한 최소 프론트엔드입니다.

## 실행

```bash
npm install
npm run dev
```

백엔드 주소는 `.env`에 설정합니다.

```bash
VITE_API_BASE_URL=http://localhost:8080
```

## API 연동

- `POST /api/reports/generate`: 피처 파일 업로드
- `GET /api/reports`: 리포트 목록 조회
