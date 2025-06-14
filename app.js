// Dashboard State
let currentCategory = 'all';
let map = null;
let markers = {};
let myTrip = [];
let currentLocationMarker = null;
let accuracyCircle = null;
let isShowingCurrentLocation = false;
let watchId = null;
let currentCityCenter = null;

// Utility: List of city JSON files (add more as needed)
const cityFiles = [
    { file: 'Copenhagen.json', label: 'Copenhagen' },
    { file: 'Stockholm.json', label: 'Stockholm' }
];

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    initializeEventListeners();
    initializeCurrentLocation();

    populateCityDropdown();
    loadTripFromStorage(); // Load saved trip data
    
    // Load the first city by default
    loadCityFromFile(cityFiles[0].file);
});

// Map Initialization
function initializeMap() {
    map = L.map('map').setView([55.6761, 12.5683], 12);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    markers = {
        sightseeing: L.layerGroup().addTo(map),
        food: L.layerGroup().addTo(map),
        drinks: L.layerGroup().addTo(map)
    };
}

// Event Listeners
function initializeEventListeners() {
    // Category filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const category = btn.dataset.category;
            switchCategory(category);
        });
    });
    
    // Search
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
        searchInput.addEventListener('keyup', handleSearch);
    }
    
    // Price filter
    const priceFilter = document.getElementById('price-filter');
    if (priceFilter) {
        priceFilter.addEventListener('change', handlePriceFilter);
    }
    
    // Map layer controls
    const layerControls = ['sightseeing-layer', 'food-layer', 'drinks-layer'];
    layerControls.forEach(controlId => {
        const control = document.getElementById(controlId);
        if (control) {
            control.addEventListener('change', toggleMapLayer);
        }
    });
    
    // Clear trip
    const clearTripBtn = document.getElementById('clear-trip');
    if (clearTripBtn) {
        clearTripBtn.addEventListener('click', clearTrip);
    }
}

function showContentSections() {
    // First hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show sections based on current category
    if (currentCategory === 'all') {
        // Show all venue sections
        document.getElementById('sightseeing-section').classList.add('active');
        document.getElementById('food-section').classList.add('active');
        document.getElementById('drinks-section').classList.add('active');
    } else if (currentCategory === 'daily-planner') {
        // For daily planner tab, don't show the "Suggested Itineraries" section
        // Just show the trip planner (which is always visible)
    } else if (currentCategory === 'tips') {
        document.getElementById('tips-section').classList.add('active');
    } else {
        // Show specific category section
        document.getElementById(`${currentCategory}-section`).classList.add('active');
    }
}

