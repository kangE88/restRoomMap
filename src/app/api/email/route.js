import clientPromise from '@/lib/mongodb'
import nodemailer from 'nodemailer'

// POST: MongoDB에서 데이터를 조회하여 이메일로 전송
export async function POST(req) {
  try {
    const body = await req.json()
    const { email } = body

    if (!email) {
      return new Response(JSON.stringify({ success: false, message: '이메일 주소가 필요합니다.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // MongoDB에서 위치 데이터 읽기
    let locations = { locations: [] }
    try {
      const client = await clientPromise
      const db = client.db('Cluster0')
      const locationsData = await db.collection('locationData').find({}).toArray()
      console.log("🚀 ~ POST ~ locationsData:", locationsData)
      locations = { locations: locationsData }
    } catch (error) {
      console.error('MongoDB 조회 실패:', error)
      // MongoDB 조회가 실패하면 빈 배열로 시작
    }

    // 이메일 전송기 설정
    const transporter = nodemailer.createTransporter({
      service: 'gmail', // Gmail 사용 (다른 서비스도 가능)
      auth: {
        user: process.env.EMAIL_USER, // Gmail 계정
        pass: process.env.EMAIL_PASS  // Gmail 앱 비밀번호
      }
    })

    // 현재 날짜와 시간으로 파일명 생성
    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-')
    const filename = `locations_${timestamp}.json`

    // 이메일 옵션
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `📍 위치 데이터 내보내기 - ${now.toLocaleDateString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">📍 위치 데이터 내보내기</h2>
          <p>안녕하세요!</p>
          <p>요청하신 위치 데이터를 첨부파일로 보내드립니다.</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #007bff;">📊 데이터 요약</h3>
            <p><strong>총 위치 개수:</strong> ${locations.locations.length}개</p>
            <p><strong>내보내기 시간:</strong> ${now.toLocaleString()}</p>
          </div>
          <p>첨부된 JSON 파일에는 다음 정보가 포함되어 있습니다:</p>
          <ul>
            <li>위치 좌표 (위도, 경도)</li>
            <li>메모 내용</li>
            <li>저장 시간</li>
          </ul>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            이 메일은 RestRoomMap 애플리케이션에서 자동으로 발송되었습니다.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: filename,
          content: JSON.stringify(locations, null, 2),
          contentType: 'application/json'
        }
      ]
    }

    // 이메일 전송
    await transporter.sendMail(mailOptions)

    return new Response(JSON.stringify({ 
      success: true, 
      message: '이메일이 성공적으로 전송되었습니다.' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('이메일 전송 실패:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      message: '이메일 전송 중 오류가 발생했습니다.' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
} 