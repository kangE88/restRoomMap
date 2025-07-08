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
  const [tempLocations, setTempLocations] = useState([])
  const [map, setMap] = useState(null)
  const [markers, setMarkers] = useState([])
  const [tempMarkers, setTempMarkers] = useState([])
  const [isExporting, setIsExporting] = useState(false)
  const [isEmailing, setIsEmailing] = useState(false)
  const [emailForExport, setEmailForExport] = useState('')
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [selectedLocations, setSelectedLocations] = useState([])

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

  const saveLocation = () => {
    if (!clickedPosition || !memo.trim()) {
      alert('위치를 선택하고 메모를 입력해주세요.')
      return
    }

    // 임시 저장
    const newLocation = {
      id: Date.now(),
      lat: clickedPosition.lat,
      lng: clickedPosition.lng,
      memo: memo.trim(),
      timestamp: new Date().toLocaleString()
    }

    setTempLocations(prev => [...prev, newLocation])
    setMemo('')
    
    // 지도에 임시 마커 추가
    if (map && window.kakao) {
      const markerPosition = new window.kakao.maps.LatLng(newLocation.lat, newLocation.lng)
      const marker = new window.kakao.maps.Marker({
        map: map,
        position: markerPosition,
        zIndex: 500 // 임시 마커는 일반 마커보다 위에 표시
      })

      const iwContent = `<div style="padding:5px; width:200px; text-align:center; background-color: #fff3cd; border: 2px solid #ffc107;">
        <strong style="color: #856404;">🔄 임시 저장</strong><br>
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

      setTempMarkers(prev => [...prev, { marker, infowindow, id: newLocation.id }])
    }

    alert('위치가 임시로 저장되었습니다! 영구 저장하려면 "임시 저장 목록"에서 선택하여 저장하세요.')
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

  const exportLocations = async () => {
    setIsExporting(true)
    try {
      const response = await fetch('/api/export')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'locations.json'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        alert('위치 데이터가 성공적으로 내보내졌습니다!')
      } else {
        alert('내보내기에 실패했습니다.')
      }
    } catch (error) {
      console.error('내보내기 오류:', error)
      alert('내보내기 중 오류가 발생했습니다.')
    } finally {
      setIsExporting(false)
    }
  }

  const sendEmail = async () => {
    if (!emailForExport.trim()) {
      alert('이메일 주소를 입력해주세요.')
      return
    }

    setIsEmailing(true)
    try {
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailForExport.trim() }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        alert('이메일이 성공적으로 전송되었습니다!')
        setShowEmailModal(false)
        setEmailForExport('')
      } else {
        alert(data.message || '이메일 전송에 실패했습니다.')
      }
    } catch (error) {
      console.error('이메일 전송 오류:', error)
      alert('이메일 전송 중 오류가 발생했습니다.')
    } finally {
      setIsEmailing(false)
    }
  }

  const saveSelectedLocations = async () => {
    if (selectedLocations.length === 0) {
      alert('저장할 위치를 선택해주세요.')
      return
    }

    try {
      // 선택된 위치들을 영구 저장
      for (const locationId of selectedLocations) {
        const location = tempLocations.find(loc => loc.id === locationId)
        if (location) {
          const res = await fetch('/api/locations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lat: location.lat,
              lng: location.lng,
              memo: location.memo
            }),
          })

          if (res.ok) {
            const data = await res.json()
            if (data.success) {
              // 영구 저장된 위치를 저장된 목록에 추가
              setSavedLocations(prev => [...prev, data.location])
              
              // 임시 마커를 일반 마커로 변경
              const tempMarker = tempMarkers.find(m => m.id === locationId)
              if (tempMarker && map) {
                // 임시 마커 제거
                tempMarker.marker.setMap(null)
                
                // 일반 마커 추가
                const markerPosition = new window.kakao.maps.LatLng(location.lat, location.lng)
                const marker = new window.kakao.maps.Marker({
                  map: map,
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
                  infowindow.open(map, marker)
                })

                setMarkers(prev => [...prev, { marker, infowindow, id: data.location.id }])
              }
            }
          }
        }
      }

      // 임시 저장에서 선택된 위치들 제거
      setTempLocations(prev => prev.filter(loc => !selectedLocations.includes(loc.id)))
      setTempMarkers(prev => prev.filter(m => !selectedLocations.includes(m.id)))
      setSelectedLocations([])
      setShowSaveModal(false)

      alert('선택한 위치들이 영구 저장되었습니다!')
    } catch (error) {
      console.error('영구 저장 오류:', error)
      alert('영구 저장 중 오류가 발생했습니다.')
    }
  }

  const deleteTempLocation = (id) => {
    // 임시 저장에서 제거
    setTempLocations(prev => prev.filter(location => location.id !== id))
    
    // 임시 마커 제거
    const tempMarker = tempMarkers.find(m => m.id === id)
    if (tempMarker) {
      tempMarker.marker.setMap(null)
      setTempMarkers(prev => prev.filter(m => m.id !== id))
    }
  }

  const toggleLocationSelection = (id) => {
    setSelectedLocations(prev => 
      prev.includes(id) 
        ? prev.filter(locId => locId !== id)
        : [...prev, id]
    )
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

          {tempLocations.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3>🔄 임시 저장 목록 ({tempLocations.length}개)</h3>
                <button 
                  onClick={() => setShowSaveModal(true)}
                  disabled={selectedLocations.length === 0}
                  style={{ 
                    padding: '8px 16px',
                    backgroundColor: selectedLocations.length > 0 ? '#28a745' : '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: selectedLocations.length > 0 ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    opacity: selectedLocations.length > 0 ? 1 : 0.6
                  }}
                >
                  💾 선택 저장 ({selectedLocations.length}개)
                </button>
              </div>
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ffc107', borderRadius: '8px', backgroundColor: '#fff3cd' }}>
                {tempLocations.map((location) => (
                  <div 
                    key={location.id} 
                    style={{ 
                      padding: '15px', 
                      borderBottom: '1px solid #ffeaa7',
                      backgroundColor: selectedLocations.includes(location.id) ? '#ffeaa7' : 'transparent'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="checkbox"
                          checked={selectedLocations.includes(location.id)}
                          onChange={() => toggleLocationSelection(location.id)}
                          style={{ cursor: 'pointer' }}
                        />
                        <div>
                          <h4 style={{ margin: '0 0 5px 0', color: '#856404' }}>{location.memo}</h4>
                          <p style={{ margin: '2px 0', fontSize: '12px', color: '#856404' }}>
                            위도: {location.lat.toFixed(6)}, 경도: {location.lng.toFixed(6)}
                          </p>
                          <p style={{ margin: '2px 0', fontSize: '11px', color: '#856404' }}>
                            저장시간: {location.timestamp}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => deleteTempLocation(location.id)}
                        style={{ 
                          padding: '4px 8px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {savedLocations.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3>💾 영구 저장된 위치 목록 ({savedLocations.length}개)</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={exportLocations}
                    disabled={isExporting}
                    style={{ 
                      padding: '8px 16px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: isExporting ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      opacity: isExporting ? 0.6 : 1
                    }}
                  >
                    {isExporting ? '📥 내보내는 중...' : '📥 JSON 내보내기'}
                  </button>
                  <button 
                    onClick={() => setShowEmailModal(true)}
                    disabled={isEmailing}
                    style={{ 
                      padding: '8px 16px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: isEmailing ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      opacity: isEmailing ? 0.6 : 1
                    }}
                  >
                    {isEmailing ? '📧 전송 중...' : '📧 이메일로 보내기'}
                  </button>
                </div>
              </div>
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

          {/* 선택 저장 확인 모달 */}
          {showSaveModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000
            }}>
              <div style={{
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                maxWidth: '500px',
                width: '90%'
              }}>
                <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>💾 선택한 위치 영구 저장</h3>
                <p style={{ margin: '0 0 15px 0', color: '#666' }}>
                  선택한 {selectedLocations.length}개의 위치를 영구 저장하시겠습니까?
                </p>
                <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '20px' }}>
                  {tempLocations
                    .filter(location => selectedLocations.includes(location.id))
                    .map(location => (
                      <div key={location.id} style={{ 
                        padding: '10px', 
                        border: '1px solid #dee2e6', 
                        borderRadius: '4px', 
                        marginBottom: '5px',
                        backgroundColor: '#f8f9fa'
                      }}>
                        <strong>{location.memo}</strong>
                        <br />
                        <small>위도: {location.lat.toFixed(6)}, 경도: {location.lng.toFixed(6)}</small>
                      </div>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setShowSaveModal(false)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    취소
                  </button>
                  <button
                    onClick={saveSelectedLocations}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    영구 저장
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 이메일 전송 모달 */}
          {showEmailModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000
            }}>
              <div style={{
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                maxWidth: '400px',
                width: '90%'
              }}>
                <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>📧 이메일로 보내기</h3>
                <p style={{ margin: '0 0 15px 0', color: '#666' }}>
                  위치 데이터를 받을 이메일 주소를 입력하세요.
                </p>
                <input
                  type="email"
                  value={emailForExport}
                  onChange={(e) => setEmailForExport(e.target.value)}
                  placeholder="이메일 주소 입력"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    marginBottom: '20px',
                    fontSize: '14px'
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      sendEmail()
                    }
                  }}
                />
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setShowEmailModal(false)
                      setEmailForExport('')
                    }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    취소
                  </button>
                  <button
                    onClick={sendEmail}
                    disabled={isEmailing}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: isEmailing ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      opacity: isEmailing ? 0.6 : 1
                    }}
                  >
                    {isEmailing ? '전송 중...' : '전송'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
