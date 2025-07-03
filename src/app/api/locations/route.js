import { promises as fs } from 'fs'
import path from 'path'

const LOCATIONS_FILE = path.join(process.cwd(), 'public', 'locations.json')

// GET: 저장된 위치 목록 불러오기
export async function GET() {
  try {
    const data = await fs.readFile(LOCATIONS_FILE, 'utf8')
    const locations = JSON.parse(data)
    return new Response(JSON.stringify(locations), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    // 파일이 없거나 읽기 실패 시 빈 배열 반환
    return new Response(JSON.stringify({ locations: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// POST: 새로운 위치 저장
export async function POST(req) {
  try {
    const body = await req.json()
    const { lat, lng, memo } = body

    if (!lat || !lng || !memo) {
      return new Response(JSON.stringify({ success: false, message: '위도, 경도, 메모가 필요합니다.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 기존 데이터 읽기
    let locations = { locations: [] }
    try {
      const data = await fs.readFile(LOCATIONS_FILE, 'utf8')
      locations = JSON.parse(data)
    } catch (error) {
      // 파일이 없으면 빈 배열로 시작
    }

    // 새로운 위치 추가
    const newLocation = {
      id: Date.now(),
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      memo: memo.trim(),
      timestamp: new Date().toLocaleString()
    }

    locations.locations.push(newLocation)

    // 파일에 저장
    await fs.writeFile(LOCATIONS_FILE, JSON.stringify(locations, null, 2), 'utf8')

    return new Response(JSON.stringify({ success: true, location: newLocation }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: '저장 중 오류가 발생했습니다.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// DELETE: 위치 삭제
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return new Response(JSON.stringify({ success: false, message: '삭제할 위치 ID가 필요합니다.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 기존 데이터 읽기
    const data = await fs.readFile(LOCATIONS_FILE, 'utf8')
    const locations = JSON.parse(data)

    // 해당 ID의 위치 제거
    const filteredLocations = locations.locations.filter(location => location.id !== parseInt(id))
    locations.locations = filteredLocations

    // 파일에 저장
    await fs.writeFile(LOCATIONS_FILE, JSON.stringify(locations, null, 2), 'utf8')

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: '삭제 중 오류가 발생했습니다.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
} 