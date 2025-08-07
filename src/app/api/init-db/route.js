import getClientPromise from '@/lib/mongodb'

export async function POST() {
  try {
    console.log('🚀 데이터베이스 초기화 시작...')
    
    const client = await getClientPromise()
    const db = client.db('Cluster0')
    
    // locationData 컬렉션 생성 (데이터를 삽입하면 자동으로 생성됨)
    const collection = db.collection('locationData')
    
    // 테스트 데이터 삽입
    const testData = {
      lat: 37.564533,
      lng: 127.189967,
      memo: '테스트 위치',
      timestamp: new Date().toLocaleString('ko-KR')
    }
    
    const result = await collection.insertOne(testData)
    console.log('✅ 테스트 데이터 삽입 성공:', result.insertedId)
    
    // 데이터 확인
    const count = await collection.countDocuments()
    const allData = await collection.find({}).toArray()
    
    return new Response(JSON.stringify({
      success: true,
      message: '데이터베이스 초기화 완료',
      insertedId: result.insertedId,
      totalCount: count,
      allData
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 실패:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
