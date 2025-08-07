import getClientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// GET - 모든 locations 가져오기
export async function GET() {
  try {
    console.log('🔄 MongoDB 연결 시도...')
    const client = await getClientPromise()
    console.log('✅ MongoDB 클라이언트 연결 성공')
    
    const db = client.db('Cluster0')
    console.log('🔍 데이터베이스 선택: Cluster0')
    
    const locations = await db.collection('locationData').find({}).toArray()
    console.log('📊 조회된 데이터:', locations)
    
    return new Response(JSON.stringify({ locations }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('❌ Locations 조회 실패:', error)
    console.error('Error details:', error.message)
    console.error('Error stack:', error.stack)
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch locations',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// POST - 새로운 location 추가
export async function POST(req) {
  try {
    console.log('🔄 POST /api/locations 요청 시작...')
    
    const body = await req.json()
    console.log('📝 요청 body:', body)
    
    const { lat, lng, memo } = body
    
    if (!lat || !lng) {
      console.log('❌ 필수 필드 누락:', { lat, lng })
      return new Response(JSON.stringify({ error: '위도와 경도는 필수입니다.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    console.log('🔄 MongoDB 연결 시도...')
    const client = await getClientPromise()
    console.log('✅ MongoDB 클라이언트 연결 성공')
    
    const db = client.db('Cluster0')
    console.log('✅ 데이터베이스 선택 완료')
    
    const newLocation = {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      memo: memo || '',
      timestamp: new Date().toLocaleString('ko-KR')
    }
    console.log('📊 삽입할 데이터:', newLocation)
    
    console.log('🔄 데이터 삽입 시도...')
    const result = await db.collection('locationData').insertOne(newLocation)
    console.log('✅ 삽입 결과:', result)
    
    return new Response(JSON.stringify({ 
      success: true, 
      location: { ...newLocation, _id: result.insertedId }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('❌ Location 추가 실패:', error)
    console.error('❌ Error name:', error.name)
    console.error('❌ Error message:', error.message)
    console.error('❌ Error stack:', error.stack)
    
    // MongoDB 권한 관련 오류 확인
    if (error.message.includes('not authorized') || error.message.includes('authentication')) {
      console.error('🔐 MongoDB 인증/권한 오류 - 사용자 권한을 확인하세요')
    }
    
    return new Response(JSON.stringify({ 
      error: 'Failed to add location',
      details: error.message,
      errorType: error.name 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// DELETE - location 삭제
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    
    console.log('🗑️ DELETE 요청 - ID:', id)
    
    if (!id || id === 'undefined' || id === 'null') {
      console.log('❌ 잘못된 ID:', id)
      return new Response(JSON.stringify({ error: 'ID가 필요합니다.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    const client = await getClientPromise()
    const db = client.db('Cluster0')
    
    // ObjectId 형식인지 확인
    let deleteQuery
    if (ObjectId.isValid(id)) {
      deleteQuery = { _id: new ObjectId(id) }
      console.log('🔍 ObjectId로 삭제 시도:', id)
    } else {
      deleteQuery = { id: parseInt(id) }
      console.log('🔍 숫자 ID로 삭제 시도:', id)
    }
    
    const result = await db.collection('locationData').deleteOne(deleteQuery)
    console.log('🗑️ 삭제 결과:', result)
    
    if (result.deletedCount === 0) {
      return new Response(JSON.stringify({ error: 'Location을 찾을 수 없습니다.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Location 삭제 실패:', error)
    return new Response(JSON.stringify({ error: 'Failed to delete location' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}