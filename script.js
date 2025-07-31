// Inisialisasi peta
let map = L.map('map').setView([-6.8896, 107.6406], 8); // Fokus awal Jawa Barat
let markers = [];
let jembatanData = [];
let useFirebase = false; // Flag untuk mengecek apakah Firebase tersedia
let unsubscribe = null; // Untuk real-time listener

// Tambahkan tile layer (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Custom icon jembatan
const bridgeIcon = L.icon({
  iconUrl: 'bridge-icon.png', // Pastikan file ini ada di folder yang sama
  iconSize: [48, 48],
  iconAnchor: [24, 48],
  popupAnchor: [0, -48]
});

// Load data dari localStorage saat website dibuka
window.addEventListener('DOMContentLoaded', function() {
    // Cek apakah Firebase tersedia
    if (typeof FirebaseService !== 'undefined' && FirebaseService) {
        useFirebase = true;
        updateDBInfo('Firebase tersedia - menggunakan cloud database');
        loadJembatanFromFirebase();
    } else {
        useFirebase = false;
        updateDBInfo('Firebase tidak tersedia - menggunakan LocalStorage');
        loadJembatanFromLocalStorage();
        updateDBStatus('⚠️ Menggunakan LocalStorage (Firebase tidak tersedia)');
    }
});

// Load data dari Firebase
async function loadJembatanFromFirebase() {
    try {
        updateDBStatus('🔄 Memuat data dari database...');
        
        // Set up real-time listener
        unsubscribe = FirebaseService.onJembatanUpdate((data) => {
            jembatanData = data;
            displayJembatan(jembatanData);
            updateDBStatus('✅ Terhubung ke database (Real-time)');
        });
        
    } catch (error) {
        console.error('Error loading from Firebase:', error);
        updateDBStatus('❌ Error menghubungkan ke database, menggunakan LocalStorage');
        useFirebase = false;
        loadJembatanFromLocalStorage();
    }
}

// Load data dari LocalStorage (fallback)
function loadJembatanFromLocalStorage() {
    try {
        const saved = localStorage.getItem('jembatanData');
        if (saved) {
            const data = JSON.parse(saved);
            if (Array.isArray(data) && data.length > 0) {
                jembatanData = data;
                displayJembatan(jembatanData);
                updateDBStatus('✅ Data dimuat dari LocalStorage');
            }
        }
    } catch (error) {
        console.error('Error loading from LocalStorage:', error);
        updateDBStatus('❌ Error memuat data');
    }
}

// Update status database
function updateDBStatus(status) {
    const statusElement = document.getElementById('dbStatus');
    if (statusElement) {
        statusElement.textContent = status;
    }
}

// Update info database
function updateDBInfo(info) {
    const infoElement = document.getElementById('dbInfo');
    if (infoElement) {
        infoElement.textContent = info;
    }
}









function displayJembatan(data) {
    // Simpan ke localStorage
    localStorage.setItem('jembatanData', JSON.stringify(data));
    // Clear existing markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    jembatanData = data;

    // Add new markers
    data.forEach((jembatan, index) => {
        let fotoLinkHtml = '';
        if (jembatan.foto) {
            fotoLinkHtml = `<a href="${jembatan.foto}" target="_blank" style="font-weight:bold;display:block;margin-bottom:6px;">📷 Foto Jembatan</a>`;
        }
        const marker = L.marker([jembatan.lat, jembatan.lng], { icon: bridgeIcon })
            .addTo(map)
            .bindPopup(`
                <div style="min-width: 220px;">
                    ${fotoLinkHtml}
                    <h3 style="margin: 0 0 10px 0; color: #333;">${jembatan.nomorBH}</h3>
                    <p style="margin: 5px 0; color: #666;">
                        <strong>Km HM:</strong> ${jembatan.kmhm}<br>
                        <strong>Kelas:</strong> ${jembatan.kelas}<br>
                        <strong>Panjang Bentang:</strong> ${jembatan.panjang} m<br>
                        <strong>Koordinat:</strong><br>
                        Lat: ${jembatan.lat.toFixed(6)}<br>
                        Lng: ${jembatan.lng.toFixed(6)}
                    </p>
                </div>
            `);
        markers.push(marker);
    });

    // Fit map to show all markers
    if (markers.length > 0) {
        const group = new L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
    }

    // Update statistics
    updateStats();
    updateJembatanList();
}

