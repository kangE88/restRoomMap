'use client'

import { useEffect, useState } from 'react'

export default function Home() {
  const [email, setEmail] = useState('')
  const [authed, setAuthed] = useState(false)
  const [message, setMessage] = useState('')
  const [mapLoaded, setMapLoaded] = useState(false)
  const [clickedPosition, setClickedPosition] = useState(null)

  const handleAuth = async () => {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    const data = await res.json()

    if (res.ok && data.success) {
      setAuthed(true)
      setMessage('✅ 인증되었습니다.')
    } else {
      setMessage(data.message || '❌ 인증 실패')
    }
  }

  useEffect(() => {
    if (authed && !mapLoaded) {
      const script = document.createElement('script')
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=a43ad32d2234424204bab98bacbde15f&autoload=false`
      script.async = true

      script.onload = () => {
        window.kakao.maps.load(() => {
          const container = document.getElementById('map')
          const options = {
            center: new window.kakao.maps.LatLng(37.564533, 127.189967),
            level: 3,
          }
          // 위도: 37.564533
          // 경도: 127.189967
          const map = new window.kakao.maps.Map(container, options)

          const markerPosition = new window.kakao.maps.LatLng(37.564533, 127.189967)
          const marker = new window.kakao.maps.Marker({
            map,
            position: markerPosition
          })

          const iwContent = '<div style="padding:5px; width:150px; text-align:center;">여기가 위치입니다!</div>'
          const infowindow = new window.kakao.maps.InfoWindow({
            content: iwContent,
            removable: true
          })

          window.kakao.maps.event.addListener(marker, 'click', function() {
            infowindow.open(map, marker)
          })

          infowindow.open(map, marker)

          window.kakao.maps.event.addListener(map, 'click', function(mouseEvent) {
            const latlng = mouseEvent.latLng
            
            setClickedPosition({
              lat: latlng.getLat(),
              lng: latlng.getLng()
            })
            
            marker.setPosition(latlng)
            
            infowindow.setContent(`<div style="padding:5px; width:180px; text-align:center;">
              위도: ${latlng.getLat().toFixed(6)}<br>
              경도: ${latlng.getLng().toFixed(6)}
            </div>`)
            infowindow.open(map, marker)
          })

          setMapLoaded(true)
        })
      }

      document.head.appendChild(script)

      return () => {
        if (script.parentNode) {
          document.head.removeChild(script)
        }
      }
    }
  }, [authed, mapLoaded])

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial' }}>
      <h1>📍 이메일 인증 후 지도 보기</h1>

      {!authed ? (
        <>
          <input
            type="email"
            value={email}
            placeholder="이메일 입력"
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: '8px', width: '300px' }}
          />
          <button onClick={handleAuth} style={{ marginLeft: '10px' }}>
            인증 요청
          </button>
          <p>{message}</p>
        </>
      ) : (
        <>
          <p style={{ color: 'green' }}>{message}</p>
          <div
            id="map"
            style={{
              width: '100%',
              height: '400px',
              marginTop: '20px',
              border: '2px solid #0066CC',
              borderRadius: '8px',
            }}
          ></div>
          
          {clickedPosition && (
            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
              <h3>클릭한 위치의 좌표:</h3>
              <p>위도: {clickedPosition.lat.toFixed(6)}</p>
              <p>경도: {clickedPosition.lng.toFixed(6)}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
