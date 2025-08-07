import clientPromise from '@/lib/mongodb'

// GET: 저장된 위치 데이터를 JSON 파일로 내보내기
export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('Cluster0')
    const locationsData = await db.collection('locationData').find({}).toArray()
    
    const locations = { locations: locationsData }
    
    // 현재 날짜와 시간으로 파일명 생성
    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-')
    const filename = `locations_${timestamp}.json`
    
    return new Response(JSON.stringify(locations, null, 2), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`
      },
    })
  } catch (error) {
    console.error('Export 실패:', error)
    // MongoDB 조회 실패 시 빈 데이터 반환
    const emptyData = { locations: [] }
    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-')
    const filename = `locations_${timestamp}.json`
    
    return new Response(JSON.stringify(emptyData, null, 2), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`
      },
    })
  }
} 