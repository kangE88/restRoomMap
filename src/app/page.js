'use client'

import { useEffect, useState } from 'react'

export default function Home() {
  const [email, setEmail] = useState('')
  const [authed, setAuthed] = useState(false)
  const [message, setMessage] = useState('')
  const [mapLoaded, setMapLoaded] = useState(false)
  const [clickedPosition, setClickedPosition] = useState(null)
  const [memo, setMemo] = useState('')
  const [savedLocations, setSavedLocations] = useState([])
  const [map, setMap] = useState(null)
  const [markers, setMarkers] = useState([])

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
      
      // 저장된 위치 목록 불러오기
      loadSavedLocations()
    } else {
      setMessage(data.message || '❌ 인증 실패')
    }
  }

  const loadSavedLocations = async () => {
    try {
      const res = await fetch('/api/locations')
      const data = await res.json()

      if (res.ok && data.locations) {
        setSavedLocations(data.locations)
      }
    } catch (error) {
      console.error('저장된 위치를 불러오는 중 오류가 발생했습니다:', error)
    }
  }

  const saveLocation = async () => {
    if (!clickedPosition || !memo.trim()) {
      alert('위치를 선택하고 메모를 입력해주세요.')
      return
    }

    try {
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: clickedPosition.lat,
          lng: clickedPosition.lng,
          memo: memo.trim()
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        const newLocation = data.location
        setSavedLocations(prev => [...prev, newLocation])
        setMemo('')
        
        // 지도에 마커 추가
        if (map && window.kakao) {
          const markerPosition = new window.kakao.maps.LatLng(newLocation.lat, newLocation.lng)
          const marker = new window.kakao.maps.Marker({
            map: map,
            position: markerPosition
          })

          const iwContent = `<div style="padding:5px; width:200px; text-align:center;">
            <strong>${newLocation.memo}</strong><br>
            위도: ${newLocation.lat.toFixed(6)}<br>
            경도: ${newLocation.lng.toFixed(6)}<br>
            저장시간: ${newLocation.timestamp}
          </div>`
          
          const infowindow = new window.kakao.maps.InfoWindow({
            content: iwContent,
            removable: true
          })

          window.kakao.maps.event.addListener(marker, 'click', function() {
            infowindow.open(map, marker)
          })

          setMarkers(prev => [...prev, { marker, infowindow, id: newLocation.id }])
        }

        alert('위치가 저장되었습니다!')
      } else {
        alert(data.message || '저장에 실패했습니다.')
      }
    } catch (error) {
      alert('저장 중 오류가 발생했습니다.')
    }
  }

  const deleteLocation = async (id) => {
    try {
      const res = await fetch(`/api/locations?id=${id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setSavedLocations(prev => prev.filter(location => location.id !== id))
        
        // 지도에서 마커 제거
        const markerToRemove = markers.find(m => m.id === id)
        if (markerToRemove) {
          markerToRemove.marker.setMap(null)
          setMarkers(prev => prev.filter(m => m.id !== id))
        }
      } else {
        alert(data.message || '삭제에 실패했습니다.')
      }
    } catch (error) {
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const moveToLocation = (location) => {
    if (map && window.kakao) {
      const position = new window.kakao.maps.LatLng(location.lat, location.lng)
      
      // 지도 중심을 해당 위치로 이동
      map.setCenter(position)
      map.setLevel(3)
      
      // 해당 위치에 임시 마커 표시 (강조 표시)
      const tempMarker = new window.kakao.maps.Marker({
        map: map,
        position: position,
        zIndex: 1000 // 다른 마커보다 위에 표시
      })
      
      // 임시 마커용 정보창
      const tempInfoWindow = new window.kakao.maps.InfoWindow({
        content: `<div style="padding:5px; width:200px; text-align:center; background-color: #fff3cd; border: 2px solid #ffc107; color: #000000;">
          <strong style="color: #000000;">📍 현재 위치</strong><br>
          <strong style="color: #000000;">${location.memo}</strong><br>
          <span style="color: #000000;">위도: ${location.lat.toFixed(6)}</span><br>
          <span style="color: #000000;">경도: ${location.lng.toFixed(6)}</span><br>
          <span style="color: #000000;">저장시간: ${location.timestamp}</span>
        </div>`,
        removable: true
      })
      
      // 임시 마커 클릭 시 정보창 표시
      window.kakao.maps.event.addListener(tempMarker, 'click', function() {
        tempInfoWindow.open(map, tempMarker)
      })
      
      // 정보창 자동으로 열기
      tempInfoWindow.open(map, tempMarker)
      
      // 3초 후 임시 마커 제거
      setTimeout(() => {
        tempMarker.setMap(null)
        tempInfoWindow.close()
      }, 3000)
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
          const mapInstance = new window.kakao.maps.Map(container, options)
          setMap(mapInstance)

          const markerPosition = new window.kakao.maps.LatLng(37.564533, 127.189967)
          const marker = new window.kakao.maps.Marker({
            map: mapInstance,
            position: markerPosition
          })

          const iwContent = '<div style="padding:5px; width:150px; text-align:center;">여기가 위치입니다!</div>'
          const infowindow = new window.kakao.maps.InfoWindow({
            content: iwContent,
            removable: true
          })

          window.kakao.maps.event.addListener(marker, 'click', function() {
            infowindow.open(mapInstance, marker)
          })

          infowindow.open(mapInstance, marker)

          window.kakao.maps.event.addListener(mapInstance, 'click', function(mouseEvent) {
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
            infowindow.open(mapInstance, marker)
          })

          setMapLoaded(true)
          
          // 저장된 위치들의 마커 표시
          if (savedLocations.length > 0) {
            displaySavedMarkers(mapInstance)
          }
        })
      }

      document.head.appendChild(script)

      return () => {
        if (script.parentNode) {
          document.head.removeChild(script)
        }
      }
    }
  }, [authed, mapLoaded, savedLocations])

  const displaySavedMarkers = (mapInstance) => {
    if (!mapInstance || !window.kakao) return

    // 기존 마커들 제거
    markers.forEach(markerObj => {
      markerObj.marker.setMap(null)
    })
    setMarkers([])

    // 저장된 위치들의 마커 생성
    const newMarkers = []
    savedLocations.forEach(location => {
      const markerPosition = new window.kakao.maps.LatLng(location.lat, location.lng)
      const marker = new window.kakao.maps.Marker({
        map: mapInstance,
        position: markerPosition
      })

      const iwContent = `<div style="padding:5px; width:200px; text-align:center;">
        <strong>${location.memo}</strong><br>
        위도: ${location.lat.toFixed(6)}<br>
        경도: ${location.lng.toFixed(6)}<br>
        저장시간: ${location.timestamp}
      </div>`
      
      const infowindow = new window.kakao.maps.InfoWindow({
        content: iwContent,
        removable: true
      })

      window.kakao.maps.event.addListener(marker, 'click', function() {
        infowindow.open(mapInstance, marker)
      })

      newMarkers.push({ marker, infowindow, id: location.id })
    })

    setMarkers(newMarkers)
  }

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
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAuth()
              }
            }}
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
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
              <h3 style={{ color: '#000000', margin: '0 0 10px 0' }}>📍 선택한 위치 저장</h3>
              <p style={{ color: '#000000', margin: '5px 0' }}><strong>위도:</strong> {clickedPosition.lat.toFixed(6)}</p>
              <p style={{ color: '#000000', margin: '5px 0' }}><strong>경도:</strong> {clickedPosition.lng.toFixed(6)}</p>
              
              <div style={{ marginTop: '10px' }}>
                <input
                  type="text"
                  value={memo}
                  placeholder="이 위치에 대한 메모를 입력하세요"
                  onChange={(e) => setMemo(e.target.value)}
                  style={{ 
                    padding: '8px', 
                    width: '300px', 
                    marginRight: '10px',
                    border: '1px solid #000000',
                    borderRadius: '4px',
                    color: '#000000'
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      saveLocation()
                    }
                  }}
                />
                <button 
                  onClick={saveLocation}
                  style={{ 
                    padding: '8px 16px',
                    backgroundColor: '#000000',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  저장
                </button>
              </div>
            </div>
          )}

          {savedLocations.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h3>💾 저장된 위치 목록</h3>
              <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '8px' }}>
                {savedLocations.map((location) => (
                  <div 
                    key={location.id} 
                    style={{ 
                      padding: '15px', 
                      borderBottom: '1px solid #dee2e6',
                      backgroundColor: 'white'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: '0 0 5px 0', color: '#007bff' }}>{location.memo}</h4>
                        <p style={{ margin: '2px 0', fontSize: '12px', color: '#6c757d' }}>
                          위도: {location.lat.toFixed(6)}, 경도: {location.lng.toFixed(6)}
                        </p>
                        <p style={{ margin: '2px 0', fontSize: '11px', color: '#adb5bd' }}>
                          저장시간: {location.timestamp}
                        </p>
                      </div>
                      <div>
                        <button 
                          onClick={() => moveToLocation(location)}
                          style={{ 
                            padding: '6px 12px',
                            marginRight: '5px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }}
                        >
                          📍 이동
                        </button>
                        <button 
                          onClick={() => deleteLocation(location.id)}
                          style={{ 
                            padding: '4px 8px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontColor: 'black'
                          }}
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
