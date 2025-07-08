import { promises as fs } from 'fs'
import path from 'path'

const LOCATIONS_FILE = path.join(process.cwd(), 'public', 'locations.json')

// GET: 저장된 위치 데이터를 JSON 파일로 내보내기
export async function GET() {
  try {
    const data = await fs.readFile(LOCATIONS_FILE, 'utf8')
    const locations = JSON.parse(data)
    
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
    // 파일이 없거나 읽기 실패 시 빈 데이터 반환
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