function updateStats() {
    document.getElementById('totalJembatan').textContent = jembatanData.length;
    
    if (jembatanData.length > 0) {
        const now = new Date();
        document.getElementById('lastUpdate').textContent = now.toLocaleTimeString('id-ID');
        
        // Calculate area covered (simplified)
        if (jembatanData.length > 1) {
            const lats = jembatanData.map(j => j.lat);
            const lngs = jembatanData.map(j => j.lng);
            const latDiff = Math.max(...lats) - Math.min(...lats);
            const lngDiff = Math.max(...lngs) - Math.min(...lngs);
            const area = (latDiff * lngDiff * 111 * 111).toFixed(1);
            document.getElementById('areaCovered').textContent = `${area} km²`;
        } else {
            document.getElementById('areaCovered').textContent = '1 lokasi';
        }
        
        // Update storage usage
        updateStorageUsage();
    }
}

function updateStorageUsage() {
    try {
        const jembatanDataString = localStorage.getItem('jembatanData');
        if (jembatanDataString) {
            const dataSize = new Blob([jembatanDataString]).size;
            const dataSizeKB = (dataSize / 1024).toFixed(2);
            
            // Get total localStorage usage
            let totalSize = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    totalSize += new Blob([localStorage[key]]).size;
                }
            }
            const totalSizeKB = (totalSize / 1024).toFixed(2);
            
            // Check if there's a storage display element, if not create one
            let storageElement = document.getElementById('storageUsage');
            if (!storageElement) {
                storageElement = document.createElement('div');
                storageElement.id = 'storageUsage';
                storageElement.style.cssText = 'font-size: 12px; color: #666; margin-top: 5px;';
                const statsContainer = document.querySelector('.stats-container');
                if (statsContainer) {
                    statsContainer.appendChild(storageElement);
                }
            }
            
            storageElement.innerHTML = `
                <strong>Penyimpanan:</strong><br>
                Data Jembatan: ${dataSizeKB} KB<br>
                Total LocalStorage: ${totalSizeKB} KB
            `;
        }
    } catch (error) {
        console.log('Error checking storage usage:', error);
    }
}

// Perbaiki updateJembatanList agar hanya menampilkan semua jembatan tanpa filter
function updateJembatanList() {
    const listContainer = document.getElementById('jembatanList');
    if (jembatanData.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; color: #999;">Belum ada data jembatan.</p>';
        return;
    }
    const listHTML = jembatanData.map((jembatan, index) => {
        return `
        <div class="jembatan-item">
            <div class="jembatan-name">${jembatan.nomorBH}</div>
            ${jembatan.foto ? '<div style="color:#2d8a34;font-weight:bold;margin:4px 0 0 0;">Foto: Ada</div>' : ''}
            <div class="jembatan-coords">
                Km HM: ${jembatan.kmhm} | Kelas: ${jembatan.kelas} | Panjang: ${jembatan.panjang} m<br>
                Lat: ${jembatan.lat.toFixed(6)}, Lng: ${jembatan.lng.toFixed(6)}
            </div>
            <div class="jembatan-actions">
                <a href="https://www.google.com/maps/search/?api=1&query=${jembatan.lat},${jembatan.lng}" target="_blank" class="btn btn-maps">Google Maps</a>
                <button onclick="focusMarker(${index})" class="btn btn-focus">Fokus Peta</button>
            </div>
        </div>
        `;
    }).join('');
    listContainer.innerHTML = listHTML;
}

// Fungsi untuk fokus ke marker di peta
function focusMarker(index) {
    if (markers[index]) {
        map.setView([jembatanData[index].lat, jembatanData[index].lng], 12);
        markers[index].openPopup();
    }
}

// Tambahkan ke window object agar bisa dipanggil dari HTML
window.focusMarker = focusMarker;

function showError(message) {
    hideMessages();
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    document.querySelector('.info-panel').insertBefore(errorDiv, document.querySelector('.info-panel').firstChild);
}

function showSuccess(message) {
    hideMessages();
    const successDiv = document.createElement('div');
    successDiv.className = 'success';
    successDiv.textContent = message;
    document.querySelector('.info-panel').insertBefore(successDiv, document.querySelector('.info-panel').firstChild);
}

function hideMessages() {
    const messages = document.querySelectorAll('.error, .success');
    messages.forEach(msg => msg.remove());
}

 