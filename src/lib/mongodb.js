import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI
console.log('🔧 MongoDB URI:', uri ? '✅ 설정됨' : '❌ 설정되지 않음')
console.log('🔧 URI 내용:', uri)

if (!uri) {
  throw new Error('MongoDB URI가 환경변수에 설정되지 않았습니다. .env.local 파일을 확인해주세요.')
}

const options = {}

let client
let clientPromise

if (process.env.NODE_ENV === 'development') {
  // 개발 환경에서는 글로벌 변수를 사용하여 hot reload 시 연결이 끊어지지 않도록 함
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  // 프로덕션 환경에서는 새로운 클라이언트 생성
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export default clientPromise
