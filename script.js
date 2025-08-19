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
        // Validasi koordinat
        if (jembatan.lat && jembatan.lng && 
            !isNaN(jembatan.lat) && !isNaN(jembatan.lng) &&
            jembatan.lat >= -90 && jembatan.lat <= 90 &&
            jembatan.lng >= -180 && jembatan.lng <= 180) {
            
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
                            <strong>Tahun Pembuatan:</strong> ${jembatan.tahunPembuatan || 'Tidak ada data'}<br>
                            <strong>Koordinat:</strong><br>
                            Lat: ${jembatan.lat.toFixed(6)}<br>
                            Lng: ${jembatan.lng.toFixed(6)}
                        </p>
                    </div>
                `);
            
            // Tambahkan event listener untuk memastikan marker bisa diklik
            marker.on('click', function() {
                // Highlight marker yang diklik
                this.getElement().style.filter = 'drop-shadow(0 0 10px #4CAF50)';
                setTimeout(() => {
                    this.getElement().style.filter = '';
                }, 1500);
            });
            
            markers.push(marker);
        } else {
            console.warn(`Koordinat tidak valid untuk jembatan ${jembatan.nomorBH}:`, jembatan.lat, jembatan.lng);
        }
    });

    // Fit map to show all markers
    if (markers.length > 0) {
        const group = new L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
    }

    // Update statistics
    updateStats();
    updateJembatanList();
    
    // Reset filter dan tampilkan semua data
    currentFilter = 'all';
    filteredJembatanData = jembatanData;
    
    // Reset stat cards
    document.querySelectorAll('.stat-card').forEach(card => {
        card.classList.remove('active');
    });
    
    // Aktifkan "Total Jembatan" card
    const totalCard = document.querySelector('.stat-card[onclick*="all"]');
    if (totalCard) {
        totalCard.classList.add('active');
    }
}

function updateStats() {
    document.getElementById('totalJembatan').textContent = jembatanData.length;
    
    if (jembatanData.length > 0) {
        // Hitung statistik kelas jembatan
        const k1Count = jembatanData.filter(j => j.kelas === 'K1').length;
        const k2Count = jembatanData.filter(j => j.kelas === 'K2').length;
        const k3Count = jembatanData.filter(j => j.kelas === 'K3').length;
        
        document.getElementById('jembatanK1').textContent = k1Count;
        document.getElementById('jembatanK2').textContent = k2Count;
        document.getElementById('jembatanK3').textContent = k3Count;
        
        // Hitung jembatan yang berumur 100+ tahun
        const currentYear = new Date().getFullYear();
        const jembatan100Tahun = jembatanData.filter(j => {
            if (j.tahunPembuatan && !isNaN(j.tahunPembuatan)) {
                return (currentYear - j.tahunPembuatan) >= 100;
            }
            return false;
        }).length;
        
        document.getElementById('jembatan100Tahun').textContent = jembatan100Tahun;
        
        // Hitung jembatan dengan panjang bentang > 50 M
        const jembatanPanjang50M = jembatanData.filter(j => {
            if (j.panjang && !isNaN(j.panjang)) {
                return parseFloat(j.panjang) > 50;
            }
            return false;
        }).length;
        
        // Hitung jembatan dengan panjang bentang < 10 M
        const jembatanPanjang10M = jembatanData.filter(j => {
            if (j.panjang && !isNaN(j.panjang)) {
                return parseFloat(j.panjang) < 10;
            }
            return false;
        }).length;
        
        document.getElementById('jembatanPanjang50M').textContent = jembatanPanjang50M;
        document.getElementById('jembatanPanjang10M').textContent = jembatanPanjang10M;
        
        // Update storage usage
        updateStorageUsage();
    } else {
        // Reset semua statistik jika tidak ada data
        document.getElementById('jembatanK1').textContent = '0';
        document.getElementById('jembatanK2').textContent = '0';
        document.getElementById('jembatanK3').textContent = '0';
        document.getElementById('jembatan100Tahun').textContent = '0';
        document.getElementById('jembatanPanjang50M').textContent = '0';
        document.getElementById('jembatanPanjang10M').textContent = '0';
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
function updateJembatanList(dataToShow = jembatanData) {
    const listContainer = document.getElementById('jembatanList');
    if (dataToShow.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; color: #999;">Tidak ada jembatan yang sesuai dengan filter.</p>';
        return;
    }
    const listHTML = dataToShow.map((jembatan, index) => {
        // Cari index asli di jembatanData untuk focusMarker
        const originalIndex = jembatanData.findIndex(j => j.id === jembatan.id);
        return `
        <div class="jembatan-item">
            <div class="jembatan-name">${jembatan.nomorBH}</div>
            ${jembatan.foto ? '<div style="color:#2d8a34;font-weight:bold;margin:4px 0 0 0;">Foto: Ada</div>' : ''}
            <div class="jembatan-coords">
                Km HM: ${jembatan.kmhm} | Kelas: ${jembatan.kelas} | Panjang: ${jembatan.panjang} m<br>
                Tahun: ${jembatan.tahunPembuatan || 'Tidak ada data'} | Lat: ${jembatan.lat.toFixed(6)}, Lng: ${jembatan.lng.toFixed(6)}
            </div>
            <div class="jembatan-actions">
                <a href="https://www.google.com/maps/search/?api=1&query=${jembatan.lat},${jembatan.lng}" target="_blank" class="btn btn-maps">Google Maps</a>
                <button onclick="focusMarkerByID('${jembatan.id}')" class="btn btn-focus">Fokus Peta</button>
            </div>
        </div>
        `;
    }).join('');
    listContainer.innerHTML = listHTML;
}

// Fungsi untuk fokus ke marker di peta berdasarkan ID jembatan
function focusMarkerByID(jembatanID) {
    // Cari jembatan berdasarkan ID
    const jembatan = jembatanData.find(j => j.id === jembatanID);
    if (jembatan) {
        // Cari marker yang sesuai
        const marker = markers.find(m => {
            const markerLat = m.getLatLng().lat;
            const markerLng = m.getLatLng().lng;
            return Math.abs(markerLat - jembatan.lat) < 0.000001 && 
                   Math.abs(markerLng - jembatan.lng) < 0.000001;
        });
        
        if (marker) {
            // Fokus ke marker dan buka popup
            map.setView([jembatan.lat, jembatan.lng], 15);
            marker.openPopup();
            
            // Highlight marker dengan animasi
            marker.getElement().style.filter = 'drop-shadow(0 0 10px #ff6b6b)';
            setTimeout(() => {
                marker.getElement().style.filter = '';
            }, 2000);
        } else {
            // Jika marker tidak ditemukan, buat marker baru sementara
            const tempMarker = L.marker([jembatan.lat, jembatan.lng], { icon: bridgeIcon })
                .addTo(map)
                .bindPopup(`
                    <div style="min-width: 220px;">
                        <h3 style="margin: 0 0 10px 0; color: #333;">${jembatan.nomorBH}</h3>
                        <p style="margin: 5px 0; color: #666;">
                            <strong>Km HM:</strong> ${jembatan.kmhm}<br>
                            <strong>Kelas:</strong> ${jembatan.kelas}<br>
                            <strong>Panjang Bentang:</strong> ${jembatan.panjang} m<br>
                            <strong>Tahun Pembuatan:</strong> ${jembatan.tahunPembuatan || 'Tidak ada data'}<br>
                            <strong>Koordinat:</strong><br>
                            Lat: ${jembatan.lat.toFixed(6)}<br>
                            Lng: ${jembatan.lng.toFixed(6)}
                        </p>
                    </div>
                `);
            
            map.setView([jembatan.lat, jembatan.lng], 15);
            tempMarker.openPopup();
            
            // Hapus marker sementara setelah 3 detik
            setTimeout(() => {
                map.removeLayer(tempMarker);
            }, 3000);
        }
    }
}

// Fungsi untuk fokus ke marker di peta (untuk backward compatibility)
function focusMarker(index) {
    if (jembatanData[index]) {
        const jembatan = jembatanData[index];
        focusMarkerByID(jembatan.id);
    }
}

// Tambahkan ke window object agar bisa dipanggil dari HTML
window.focusMarker = focusMarker;
window.focusMarkerByID = focusMarkerByID;
window.filterJembatan = filterJembatan;

// Fungsi debugging untuk memverifikasi sinkronisasi data
function debugDataSync() {
    console.log('=== DEBUG DATA SYNCHRONIZATION ===');
    console.log('Total jembatanData:', jembatanData.length);
    console.log('Total markers:', markers.length);
    
    if (jembatanData.length !== markers.length) {
        console.warn('⚠️ JUMLAH DATA TIDAK SAMA!');
    }
    
    // Bandingkan setiap jembatan dengan marker
    jembatanData.forEach((jembatan, index) => {
        if (markers[index]) {
            const markerLat = markers[index].getLatLng().lat;
            const markerLng = markers[index].getLatLng().lng;
            
            if (Math.abs(markerLat - jembatan.lat) > 0.000001 || 
                Math.abs(markerLng - jembatan.lng) > 0.000001) {
                console.error(`❌ KOORDINAT TIDAK SAMA untuk ${jembatan.nomorBH}:`);
                console.error(`   Data: ${jembatan.lat}, ${jembatan.lng}`);
                console.error(`   Marker: ${markerLat}, ${markerLng}`);
            } else {
                console.log(`✅ ${jembatan.nomorBH}: Koordinat sesuai`);
            }
        } else {
            console.error(`❌ Marker tidak ditemukan untuk ${jembatan.nomorBH}`);
        }
    });
    
    console.log('=== END DEBUG ===');
}

// Tambahkan ke window object untuk debugging
window.debugDataSync = debugDataSync;

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

// Global variables untuk filter
let currentFilter = 'all';
let filteredJembatanData = [];

// Function untuk update map markers
function updateMapMarkers(dataToShow) {
    // Clear existing markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    
    // Add new markers
    dataToShow.forEach((jembatan, index) => {
        // Validasi koordinat
        if (jembatan.lat && jembatan.lng && 
            !isNaN(jembatan.lat) && !isNaN(jembatan.lng) &&
            jembatan.lat >= -90 && jembatan.lat <= 90 &&
            jembatan.lng >= -180 && jembatan.lng <= 180) {
            
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
                            <strong>Tahun Pembuatan:</strong> ${jembatan.tahunPembuatan || 'Tidak ada data'}<br>
                            <strong>Koordinat:</strong><br>
                            Lat: ${jembatan.lat.toFixed(6)}<br>
                            Lng: ${jembatan.lng.toFixed(6)}
                        </p>
                    </div>
                `);
            
            // Tambahkan event listener untuk memastikan marker bisa diklik
            marker.on('click', function() {
                // Highlight marker yang diklik
                this.getElement().style.filter = 'drop-shadow(0 0 10px #4CAF50)';
                setTimeout(() => {
                    this.getElement().style.filter = '';
                }, 1500);
            });
            
            markers.push(marker);
        } else {
            console.warn(`Koordinat tidak valid untuk jembatan ${jembatan.nomorBH}:`, jembatan.lat, jembatan.lng);
        }
    });
    
    // Fit map to show all markers if there are any
    if (markers.length > 0) {
        const group = new L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

// Function untuk filter jembatan
function filterJembatan(filterType, event) {
    currentFilter = filterType;
    
    // Reset semua stat cards
    document.querySelectorAll('.stat-card').forEach(card => {
        card.classList.remove('active');
    });
    
    // Aktifkan stat card yang diklik
    const clickedCard = event.currentTarget;
    clickedCard.classList.add('active');
    
    // Filter data berdasarkan tipe
    switch(filterType) {
        case 'all':
            filteredJembatanData = jembatanData;
            break;
        case 'K1':
            filteredJembatanData = jembatanData.filter(j => j.kelas === 'K1');
            break;
        case 'K2':
            filteredJembatanData = jembatanData.filter(j => j.kelas === 'K2');
            break;
        case 'K3':
            filteredJembatanData = jembatanData.filter(j => j.kelas === 'K3');
            break;
        case '100tahun':
            const currentYear = new Date().getFullYear();
            filteredJembatanData = jembatanData.filter(j => {
                if (j.tahunPembuatan && !isNaN(j.tahunPembuatan)) {
                    return (currentYear - j.tahunPembuatan) >= 100;
                }
                return false;
            });
            break;
        case 'panjang50':
            filteredJembatanData = jembatanData.filter(j => {
                if (j.panjang && !isNaN(j.panjang)) {
                    return parseFloat(j.panjang) > 50;
                }
                return false;
            });
            break;
        case 'panjang10':
            filteredJembatanData = jembatanData.filter(j => {
                if (j.panjang && !isNaN(j.panjang)) {
                    return parseFloat(j.panjang) < 10;
                }
                return false;
            });
            break;
        default:
            filteredJembatanData = jembatanData;
    }
    
    // Update map markers dengan data yang difilter
    updateMapMarkers(filteredJembatanData);
    
    // Update jembatan list dengan data yang difilter
    updateJembatanList(filteredJembatanData);
    
    // Update judul list
    updateListTitle(filterType);
}

// Function untuk update judul list berdasarkan filter
function updateListTitle(filterType) {
    const listTitle = document.querySelector('.jembatan-list h3');
    let title = '📋 Daftar Jembatan';
    
    switch(filterType) {
        case 'K1':
            title = '📋 Daftar Jembatan Kelas K1';
            break;
        case 'K2':
            title = '📋 Daftar Jembatan Kelas K2';
            break;
        case 'K3':
            title = '📋 Daftar Jembatan Kelas K3';
            break;
        case '100tahun':
            title = '📋 Daftar Jembatan Umur 100+ Tahun';
            break;
        case 'panjang50':
            title = '📋 Daftar Jembatan Panjang > 50 M';
            break;
        case 'panjang10':
            title = '📋 Daftar Jembatan Panjang < 10 M';
            break;
        default:
            title = '📋 Daftar Jembatan';
    }
    
    listTitle.textContent = title;
}

 