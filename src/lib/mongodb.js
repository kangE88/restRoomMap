import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI

// 빌드 시점에서는 MongoDB URI 검증을 하지 않음
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'development') {
  // 서버 사이드이고 개발환경이 아닐 때만 로그 출력
  if (uri) {
    console.log('🔧 MongoDB URI: ✅ 설정됨')
  } else {
    console.warn('⚠️ MongoDB URI가 설정되지 않았습니다.')
  }
} else if (process.env.NODE_ENV === 'development') {
  console.log('🔧 MongoDB URI:', uri ? '✅ 설정됨' : '❌ 설정되지 않음')
  console.log('🔧 URI 내용:', uri)
}

// 런타임에서만 URI 체크
if (!uri && typeof window === 'undefined') {
  // 빌드 시점이 아닌 경우에만 오류 발생
  if (process.env.NODE_ENV !== 'development' && process.env.VERCEL_ENV !== 'preview') {
    console.error('MongoDB URI가 환경변수에 설정되지 않았습니다.')
  }
}

const options = {}

let client
let clientPromise

// MongoDB 클라이언트 초기화 함수
function initMongoDB() {
  if (!uri) {
    throw new Error('MONGODB_URI 환경변수가 설정되지 않았습니다.')
  }
  
  if (process.env.NODE_ENV === 'development') {
    // 개발 환경에서는 글로벌 변수를 사용하여 hot reload 시 연결이 끊어지지 않도록 함
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options)
      global._mongoClientPromise = client.connect()
    }
    return global._mongoClientPromise
  } else {
    // 프로덕션 환경에서는 새로운 클라이언트 생성
    if (!clientPromise) {
      client = new MongoClient(uri, options)
      clientPromise = client.connect()
    }
    return clientPromise
  }
}

// 지연 초기화
export default function getClientPromise() {
  if (!clientPromise && uri) {
    clientPromise = initMongoDB()
  }
  return clientPromise
}