function addMarkersToMap(cityData) {
    // Sightseeing (red markers)
    cityData.sightseeing.forEach(attraction => {
        const marker = L.marker([attraction.location.lat, attraction.location.lng], {
            icon: createCustomIcon('red')
        }).bindPopup(createPopupContent(attraction, 'sightseeing'));
        
        marker.venueId = `sightseeing-${attraction.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;
        markers.sightseeing.addLayer(marker);
    });
    
    // Food (purple markers)
    cityData.food.forEach(restaurant => {
        const marker = L.marker([restaurant.location.lat, restaurant.location.lng], {
            icon: createCustomIcon('purple')
        }).bindPopup(createPopupContent(restaurant, 'food'));
        
        marker.venueId = `food-${restaurant.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;
        markers.food.addLayer(marker);
    });
    
    // Drinks (green markers)
    cityData.drinks.forEach(bar => {
        const marker = L.marker([bar.location.lat, bar.location.lng], {
            icon: createCustomIcon('green')
        }).bindPopup(createPopupContent(bar, 'drinks'));
        
        marker.venueId = `drinks-${bar.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;
        markers.drinks.addLayer(marker);
    });
}

function createCustomIcon(color) {
    const colorMap = {
        red: '#e74c3c',
        purple: '#9b59b6',
        green: '#27ae60'
    };
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${colorMap[color]}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
}

function createPopupContent(venue, type) {
    let price = '';
    if (type === 'food' || type === 'drinks') {
        price = venue.price_range ? `<div class="popup-price">${venue.price_range}</div>` : '';
    }
    return `
        <div class="popup-content">
            <h3>${venue.name}</h3>
            <div class="popup-desc">${venue.description || ''}</div>
            ${price}
            <div class="popup-rating">Rating: ${venue.rating ? venue.rating : 'N/A'}</div>
            ${venue.website ? `<a href="${venue.website}" target="_blank">Website</a>` : ''}
        </div>
    `;
}

function loadSightseeing(sightseeing) {
    const grid = document.getElementById('sightseeing-grid');
    if (!grid) return;
    grid.innerHTML = sightseeing.map(createSightseeingCard).join('');
}

function loadFood(food) {
    const grid = document.getElementById('food-grid');
    if (!grid) return;
    grid.innerHTML = food.map(createFoodCard).join('');
}

function loadDrinks(drinks) {
    const grid = document.getElementById('drinks-grid');
    if (!grid) return;
    grid.innerHTML = drinks.map(createDrinksCard).join('');
}

function loadLocalTips(cityName) {
    const tipsSection = document.getElementById('tips-content');
    if (!tipsSection) return;
    const tips = window.cityData.localTips;
    if (!tips) {
        tipsSection.innerHTML = '<div class="empty-state">No local tips available.</div>';
        return;
    }
    tipsSection.innerHTML = `
        <div class="tips-block">
            <h4>Transportation</h4>
            <ul>${tips.transportation.map(t => `<li>${t}</li>`).join('')}</ul>
        </div>
        <div class="tips-block">
            <h4>Culture</h4>
            <ul>${tips.culture.map(t => `<li>${t}</li>`).join('')}</ul>
        </div>
        <div class="tips-block">
            <h4>Emergency</h4>
            <ul>${tips.emergency.map(t => `<li>${t}</li>`).join('')}</ul>
        </div>
    `;
}

function createSightseeingCard(attraction) {
    const id = `sightseeing-${attraction.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;
    const priceCategory = attraction.entry_fee === 'Free' || attraction.entry_fee === 'Free to explore' ? 'free' : 
                         (attraction.entry_fee && (attraction.entry_fee.includes('€') || attraction.entry_fee.includes('SEK'))) ? '$$' : '$';

    return `
        <div class="venue-card" data-venue-id="${id}" data-category="sightseeing" data-price="${priceCategory}">
            <div class="venue-header">
                <h3 class="venue-name">${attraction.name}</h3>
                <div class="venue-actions">
                    <button class="action-btn" onclick="highlightOnMap('${id}')" title="Show on map">
                        <i class="fas fa-map-marker-alt"></i>
                    </button>
                    <button class="action-btn" onclick="addToTrip('${attraction.name}', 'sightseeing')" title="Add to trip">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
            </div>
            <p class="venue-description">${attraction.description || ''}</p>
            <div class="venue-details">
                ${attraction.opening_hours ? `
                <div class="detail-item">
                    <span class="detail-label">Hours:</span>
                    <span class="detail-value">${attraction.opening_hours}</span>
                </div>` : ''}
                ${attraction.entry_fee ? `
                <div class="detail-item">
                    <span class="detail-label">Fee:</span>
                    <span class="detail-value">${attraction.entry_fee}</span>
                </div>` : ''}
                ${attraction.duration ? `
                <div class="detail-item">
                    <span class="detail-label">Duration:</span>
                    <span class="detail-value">${attraction.duration}</span>
                </div>` : ''}
            </div>
            <div class="venue-tags">
                ${(attraction.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        </div>
    `;
}

function createFoodCard(restaurant) {
    const id = `food-${restaurant.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;
    const stars = restaurant.michelinStars ? '⭐'.repeat(restaurant.michelinStars) : '';
    
    // Handle booking badge - check for both boolean and string values
    let bookingBadge = '';
    if (restaurant.booking_required === true || restaurant.booking_required === 'Essential' || restaurant.booking_required === 'Essential, months ahead') {
        bookingBadge = '<div class="booking-badge essential">Booking Essential</div>';
    } else if (restaurant.booking_required === 'Recommended' || restaurant.booking_required === 'Required') {
        bookingBadge = '<div class="booking-badge recommended">Booking Recommended</div>';
    }
    
    return `
        <div class="venue-card" data-venue-id="${id}" data-category="food" data-price="${restaurant.price_range || ''}">
            ${bookingBadge}
            <div class="venue-header">
                <h3 class="venue-name">${restaurant.name}</h3>
                <div class="venue-actions">
                    <button class="action-btn" onclick="highlightOnMap('${id}')" title="Show on map">
                        <i class="fas fa-map-marker-alt"></i>
                    </button>
                    <button class="action-btn" onclick="addToTrip('${restaurant.name}', 'food')" title="Add to trip">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
            </div>
            <p class="venue-description">${restaurant.description || ''}</p>
            <div class="venue-details">
                ${restaurant.cuisine ? `
                <div class="detail-item">
                    <span class="detail-label">Cuisine:</span>
                    <span class="detail-value">${restaurant.cuisine}</span>
                </div>` : ''}
                ${restaurant.opening_hours ? `
                <div class="detail-item">
                    <span class="detail-label">Hours:</span>
                    <span class="detail-value">${restaurant.opening_hours}</span>
                </div>` : ''}
                ${restaurant.michelinStars ? `
                <div class="detail-item">
                    <span class="detail-label">Michelin:</span>
                    <span class="detail-value michelin-stars">${stars}</span>
                </div>` : ''}
                ${restaurant.price_range ? `
                <div class="detail-item">
                    <span class="detail-label">Price:</span>
                    <span class="detail-value">${restaurant.price_range}</span>
                </div>` : ''}
            </div>
            <div class="venue-tags">
                ${(restaurant.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        </div>
    `;
}

function createDrinksCard(bar) {
    const id = `drinks-${bar.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;
    
    // Handle booking badge for bars (if they have booking requirements)
    let bookingBadge = '';
    if (bar.booking_required === true || bar.booking_required === 'Essential' || bar.booking_required === 'Essential, months ahead') {
        bookingBadge = '<div class="booking-badge essential">Booking Essential</div>';
    } else if (bar.booking_required === 'Recommended' || bar.booking_required === 'Required') {
        bookingBadge = '<div class="booking-badge recommended">Booking Recommended</div>';
    }
    
    return `
        <div class="venue-card" data-venue-id="${id}" data-category="drinks" data-price="${bar.price_range || '$$'}">
            ${bookingBadge}
            <div class="venue-header">
                <h3 class="venue-name">${bar.name}</h3>
                <div class="venue-actions">
                    <button class="action-btn" onclick="highlightOnMap('${id}')" title="Show on map">
                        <i class="fas fa-map-marker-alt"></i>
                    </button>
                    <button class="action-btn" onclick="addToTrip('${bar.name}', 'drinks')" title="Add to trip">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
            </div>
            <p class="venue-description">${bar.description || ''}</p>
            <div class="venue-details">
                ${bar.type ? `
                <div class="detail-item">
                    <span class="detail-label">Type:</span>
                    <span class="detail-value">${bar.type}</span>
                </div>` : ''}
                ${bar.opening_hours ? `
                <div class="detail-item">
                    <span class="detail-label">Hours:</span>
                    <span class="detail-value">${bar.opening_hours}</span>
                </div>` : ''}
                ${bar.dressCode ? `
                <div class="detail-item">
                    <span class="detail-label">Dress Code:</span>
                    <span class="detail-value">${bar.dressCode}</span>
                </div>` : ''}
                ${bar.price_range ? `
                <div class="detail-item">
                    <span class="detail-label">Price:</span>
                    <span class="detail-value">${bar.price_range}</span>
                </div>` : ''}
            </div>
            <div class="venue-tags">
                ${(bar.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        </div>
    `;
}

function switchCategory(category) {
    currentCategory = category;
    
    // Update filter button states
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
    });
    
    showContentSections();
    applyFilters();
}

function applyFilters() {
    const searchInput = document.getElementById('search-input');
    const priceFilter = document.getElementById('price-filter');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const priceFilterValue = priceFilter ? priceFilter.value : 'all';
    
    document.querySelectorAll('.venue-card').forEach(card => {
        const category = card.dataset.category;
        const price = card.dataset.price;
        const text = card.textContent.toLowerCase();
        
        let visible = true;
        
        // Category filter - only apply if not showing all categories
        if (currentCategory !== 'all' && category !== currentCategory) {
            visible = false;
        }
        
        // Search filter
        if (searchTerm && !text.includes(searchTerm)) {
            visible = false;
        }
        
        // Price filter
        if (priceFilterValue !== 'all') {
            if (priceFilterValue === '$' && !['$', 'free'].includes(price)) {
                visible = false;
            } else if (priceFilterValue === '$$' && price !== '$$') {
                visible = false;
            } else if (priceFilterValue === '$$$' && price !== '$$$') {
                visible = false;
            } else if (priceFilterValue === '$$$$' && price !== '$$$$') {
                visible = false;
            }
        }
        
        card.classList.toggle('filtered-out', !visible);
    });
}

function handleSearch() {
    applyFilters();
}

function handlePriceFilter() {
    applyFilters();
}

// Map Interactions
function toggleMapLayer(event) {
    const layerType = event.target.id.replace('-layer', '');
    const layer = markers[layerType];
    
    if (event.target.checked) {
        map.addLayer(layer);
    } else {
        map.removeLayer(layer);
    }
}

function highlightOnMap(venueId) {
    // Remove existing highlights
    document.querySelectorAll('.venue-card').forEach(card => {
        card.classList.remove('highlighted');
    });
    
    // Highlight selected card
    const card = document.querySelector(`[data-venue-id="${venueId}"]`);
    if (card) {
        card.classList.add('highlighted');
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // Find and open corresponding marker popup
    Object.values(markers).forEach(layerGroup => {
        layerGroup.eachLayer(marker => {
            if (marker.venueId === venueId) {
                marker.openPopup();
                map.setView(marker.getLatLng(), Math.max(map.getZoom(), 15));
            }
        });
    });
}

// Trip Planning
function addToTrip(venueName, venueType) {
    const existingItem = myTrip.find(item => item.name === venueName);
    
    if (existingItem) {
        // If item already exists, remove it (toggle off)
        removeFromTrip(venueName);
        return;
    }
    
    // If item doesn't exist, add it (toggle on)
    myTrip.push({ 
        name: venueName, 
        type: venueType,
        addedAt: new Date().toISOString(),
        city: window.cityData?.name || 'Unknown'
    });
    
    saveTripToStorage(); // Save to localStorage
    updateTripDisplay();
    
    // Update button state
    document.querySelectorAll(`[onclick*="${venueName}"]`).forEach(btn => {
        if (btn.title === 'Add to trip') {
            btn.classList.add('added');
        }
    });
    
    showToast(`${venueName} added to trip!`, 'success');
}

function removeFromTrip(venueName) {
    myTrip = myTrip.filter(item => item.name !== venueName);
    saveTripToStorage(); // Save to localStorage
    updateTripDisplay();
    
    // Update button state
    document.querySelectorAll(`[onclick*="${venueName}"]`).forEach(btn => {
        if (btn.title === 'Add to trip') {
            btn.classList.remove('added');
        }
    });
    
    showToast(`${venueName} removed from trip`, 'info');
}

function clearTrip() {
    if (myTrip.length === 0) return;
    
    if (confirm('Are you sure you want to clear your entire trip?')) {
        myTrip = [];
        saveTripToStorage(); // Save to localStorage
        updateTripDisplay();
        
        // Remove all added states
        document.querySelectorAll('.action-btn.added').forEach(btn => {
            btn.classList.remove('added');
        });
        
        showToast('Trip cleared', 'info');
    }
}

function updateTripDisplay() {
    const tripItems = document.getElementById('trip-items');
    if (!tripItems) return;
    
    if (myTrip.length === 0) {
        tripItems.innerHTML = '<div class="empty-state">No items in your trip yet. Click the heart icon on venues to add them!</div>';
        return;
    }
    
    // Group by city for better organization
    const tripByCity = myTrip.reduce((acc, item) => {
        const city = item.city || 'Unknown';
        if (!acc[city]) acc[city] = [];
        acc[city].push(item);
        return acc;
    }, {});
    
    let html = '';
    Object.entries(tripByCity).forEach(([city, items]) => {
        html += `<div class="trip-city-group">`;
        if (Object.keys(tripByCity).length > 1) {
            html += `<h4 class="trip-city-title">${city}</h4>`;
        }
        
        items.forEach(item => {
            const typeIcon = getTypeIcon(item.type);
            html += `
                <div class="trip-item">
                    <div class="trip-item-info">
                        <span class="trip-item-icon">${typeIcon}</span>
                        <span class="trip-item-name">${item.name}</span>
                        <span class="trip-item-type">${item.type}</span>
                    </div>
                    <button class="remove-item" onclick="removeFromTrip('${item.name}')" title="Remove from trip">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        });
        html += `</div>`;
    });
    
    tripItems.innerHTML = html;
}

function getTypeIcon(type) {
    const icons = {
        'sightseeing': '🏛️',
        'food': '🍽️',
        'drinks': '🍹'
    };
    return icons[type] || '📍';
}

// Update button states based on saved trip
function updateButtonStates() {
    // Remove all added states first
    document.querySelectorAll('.action-btn.added').forEach(btn => {
        btn.classList.remove('added');
    });
    
    // Add states for items in trip
    myTrip.forEach(item => {
        document.querySelectorAll(`[onclick*="${item.name}"]`).forEach(btn => {
            if (btn.title === 'Add to trip') {
                btn.classList.add('added');
            }
        });
    });
}

// City Management
function populateCityDropdown() {
    const citySelect = document.getElementById('city-select');
    if (!citySelect) return;
    
    cityFiles.forEach(city => {
        const option = document.createElement('option');
        option.value = city.file;
        option.textContent = city.label;
        citySelect.appendChild(option);
    });
    
    citySelect.addEventListener('change', (e) => {
        loadCityFromFile(e.target.value);
    });
}

function loadCityFromFile(filename) {
    // Show loading indicator
    const citySelect = document.getElementById('city-select');
    const originalText = citySelect.options[citySelect.selectedIndex].text;
    
    fetch(filename)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            window.cityData = data;
            updateDashboardWithCity(data);
            showToast(`Loaded ${data.name} successfully!`, 'success');
        })
        .catch(error => {
            console.error('Error loading city data:', error);
            
            // Check if we're offline
            if (!navigator.onLine) {
                showToast('You are offline. City data may not be available.', 'warning');
            } else {
                showToast('Failed to load city data. Please try again.', 'error');
            }
            
            // Reset dropdown to previous selection if load failed
            // This prevents the dropdown from showing a city that didn't actually load
            if (window.cityData) {
                // Find the option that matches current loaded city
                for (let i = 0; i < citySelect.options.length; i++) {
                    if (citySelect.options[i].value.includes(window.cityData.name.toLowerCase())) {
                        citySelect.selectedIndex = i;
                        break;
                    }
                }
            }
        });
}

function updateDashboardWithCity(cityData) {
    // Update map center and store it
    currentCityCenter = [cityData.center.lat, cityData.center.lng];
    map.setView(currentCityCenter, 12);
    
    // Clear existing markers
    Object.values(markers).forEach(layer => layer.clearLayers());
    
    // Add new markers
    addMarkersToMap(cityData);
    
    // Load content
    loadSightseeing(cityData.sightseeing);
    loadFood(cityData.food);
    loadDrinks(cityData.drinks);
    loadLocalTips(cityData.name.toLowerCase());
    
    // Reset current location if active
    if (isShowingCurrentLocation) {
        returnToCityCenter();
    }
    
    // Reset filters and show content
    showContentSections();
    applyFilters();
    
    // After loading content, restore button states
    setTimeout(() => {
        updateButtonStates();
    }, 100); // Small delay to ensure DOM is updated
}

// Current Location Functions
function initializeCurrentLocation() {
    const locationBtn = document.getElementById('current-location-btn');
    if (locationBtn) {
        locationBtn.addEventListener('click', toggleCurrentLocation);
    }
}

function toggleCurrentLocation() {
    const locationBtn = document.getElementById('current-location-btn');
    
    if (isShowingCurrentLocation) {
        // Return to city center
        returnToCityCenter();
    } else {
        // Get current location
        getCurrentLocation();
    }
}

function getCurrentLocation() {
    const locationBtn = document.getElementById('current-location-btn');
    
    if (!navigator.geolocation) {
        showToast('Geolocation is not supported by this browser.', 'error');
        return;
    }
    
    // Show loading state
    locationBtn.classList.add('loading');
    locationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    // Get current position
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            showCurrentLocationOnMap(latitude, longitude, accuracy);
            startLocationTracking();
            
            // Update button state
            locationBtn.classList.remove('loading');
            locationBtn.classList.add('active');
            locationBtn.innerHTML = '<i class="fas fa-times"></i>';
            
            isShowingCurrentLocation = true;
            showToast('Current location found!', 'success');
        },
        (error) => {
            handleGeolocationError(error);
            locationBtn.classList.remove('loading');
            locationBtn.classList.add('error');
            locationBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
            
            // Reset button after 2 seconds
            setTimeout(() => {
                locationBtn.classList.remove('error');
                locationBtn.innerHTML = '<i class="fas fa-location-arrow"></i>';
            }, 2000);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
        }
    );
}

function showCurrentLocationOnMap(lat, lng, accuracy) {
    // Store current city center if not already stored
    if (!currentCityCenter) {
        currentCityCenter = map.getCenter();
    }
    
    // Remove existing markers
    if (currentLocationMarker) {
        map.removeLayer(currentLocationMarker);
    }
    if (accuracyCircle) {
        map.removeLayer(accuracyCircle);
    }
    
    // Create accuracy circle
    accuracyCircle = L.circle([lat, lng], {
        radius: accuracy,
        className: 'accuracy-circle',
        fillOpacity: 0.2,
        weight: 1
    }).addTo(map);
    
    // Create current location marker
    const currentLocationIcon = L.divIcon({
        className: 'current-location-marker',
        html: '<div class="current-location-marker"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
    
    currentLocationMarker = L.marker([lat, lng], { 
        icon: currentLocationIcon,
        zIndexOffset: 1000
    }).addTo(map);
    
    // Pan to current location
    map.setView([lat, lng], 16, { animate: true, duration: 1 });
}

function startLocationTracking() {
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
    }
    
    watchId = navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            updateCurrentLocationMarker(latitude, longitude, accuracy);
        },
        (error) => {
            console.warn('Location tracking error:', error);
        },
        {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 30000
        }
    );
}

function updateCurrentLocationMarker(lat, lng, accuracy) {
    if (!isShowingCurrentLocation) return;
    
    // Update accuracy circle
    if (accuracyCircle) {
        accuracyCircle.setLatLng([lat, lng]);
        accuracyCircle.setRadius(accuracy);
    }
    
    // Update marker position
    if (currentLocationMarker) {
        currentLocationMarker.setLatLng([lat, lng]);
    }
}

function returnToCityCenter() {
    const locationBtn = document.getElementById('current-location-btn');
    
    // Stop location tracking
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
    
    // Return to city center
    if (currentCityCenter) {
        map.setView(currentCityCenter, 12, { animate: true, duration: 1 });
    }
    
    // Update button state
    locationBtn.classList.remove('active');
    locationBtn.innerHTML = '<i class="fas fa-location-arrow"></i>';
    
    isShowingCurrentLocation = false;
}

function handleGeolocationError(error) {
    let message = '';
    
    switch(error.code) {
        case error.PERMISSION_DENIED:
            message = 'Location access denied. Please enable location permissions.';
            break;
        case error.POSITION_UNAVAILABLE:
            message = 'Location information is unavailable.';
            break;
        case error.TIMEOUT:
            message = 'Location request timed out. Please try again.';
            break;
        default:
            message = 'An unknown error occurred while retrieving location.';
            break;
    }
    
    showToast(message, 'error');
}

function showToast(message, type = 'success') {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create new toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Hide and remove toast
    const duration = type === 'info' ? 5000 : 3000; // Info messages stay longer
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, duration);
}

// Load trip data from localStorage on app start
function loadTripFromStorage() {
    try {
        const savedTrip = localStorage.getItem('travel-planner-trip');
        if (savedTrip) {
            myTrip = JSON.parse(savedTrip);
            updateTripDisplay();
            updateButtonStates();
        }
    } catch (error) {
        console.error('Error loading trip from storage:', error);
        myTrip = [];
    }
}

// Save trip data to localStorage
function saveTripToStorage() {
    try {
        localStorage.setItem('travel-planner-trip', JSON.stringify(myTrip));
    } catch (error) {
        console.error('Error saving trip to storage:', error);
        showToast('Unable to save trip data', 'error');
    }
}

// Export trip as JSON
function exportTrip() {
    if (myTrip.length === 0) {
        showToast('No trip data to export', 'warning');
        return;
    }
    
    const tripData = {
        trip: myTrip,
        exportedAt: new Date().toISOString(),
        version: '1.0'
    };
    
    const dataStr = JSON.stringify(tripData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `my-trip-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showToast('Trip exported successfully!', 'success');
}

// Import trip from JSON
function importTrip(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const tripData = JSON.parse(e.target.result);
            if (tripData.trip && Array.isArray(tripData.trip)) {
                myTrip = tripData.trip;
                saveTripToStorage();
                updateTripDisplay();
                updateButtonStates();
                showToast('Trip imported successfully!', 'success');
            } else {
                showToast('Invalid trip file format', 'error');
            }
        } catch (error) {
            showToast('Error reading trip file', 'error');
        }
    };
    reader.readAsText(file);
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('SW registered: ', registration);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content available, show update notification
              showUpdateNotification();
            }
          });
        });
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Show update notification
function showUpdateNotification() {
  showToast('New version available! Refresh to update.', 'info');
}

// Add offline/online status indicators
window.addEventListener('online', () => {
  showToast('Back online!', 'success');
});

window.addEventListener('offline', () => {
  showToast('You are offline. Cached content will be used.', 'warning');
});