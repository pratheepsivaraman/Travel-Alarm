import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './App.css';

// Fix for default marker icon by pointing to local files in the 'public' folder
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/marker-icon-2x.png',
  iconUrl: '/marker-icon.png',
  shadowUrl: '/marker-shadow.png',
});

function LocationMarker({ setCenter, setAccuracy }) {
  const map = useMapEvents({
    locationfound(e) {
      setCenter(e.latlng);
      setAccuracy(e.accuracy);
      map.flyTo(e.latlng, 15);
    },
  });

  useEffect(() => {
    map.locate({ setView: true, maxZoom: 15, watch: true }); // Use watch:true to get continuous updates
  }, [map]);

  return null;
}

function DestinationMarker({ position, info }) {
  const markerRef = useRef(null);

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [position, info]);

  return position ? (
    <Marker ref={markerRef} position={position}>
      <Popup>{info || 'Your Destination'}</Popup>
    </Marker>
  ) : null;
}

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

function App() {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [destination, setDestination] = useState(null);
  const [destinationInfo, setDestinationInfo] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  const [parentsNumber, setParentsNumber] = useState('');
  const [hasAlarmSounded, setHasAlarmSounded] = useState(false);
  const audioRef = useRef(new Audio('/alarm.mp3'));

  const sendSms = (phoneNumber, message) => {
    fetch('https://textbelt.com/text', {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: phoneNumber,
        message: message,
        key: 'textbelt', // using the free tier
      }),
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log('SMS sent successfully!');
        alert('A message has been sent to your parent.');
      } else {
        console.error('Failed to send SMS:', data.error);
        alert('Failed to send message to your parent.');
      }
    })
    .catch(error => {
      console.error('Error sending SMS:', error);
      alert('Failed to send message to your parent.');
    });
  };


  const stopAlarm = () => {
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsAlarmPlaying(false);
  };

  const defaultCenter = [20.5937, 78.9629];

  // We are now using Leaflet's `map.locate({watch: true})` in LocationMarker
  // for better integration with the map, so the watchPosition useEffect is removed.

  useEffect(() => {
    if (currentLocation && destination) {
      const distance = L.latLng(currentLocation).distanceTo(L.latLng(destination));
      console.log(`Distance to destination: ${distance.toFixed(2)} meters`);
      if (distance <= 100) {
        if (!isAlarmPlaying) {
          audioRef.current.loop = true;
          audioRef.current.play().catch(e => console.error("Audio play failed:", e));
          setIsAlarmPlaying(true);
          setHasAlarmSounded(true);
        }
      } else {
        if (isAlarmPlaying) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          setIsAlarmPlaying(false);
        }
        if (hasAlarmSounded) {
          if (parentsNumber) {
            sendSms(parentsNumber, 'I have moved away from my destination.');
          }
          setHasAlarmSounded(false);
        }
      }
    }
  }, [currentLocation, destination]);

  const handleSearch = async () => {
    if (!searchInput) return;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchInput)}&format=json&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        setDestination({ lat: parseFloat(lat), lng: parseFloat(lon) });
        setDestinationInfo(display_name);
      } else {
        alert('Destination not found.');
      }
    } catch (error) {
      console.error('Error during geocoding:', error);
    }
  };

  const handleMapClick = async (latlng) => {
    setDestination(latlng);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`);
      const data = await response.json();
      if (data && data.display_name) {
        setDestinationInfo(data.display_name);
        setSearchInput('');
      } else {
        setDestinationInfo('Unknown location');
      }
    } catch (error) {
      console.error('Error during reverse geocoding:', error);
      setDestinationInfo('Could not fetch address');
    }
  };

  return (
    <div className="App">
      <div className="search-bar">
        <input
          type="text"
          placeholder="Enter your destination"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch}>Set Destination</button>
      </div>
      <div className="parents-number-bar">
        <input
          type="text"
          placeholder="Enter parent's phone number"
          value={parentsNumber}
          onChange={(e) => setParentsNumber(e.target.value)}
        />
      </div>

      {isAlarmPlaying && (
        <div className="alarm-controls">
          <button onClick={stopAlarm}>Stop Alarm</button>
        </div>
      )}

      <MapContainer
        center={currentLocation || defaultCenter}
        zoom={currentLocation ? 13 : 5}
        className="map-container"
      >
        <TileLayer
          attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        {currentLocation && (
          <Marker position={currentLocation}>
            <Popup>
              You are here. <br />
              {locationAccuracy && `Accuracy: ${locationAccuracy.toFixed(2)} meters`}
            </Popup>
          </Marker>
        )}
        <DestinationMarker position={destination} info={destinationInfo} />
        <LocationMarker setCenter={setCurrentLocation} setAccuracy={setLocationAccuracy} />
        <MapClickHandler onMapClick={handleMapClick} />
      </MapContainer>
    </div>
  );
}

export default App;