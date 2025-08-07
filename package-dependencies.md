# MongoDB 관련 의존성

MongoDB를 사용하기 위해 다음 패키지가 필요할 수 있습니다:

```bash
# MongoDB 드라이버 (이미 설치되어 있을 수 있음)
npm install mongodb

# 또는 Mongoose 사용 시
npm install mongoose
```

## 환경 변수 설정

`.env.local` 파일에 다음을 추가하세요:

```
MONGODB_URI=mongodb://localhost:27017/restRoomMap
```

MongoDB Atlas 사용 시:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/restRoomMap?retryWrites=true&w=majority
```
