  export async function POST(req) {
    const body = await req.json()
  
    const allowedEmails = ['cerisetal@naver.com', 'sblee90@gmail.com']
  
    if (allowedEmails.includes(body.email)) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    } else {
      return new Response(JSON.stringify({ success: false, message: '허용되지 않은 이메일입니다.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }
  