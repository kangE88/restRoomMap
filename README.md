# RestRoomMap - 화장실 위치 저장 앱

이메일 인증 후 카카오맵에서 위치를 선택하고 메모와 함께 저장할 수 있는 웹 애플리케이션입니다.

## 주요 기능

- 이메일 인증 시스템
- 카카오맵을 통한 위치 선택
- 임시 저장 및 영구 저장 시스템
- 위치별 메모 저장
- 저장된 위치 목록 관리
- 위치로 이동 및 삭제 기능
- JSON 파일로 위치 데이터 내보내기
- 이메일로 위치 데이터 전송

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## 사용 방법

1. **이메일 인증**: 이메일 주소를 입력하고 인증 요청 버튼을 클릭합니다.
2. **위치 선택**: 지도에서 원하는 위치를 클릭하여 선택합니다.
3. **메모 입력**: 선택한 위치에 대한 메모를 입력하고 저장합니다.
4. **위치 관리**: 저장된 위치 목록에서 위치를 확인, 이동, 삭제할 수 있습니다.
5. **데이터 내보내기**: 
   - "JSON 내보내기" 버튼을 클릭하여 모든 위치 데이터를 JSON 파일로 다운로드할 수 있습니다.
   - "이메일로 보내기" 버튼을 클릭하여 위치 데이터를 이메일로 전송할 수 있습니다.

## 데이터 저장

위치 데이터는 `public/locations.json` 파일에 저장됩니다. 이 파일은 다음과 같은 구조를 가집니다:

## 이메일 설정

이메일 전송 기능을 사용하려면 환경 변수를 설정해야 합니다:

1. **Gmail 계정 설정**:
   - Gmail 계정에서 2단계 인증 활성화
   - 앱 비밀번호 생성 (Google 계정 > 보안 > 앱 비밀번호)

2. **환경 변수 설정**:
   프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가:
   ```env
   EMAIL_USER=your-gmail@gmail.com
   EMAIL_PASS=your-app-password
   ```

3. **배포 시 설정**:
   - Netlify: Site settings > Environment variables에서 설정
   - Vercel: Project settings > Environment variables에서 설정

```json
{
  "locations": [
    {
      "id": 1703123456789,
      "lat": 37.564533,
      "lng": 127.189967,
      "memo": "화장실 위치",
      "timestamp": "2023-12-21 15:30:45"
    }
  ]
}
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
