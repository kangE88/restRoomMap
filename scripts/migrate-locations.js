const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// MongoDB 연결 설정 (직접 URI 사용)
const uri = 'mongodb+srv://kanglee:G25z8N2Ec4b2uHOD@cluster0.eovmtaw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
console.log('MongoDB URI 설정됨 ✅');

const client = new MongoClient(uri);

async function migrateLocations() {
  try {
    // MongoDB 연결
    await client.connect();
    console.log('MongoDB 연결 성공');

    const db = client.db('Cluster0');
    const collection = db.collection('locationData');

    // locations.json 파일 읽기
    const locationsPath = path.join(__dirname, '../public/locations.json');
    const locationsData = JSON.parse(fs.readFileSync(locationsPath, 'utf8'));

    // 기존 데이터 삭제 (선택적)
    await collection.deleteMany({});
    console.log('기존 locations 데이터 삭제 완료');

    // 새 데이터 삽입
    if (locationsData.locations && locationsData.locations.length > 0) {
      const result = await collection.insertMany(locationsData.locations);
      console.log(`${result.insertedCount}개의 location 데이터가 성공적으로 삽입되었습니다.`);
    } else {
      console.log('삽입할 데이터가 없습니다.');
    }

  } catch (error) {
    console.error('마이그레이션 중 오류 발생:', error);
  } finally {
    await client.close();
    console.log('MongoDB 연결 종료');
  }
}

// 스크립트 실행
migrateLocations();
