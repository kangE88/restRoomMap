import clientPromise from '@/lib/mongodb'

export async function GET() {
  try {
    console.log('🧪 MongoDB 연결 테스트 시작...')
    
    const client = await clientPromise
    console.log('✅ MongoDB 클라이언트 연결 성공')
    
    // 데이터베이스 목록 확인
    const adminDb = client.db().admin()
    const databases = await adminDb.listDatabases()
    console.log('📋 데이터베이스 목록:', databases.databases.map(db => db.name))
    
    // Cluster0 데이터베이스 연결
    const db = client.db('Cluster0')
    console.log('🔍 Cluster0 데이터베이스 연결 시도...')
    
    // 컬렉션 목록 확인
    const collections = await db.listCollections().toArray()
    console.log('📁 컬렉션 목록:', collections.map(col => col.name))
    
    // locationData 컬렉션이 존재하는지 확인
    const hasLocationData = collections.some(col => col.name === 'locationData')
    console.log('📍 locationData 컬렉션 존재:', hasLocationData ? '✅' : '❌')
    
    // 데이터 확인
    let locationCount = 0
    let sampleData = []
    
    if (hasLocationData) {
      locationCount = await db.collection('locationData').countDocuments()
      sampleData = await db.collection('locationData').find({}).limit(3).toArray()
      console.log('📊 데이터 개수:', locationCount)
      console.log('📝 샘플 데이터:', sampleData)
    } else {
      console.log('⚠️ locationData 컬렉션이 존재하지 않습니다.')
    }
    
    return new Response(JSON.stringify({
      success: true,
      connection: '✅ 연결 성공',
      databases: databases.databases.map(db => db.name),
      collections: collections.map(col => col.name),
      hasLocationData,
      locationCount,
      sampleData
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('❌ MongoDB 연결 테스트 실패:', error)
    
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
