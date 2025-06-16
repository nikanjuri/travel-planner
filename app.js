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

// Auto-discovery: No more manual cityFiles array!
let cityFiles = []; // Will be populated automatically

// Near Me functionality variables
let nearbyMode = false;
let userLocation = null;
let nearbyWatchId = null;
let nearbyRadiusCircle = null;
const NEARBY_RADIUS_KM = 5;
const CITY_MAX_DISTANCE_KM = 50;
const LOCATION_UPDATE_THRESHOLD_M = 200;

// Day Planner functionality variables
let cityDayPlans = {}; // Per-city day planning data
let currentActiveDayPlan = null;
let dayRoutePolylines = {}; // Map day numbers to polylines
let sortableInstances = {}; // Track sortable instances
let showAllRoutes = true;

// Day route colors (matching CSS)
const DAY_COLORS = [
    '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e',
    '#ff69b4', '#00ced1', '#ffd700', '#8a2be2', '#ff6347', '#4169e1', '#32cd32', '#ff4500',
    '#da70d6', '#40e0d0', '#ffa500', '#6a5acd', '#20b2aa', '#ff1493', '#00bfff', '#adff2f',
    '#ff8c00', '#9370db', '#00fa9a', '#dc143c', '#4682b4', '#228b22'
];

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', async function() {
    initializeMap();
    initializeEventListeners();
    initializeCurrentLocation();
    initializeDayPlanner();

    // Auto-discover cities first
    await discoverCities();
    
    populateCityDropdown();
    loadTripFromStorage(); // Load saved trip data
    loadDayPlanFromStorage(); // Load saved day plans
    
    // Load the first city by default (if any cities found)
    if (cityFiles.length > 0) {
        loadCityFromFile(cityFiles[0].file);
    } else {
        showToast('No cities found. Please add city JSON files to the cities folder.', 'warning');
    }
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
    } else if (currentCategory === 'tips') {
        document.getElementById('tips-section').classList.add('active');
    } else if (currentCategory === 'nearby') {
        document.getElementById('nearby-section').classList.add('active');
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

    let distanceHtml = '';
    if (attraction.distance !== undefined) {
        const walkingTime = calculateWalkingTime(attraction.distance);
        distanceHtml = `
            <div class="venue-distance">
                <i class="fas fa-location-dot"></i>
                <div class="distance-info">
                    <span class="distance-km">${attraction.distance.toFixed(1)}km away</span>
                    <span class="walking-time">${walkingTime}</span>
                </div>
            </div>
        `;
    }

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
            ${distanceHtml}
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
    
    let distanceHtml = '';
    if (restaurant.distance !== undefined) {
        const walkingTime = calculateWalkingTime(restaurant.distance);
        distanceHtml = `
            <div class="venue-distance">
                <i class="fas fa-location-dot"></i>
                <div class="distance-info">
                    <span class="distance-km">${restaurant.distance.toFixed(1)}km away</span>
                    <span class="walking-time">${walkingTime}</span>
                </div>
            </div>
        `;
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
            ${distanceHtml}
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
    
    let distanceHtml = '';
    if (bar.distance !== undefined) {
        const walkingTime = calculateWalkingTime(bar.distance);
        distanceHtml = `
            <div class="venue-distance">
                <i class="fas fa-location-dot"></i>
                <div class="distance-info">
                    <span class="distance-km">${bar.distance.toFixed(1)}km away</span>
                    <span class="walking-time">${walkingTime}</span>
                </div>
            </div>
        `;
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
            ${distanceHtml}
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
    // Don't restart nearby mode if it's already active
    if (category === 'nearby' && nearbyMode) {
        // Just update the UI states without restarting nearby mode
        currentCategory = category;
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });
        showContentSections();
        return;
    }
    
    currentCategory = category;
    
    // Update filter button states
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
    });
    
    // Handle Near Me mode
    if (category === 'nearby') {
        startNearbyMode();
    } else {
        stopNearbyMode();
    }
    
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
        
        // Category filter - only apply if not showing all categories and not in nearby mode
        if (currentCategory !== 'all' && currentCategory !== 'nearby' && category !== currentCategory) {
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
    
    // Reinitialize sortable for trip source after content update
    initializeTripSourceSortable();
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
    const citySelect = document.getElementById('city-select');
    const previousValue = citySelect.dataset.currentCity || filename; // Track current city
    
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
            
            // Store the successfully loaded city
            citySelect.dataset.currentCity = filename;
            
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
            
            // Reset dropdown to the last successfully loaded city
            citySelect.value = previousValue;
        });
}

// Helper function to get filename from city name
function getCityFilename(cityName) {
    const cityFile = cityFiles.find(city => 
        city.label.toLowerCase() === cityName.toLowerCase()
    );
    return cityFile ? cityFile.file : null;
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
    
    // Load city day plan if it exists
    loadCityDayPlan(cityData.name);
    
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

// Auto-discover city JSON files
async function discoverCities() {
    try {
        // Method 1: Try to fetch a cities index file (most reliable)
        await tryIndexFile();
        
        if (cityFiles.length === 0) {
            // Method 2: Try directory listing
            await tryDirectoryListing();
        }
        
        if (cityFiles.length === 0) {
            // Method 3: Try known cities in cities folder
            await tryKnownCitiesInFolder();
        }
        
        console.log(`Discovered ${cityFiles.length} cities:`, cityFiles.map(c => c.label));
        
    } catch (error) {
        console.warn('Auto-discovery failed:', error);
        showToast('Failed to discover cities. Please check the cities folder.', 'error');
    }
}

// Method 1: Try to load a cities index file
async function tryIndexFile() {
    try {
        const response = await fetch('./cities/index.json');
        if (response.ok) {
            const citiesIndex = await response.json();
            cityFiles = citiesIndex.cities.map(city => ({
                file: `cities/${city.file}`,
                label: city.label,
                discovered: true
            }));
            console.log('Loaded cities from index file');
        }
    } catch (error) {
        // Index file doesn't exist, continue to next method
    }
}

// Method 2: Try directory listing (may not work on all servers)
async function tryDirectoryListing() {
    try {
        const response = await fetch('./cities/');
        const html = await response.text();
        
        const jsonFiles = extractJsonFilesFromHtml(html);
        
        if (jsonFiles.length > 0) {
            cityFiles = await processCityFiles(jsonFiles);
            console.log('Discovered cities via directory listing');
        }
    } catch (error) {
        // Directory listing not available
    }
}

// Method 3: Try known cities in cities folder
async function tryKnownCitiesInFolder() {
    const knownCities = ['Copenhagen', 'Stockholm', 'Paris', 'London', 'Tokyo', 'NewYork', 'Barcelona', 'Amsterdam', 'Berlin', 'Rome'];
    const cities = [];
    
    for (const cityName of knownCities) {
        try {
            const filename = `cities/${cityName}.json`;
            const response = await fetch(filename);
            
            if (response.ok) {
                const cityData = await response.json();
                cities.push({
                    file: filename,
                    label: cityData.name || cityName,
                    discovered: true
                });
            }
        } catch (error) {
            // City file doesn't exist, skip
        }
    }
    
    cityFiles = cities.sort((a, b) => a.label.localeCompare(b.label));
    if (cities.length > 0) {
        console.log('Found cities using known cities method');
    }
}

// Extract JSON files from directory listing HTML
function extractJsonFilesFromHtml(html) {
    const jsonFiles = [];
    const regex = /href="([^"]*\.json)"/gi;
    let match;
    
    while ((match = regex.exec(html)) !== null) {
        const filename = match[1];
        if (!filename.startsWith('.') && filename.endsWith('.json')) {
            jsonFiles.push(filename);
        }
    }
    
    return jsonFiles;
}

// Process discovered city files
async function processCityFiles(jsonFiles) {
    const cities = [];
    
    for (const filename of jsonFiles) {
        try {
            // Try to load the file to get the city name
            const response = await fetch(`./cities/${filename}`);
            const cityData = await response.json();
            
            cities.push({
                file: `cities/${filename}`,
                label: cityData.name || filename.replace('.json', ''),
                discovered: true
            });
        } catch (error) {
            console.warn(`Failed to load ${filename}:`, error);
            // Add with filename as fallback
            cities.push({
                file: `cities/${filename}`,
                label: filename.replace('.json', '').replace(/[-_]/g, ' '),
                discovered: false
            });
        }
    }
    
    return cities.sort((a, b) => a.label.localeCompare(b.label));
}

// Near Me Mode Functions
function startNearbyMode() {
    if (nearbyMode) return; // Already in nearby mode
    
    nearbyMode = true;
    updateNearbyStatus('loading', 'Finding venues near you...');
    
    // Request user location
    if (!navigator.geolocation) {
        updateNearbyStatus('error', 'Geolocation is not supported by this browser.');
        return;
    }
    
    // Get current position with high accuracy
    navigator.geolocation.getCurrentPosition(
        (position) => {
            userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy
            };
            
            handleLocationSuccess();
            startNearbyLocationTracking();
        },
        (error) => {
            handleLocationError(error);
        },
        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000
        }
    );
}

function stopNearbyMode() {
    if (!nearbyMode) return;
    
    nearbyMode = false;
    userLocation = null;
    
    // Stop location tracking
    if (nearbyWatchId) {
        navigator.geolocation.clearWatch(nearbyWatchId);
        nearbyWatchId = null;
    }
    
    // Remove radius circle from map
    if (nearbyRadiusCircle) {
        map.removeLayer(nearbyRadiusCircle);
        nearbyRadiusCircle = null;
    }
    
    // Clean up blue dot and accuracy circle (only if current location button is not active)
    if (!isShowingCurrentLocation) {
        if (currentLocationMarker) {
            map.removeLayer(currentLocationMarker);
            currentLocationMarker = null;
        }
        if (accuracyCircle) {
            map.removeLayer(accuracyCircle);
            accuracyCircle = null;
        }
    }
    
    // Return to city center view
    if (currentCityCenter) {
        map.setView(currentCityCenter, 12, { animate: true, duration: 1 });
    }
}

function startNearbyLocationTracking() {
    if (nearbyWatchId) {
        navigator.geolocation.clearWatch(nearbyWatchId);
    }
    
    nearbyWatchId = navigator.geolocation.watchPosition(
        (position) => {
            const newLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy
            };
            
            // Only update if location changed significantly
            if (userLocation && calculateDistance(
                userLocation.lat, userLocation.lng,
                newLocation.lat, newLocation.lng
            ) * 1000 < LOCATION_UPDATE_THRESHOLD_M) {
                return;
            }
            
            userLocation = newLocation;
            handleLocationSuccess();
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

// Create a new function that shows blue dot without zooming
function showCurrentLocationMarkerOnly(lat, lng, accuracy) {
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
    
    // Don't zoom - let the calling function handle zoom
}

function handleLocationSuccess() {
    if (!userLocation || !window.cityData) return;
    
    // Check if user is within reasonable distance of city
    const cityCenter = [window.cityData.center.lat, window.cityData.center.lng];
    const distanceToCity = calculateDistance(
        userLocation.lat, userLocation.lng,
        cityCenter[0], cityCenter[1]
    );
    
    if (distanceToCity > CITY_MAX_DISTANCE_KM) {
        updateNearbyStatus('warning', 
            `You're outside ${window.cityData.name} (${Math.round(distanceToCity)}km from city center)`
        );
        return;
    }
    
    // Find nearby venues
    const nearbyVenues = findNearbyVenues();
    
    if (nearbyVenues.length === 0) {
        updateNearbyStatus('empty', 'No venues within 5km of your location');
    } else {
        updateNearbyStatus('success', 
            `Found ${nearbyVenues.length} venues within 5km of your location`
        );
    }
    
    // Display nearby venues
    displayNearbyVenues(nearbyVenues);
    
    // Show blue dot without zooming (let updateMapForNearbyMode handle zoom)
    showCurrentLocationMarkerOnly(userLocation.lat, userLocation.lng, userLocation.accuracy);
    
    // Update map with proper zoom to show all nearby venues + user location
    updateMapForNearbyMode(nearbyVenues);
}

function handleLocationError(error) {
    let message = 'Unable to get your location.';
    
    switch (error.code) {
        case error.PERMISSION_DENIED:
            message = 'Location access denied. Enable location to use this feature.';
            break;
        case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable.';
            break;
        case error.TIMEOUT:
            message = 'Location request timed out. Please try again.';
            break;
    }
    
    updateNearbyStatus('error', message);
}

function findNearbyVenues() {
    if (!userLocation || !window.cityData) return [];
    
    const allVenues = [
        ...window.cityData.sightseeing.map(v => ({ ...v, type: 'sightseeing' })),
        ...window.cityData.food.map(v => ({ ...v, type: 'food' })),
        ...window.cityData.drinks.map(v => ({ ...v, type: 'drinks' }))
    ];
    
    return allVenues
        .map(venue => {
            const distance = calculateDistance(
                userLocation.lat, userLocation.lng,
                venue.location.lat, venue.location.lng
            );
            return { ...venue, distance };
        })
        .filter(venue => venue.distance <= NEARBY_RADIUS_KM)
        .sort((a, b) => a.distance - b.distance);
}

function displayNearbyVenues(venues) {
    const grid = document.getElementById('nearby-grid');
    if (!grid) return;
    
    if (venues.length === 0) {
        grid.innerHTML = '<div class="empty-state">No venues found within 5km of your location.</div>';
        return;
    }
    
    grid.innerHTML = venues.map(venue => {
        switch (venue.type) {
            case 'sightseeing':
                return createSightseeingCard(venue);
            case 'food':
                return createFoodCard(venue);
            case 'drinks':
                return createDrinksCard(venue);
            default:
                return '';
        }
    }).join('');
    
    // Update button states after rendering
    setTimeout(() => {
        updateButtonStates();
    }, 100);
}

function updateMapForNearbyMode(venues) {
    if (!userLocation) return;
    
    // Add radius circle
    if (nearbyRadiusCircle) {
        map.removeLayer(nearbyRadiusCircle);
    }
    
    // Create a more accurate geodesic circle
    nearbyRadiusCircle = createGeodesicCircle(
        [userLocation.lat, userLocation.lng], 
        NEARBY_RADIUS_KM * 1000
    ).addTo(map);
    
    // Auto-zoom to fit user location and nearby venues
    if (venues.length > 0) {
        const bounds = L.latLngBounds();
        bounds.extend([userLocation.lat, userLocation.lng]);
        venues.forEach(venue => {
            bounds.extend([venue.location.lat, venue.location.lng]);
        });
        map.fitBounds(bounds, { padding: [20, 20], animate: true, duration: 1 });
    } else {
        // Just center on user with appropriate zoom
        map.setView([userLocation.lat, userLocation.lng], 14, { animate: true, duration: 1 });
    }
}

// Create a geodesic circle for accurate distance representation
function createGeodesicCircle(center, radiusMeters) {
    const points = [];
    const numPoints = 64; // Number of points to create the circle
    
    for (let i = 0; i < numPoints; i++) {
        const angle = (i * 360) / numPoints;
        const point = calculatePointAtDistance(center[0], center[1], radiusMeters, angle);
        points.push([point.lat, point.lng]);
    }
    
    return L.polygon(points, {
        className: 'nearby-radius-circle',
        fillOpacity: 0.1,
        weight: 2,
        dashArray: '5, 5',
        color: '#007bff'
    });
}

// Calculate a point at a given distance and bearing from a center point
function calculatePointAtDistance(lat, lng, distanceMeters, bearingDegrees) {
    const R = 6371000; // Earth's radius in meters
    const φ1 = toRadians(lat);
    const λ1 = toRadians(lng);
    const δ = distanceMeters / R;
    const θ = toRadians(bearingDegrees);
    
    const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));
    const λ2 = λ1 + Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));
    
    return {
        lat: toDegrees(φ2),
        lng: toDegrees(λ2)
    };
}

function toDegrees(radians) {
    return radians * (180 / Math.PI);
}

function updateNearbyStatus(type, message) {
    const statusDiv = document.getElementById('nearby-status');
    if (!statusDiv) return;
    
    statusDiv.className = `nearby-status ${type}`;
    statusDiv.textContent = message;
}

// Distance calculation using Haversine formula
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

function calculateWalkingTime(distanceKm) {
    // Average walking speed: 5 km/h
    const walkingSpeedKmh = 5;
    const timeHours = distanceKm / walkingSpeedKmh;
    const timeMinutes = Math.round(timeHours * 60);
    
    if (timeMinutes < 1) return '< 1 min walk';
    if (timeMinutes === 1) return '1 min walk';
    return `${timeMinutes} min walk`;
}

// ============================================================================
// DAY PLANNER FUNCTIONALITY
// ============================================================================

// Initialize Day Planner
function initializeDayPlanner() {
    // Set default start date to today
    const today = new Date().toISOString().split('T')[0];
    const startDateInput = document.getElementById('trip-start-date');
    if (startDateInput) {
        startDateInput.value = today;
    }
    
    // Initialize event listeners
    const generateBtn = document.getElementById('generate-day-plan');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateDayPlan);
    }
    
    const showAllRoutesCheckbox = document.getElementById('show-all-routes');
    if (showAllRoutesCheckbox) {
        showAllRoutesCheckbox.addEventListener('change', toggleRouteDisplay);
    }
    
    // Initialize trip items as sortable source
    initializeTripSourceSortable();
}

// Generate day plan structure
function generateDayPlan() {
    const startDate = document.getElementById('trip-start-date').value;
    const dayCount = parseInt(document.getElementById('trip-day-count').value);
    
    if (!startDate) {
        showToast('Please select a start date', 'warning');
        return;
    }
    
    if (!window.cityData) {
        showToast('Please select a city first', 'warning');
        return;
    }
    
    const cityName = window.cityData.name;
    
    // Initialize city day plan if it doesn't exist
    if (!cityDayPlans[cityName]) {
        cityDayPlans[cityName] = {
            startDate: startDate,
            dayCount: dayCount,
            days: {}
        };
    } else {
        // Update existing plan
        cityDayPlans[cityName].startDate = startDate;
        cityDayPlans[cityName].dayCount = dayCount;
    }
    
    // Generate day bins
    generateDayBins(cityName, startDate, dayCount);
    saveDayPlanToStorage();
    
    showToast(`Generated ${dayCount}-day plan starting ${formatDate(startDate)}`, 'success');
}

// Generate day bins HTML structure
function generateDayBins(cityName, startDate, dayCount) {
    const container = document.getElementById('day-plans-container');
    if (!container) return;
    
    let html = '';
    
    for (let day = 1; day <= dayCount; day++) {
        const dayDate = new Date(startDate);
        dayDate.setDate(dayDate.getDate() + (day - 1));
        const formattedDate = formatDate(dayDate.toISOString().split('T')[0]);
        const dayColor = DAY_COLORS[(day - 1) % DAY_COLORS.length];
        
        // Get existing venues for this day
        const dayVenues = cityDayPlans[cityName].days[day] || [];
        
        html += `
            <div class="day-plan" data-day="${day}">
                <div class="day-header" onclick="toggleDayCollapse(${day})">
                    <div class="day-info">
                        <div class="day-badge day-${day}" style="background-color: ${dayColor}"></div>
                        <span class="day-title">Day ${day} – ${formattedDate}</span>
                    </div>
                    <div class="day-controls">
                        <button class="optimize-btn" onclick="optimizeDay(${day}, event)" 
                                ${dayVenues.length < 2 ? 'disabled' : ''}>
                            <i class="fas fa-route"></i> Optimize Route
                        </button>
                        <button class="collapse-btn" data-collapsed="false">
                            <i class="fas fa-chevron-down"></i>
                        </button>
                    </div>
                </div>
                <div class="day-content">
                    <div class="day-venues" data-day="${day}" id="day-${day}-venues">
                        ${dayVenues.length === 0 ? 
                            '<div class="empty-placeholder">Drop venues here to plan this day</div>' : 
                            generateDayVenuesHTML(dayVenues, day)
                        }
                    </div>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
    
    // Initialize sortable for each day
    for (let day = 1; day <= dayCount; day++) {
        initializeDaySortable(day);
    }
    
    // Redraw all routes
    redrawAllRoutes();
}

// Generate HTML for venues in a day
function generateDayVenuesHTML(venues, dayNumber) {
    return venues.map((venue, index) => {
        const icon = getTypeIcon(venue.type);
        return `
            <div class="day-venue-item" data-venue-name="${venue.name}" data-venue-type="${venue.type}">
                <div class="venue-item-info">
                    <span class="venue-item-icon">${icon}</span>
                    <span class="venue-item-name">${venue.name}</span>
                    <span class="venue-item-type">${venue.type}</span>
                </div>
                <div class="venue-item-order">${index + 1}</div>
            </div>
        `;
    }).join('');
}

// Initialize sortable for trip source - UPDATED VERSION
function initializeTripSourceSortable() {
    const tripItems = document.getElementById('trip-items');
    if (!tripItems) return;
    
    if (sortableInstances.source) {
        sortableInstances.source.destroy();
    }
    
    sortableInstances.source = new Sortable(tripItems, {
        group: {
            name: 'trip-planning',
            pull: true,
            put: true
        },
        sort: false,
        animation: 0,
        ghostClass: false,
        chosenClass: 'sortable-chosen',
        dragClass: false,
        forceFallback: false,
        fallbackOnBody: false,
        removeCloneOnHide: true,
        onAdd: function(evt) {
            const venueName = evt.item.querySelector('.venue-item-name').textContent;
            const venueType = evt.item.querySelector('.venue-item-type').textContent;
            
            addToTrip(venueName, venueType);
            removeFromAllDayPlans(venueName, venueType);
            updateTripDisplay();
        }
    });
}

// Initialize sortable for a specific day - FIXED VERSION
function initializeDaySortable(dayNumber) {
    const dayVenues = document.getElementById(`day-${dayNumber}-venues`);
    if (!dayVenues) return;
    
    if (sortableInstances[`day-${dayNumber}`]) {
        sortableInstances[`day-${dayNumber}`].destroy();
    }
    
    sortableInstances[`day-${dayNumber}`] = new Sortable(dayVenues, {
        group: {
            name: 'trip-planning',
            pull: true,
            put: true
        },
        animation: 0,
        ghostClass: false,
        chosenClass: 'sortable-chosen',
        dragClass: false,
        forceFallback: false,
        fallbackOnBody: false,
        removeCloneOnHide: true,
        onAdd: function(evt) {
            const venueName = evt.item.querySelector('.trip-item-name') 
                ? evt.item.querySelector('.trip-item-name').textContent
                : evt.item.querySelector('.venue-item-name').textContent;
            const venueType = evt.item.querySelector('.trip-item-type')
                ? evt.item.querySelector('.trip-item-type').textContent
                : evt.item.querySelector('.venue-item-type').textContent;
            
            addVenueToDay(dayNumber, venueName, venueType);
            removeFromTrip(venueName);
            removeFromOtherDays(dayNumber, venueName, venueType);
            
            updateDayDisplay(dayNumber);
            updateTripDisplay();
        },
        onUpdate: function(evt) {
            reorderDayVenues(dayNumber);
        }
    });
}

// Remove venue from all day plans
function removeFromAllDayPlans(venueName, venueType) {
    if (!window.cityData) return;
    
    const cityName = window.cityData.name;
    if (!cityDayPlans[cityName]) return;
    
    Object.keys(cityDayPlans[cityName].days).forEach(dayNumber => {
        const dayVenues = cityDayPlans[cityName].days[dayNumber];
        const venueIndex = dayVenues.findIndex(v => v.name === venueName && v.type === venueType);
        
        if (venueIndex !== -1) {
            cityDayPlans[cityName].days[dayNumber].splice(venueIndex, 1);
            updateDayDisplay(parseInt(dayNumber));
        }
    });
    
    saveDayPlanToStorage();
}

// Remove venue from other days (not current day)
function removeFromOtherDays(currentDay, venueName, venueType) {
    if (!window.cityData) return;
    
    const cityName = window.cityData.name;
    if (!cityDayPlans[cityName]) return;
    
    Object.keys(cityDayPlans[cityName].days).forEach(dayNumber => {
        if (parseInt(dayNumber) !== currentDay) {
            const dayVenues = cityDayPlans[cityName].days[dayNumber];
            const venueIndex = dayVenues.findIndex(v => v.name === venueName && v.type === venueType);
            
            if (venueIndex !== -1) {
                cityDayPlans[cityName].days[dayNumber].splice(venueIndex, 1);
                updateDayDisplay(parseInt(dayNumber));
            }
        }
    });
    
    saveDayPlanToStorage();
}

// Update day display without re-initializing sortable
function updateDayDisplayWithoutReinit(dayNumber) {
    if (!window.cityData) return;
    
    const cityName = window.cityData.name;
    const dayVenues = cityDayPlans[cityName].days[dayNumber] || [];
    
    // Update optimize button state
    const optimizeBtn = document.querySelector(`[onclick="optimizeDay(${dayNumber}, event)"]`);
    if (optimizeBtn) {
        optimizeBtn.disabled = dayVenues.length < 2;
    }
    
    // Redraw route for this day
    drawDayRoute(dayNumber);
    saveDayPlanToStorage();
}

// Reorder venues within a day without full re-initialization  
function reorderDayVenuesWithoutReinit(dayNumber) {
    if (!window.cityData) return;
    
    const cityName = window.cityData.name;
    const container = document.getElementById(`day-${dayNumber}-venues`);
    const venueItems = container.querySelectorAll('.day-venue-item');
    
    const reorderedVenues = [];
    venueItems.forEach(item => {
        const venueName = item.dataset.venueName;
        const venueType = item.dataset.venueType;
        
        // Find venue data
        const venue = cityDayPlans[cityName].days[dayNumber].find(
            v => v.name === venueName && v.type === venueType
        );
        
        if (venue) {
            reorderedVenues.push(venue);
        }
    });
    
    cityDayPlans[cityName].days[dayNumber] = reorderedVenues;
    updateDayDisplayWithoutReinit(dayNumber);
}

// Add venue to specific day
function addVenueToDay(dayNumber, venueName, venueType) {
    if (!window.cityData) return;
    
    const cityName = window.cityData.name;
    
    // Initialize day if it doesn't exist
    if (!cityDayPlans[cityName].days[dayNumber]) {
        cityDayPlans[cityName].days[dayNumber] = [];
    }
    
    // Find venue data
    let venueData = null;
    const allVenues = [
        ...window.cityData.sightseeing.map(v => ({ ...v, type: 'sightseeing' })),
        ...window.cityData.food.map(v => ({ ...v, type: 'food' })),
        ...window.cityData.drinks.map(v => ({ ...v, type: 'drinks' }))
    ];
    
    venueData = allVenues.find(v => v.name === venueName && v.type === venueType);
    
    if (venueData) {
        // Check if venue already exists in this day
        const existingIndex = cityDayPlans[cityName].days[dayNumber].findIndex(
            v => v.name === venueName && v.type === venueType
        );
        
        if (existingIndex === -1) {
            cityDayPlans[cityName].days[dayNumber].push(venueData);
            saveDayPlanToStorage();
        }
    }
}

// Update day display after changes
function updateDayDisplay(dayNumber) {
    if (!window.cityData) return;
    
    const cityName = window.cityData.name;
    const dayVenues = cityDayPlans[cityName].days[dayNumber] || [];
    const container = document.getElementById(`day-${dayNumber}-venues`);
    
    if (!container) return;
    
    if (dayVenues.length === 0) {
        container.innerHTML = '<div class="empty-placeholder">Drop venues here to plan this day</div>';
    } else {
        container.innerHTML = generateDayVenuesHTML(dayVenues, dayNumber);
        
        // Re-initialize sortable for this day
        initializeDaySortable(dayNumber);
    }
    
    // Update optimize button state
    const optimizeBtn = document.querySelector(`[onclick="optimizeDay(${dayNumber}, event)"]`);
    if (optimizeBtn) {
        optimizeBtn.disabled = dayVenues.length < 2;
    }
    
    // Redraw route for this day
    drawDayRoute(dayNumber);
    saveDayPlanToStorage();
}

// Reorder venues within a day based on DOM order
function reorderDayVenues(dayNumber) {
    if (!window.cityData) return;
    
    const cityName = window.cityData.name;
    const container = document.getElementById(`day-${dayNumber}-venues`);
    const venueItems = container.querySelectorAll('.day-venue-item');
    
    const reorderedVenues = [];
    venueItems.forEach(item => {
        const venueName = item.dataset.venueName;
        const venueType = item.dataset.venueType;
        
        // Find venue data
        const venue = cityDayPlans[cityName].days[dayNumber].find(
            v => v.name === venueName && v.type === venueType
        );
        
        if (venue) {
            reorderedVenues.push(venue);
        }
    });
    
    cityDayPlans[cityName].days[dayNumber] = reorderedVenues;
    updateDayDisplay(dayNumber);
}

// Optimize route for a specific day
function optimizeDay(dayNumber, event) {
    event.stopPropagation();
    
    if (!window.cityData) return;
    
    const cityName = window.cityData.name;
    const dayVenues = cityDayPlans[cityName].days[dayNumber] || [];
    
    if (dayVenues.length < 2) return;
    
    // Apply nearest neighbor algorithm
    const optimizedVenues = optimizeRouteNearestNeighbor(dayVenues);
    cityDayPlans[cityName].days[dayNumber] = optimizedVenues;
    
    updateDayDisplay(dayNumber);
    showToast(`Optimized route for Day ${dayNumber}`, 'success');
}

// Nearest neighbor route optimization
function optimizeRouteNearestNeighbor(venues) {
    if (venues.length <= 1) return venues;
    
    const optimized = [];
    const remaining = [...venues];
    
    // Start with the first venue
    let current = remaining.shift();
    optimized.push(current);
    
    // Find nearest unvisited venue
    while (remaining.length > 0) {
        let nearestIndex = 0;
        let nearestDistance = calculateDistance(
            current.location.lat, current.location.lng,
            remaining[0].location.lat, remaining[0].location.lng
        );
        
        for (let i = 1; i < remaining.length; i++) {
            const distance = calculateDistance(
                current.location.lat, current.location.lng,
                remaining[i].location.lat, remaining[i].location.lng
            );
            
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestIndex = i;
            }
        }
        
        current = remaining.splice(nearestIndex, 1)[0];
        optimized.push(current);
    }
    
    return optimized;
}

// Toggle day collapse
function toggleDayCollapse(dayNumber) {
    const dayPlan = document.querySelector(`[data-day="${dayNumber}"]`);
    const collapseBtn = dayPlan.querySelector('.collapse-btn');
    const isCollapsed = collapseBtn.dataset.collapsed === 'true';
    
    if (isCollapsed) {
        dayPlan.classList.remove('collapsed');
        collapseBtn.dataset.collapsed = 'false';
        collapseBtn.classList.remove('collapsed');
    } else {
        dayPlan.classList.add('collapsed');
        collapseBtn.dataset.collapsed = 'true';
        collapseBtn.classList.add('collapsed');
    }
}

// Draw route for a specific day
function drawDayRoute(dayNumber) {
    if (!window.cityData) return;
    
    const cityName = window.cityData.name;
    const dayVenues = cityDayPlans[cityName].days[dayNumber] || [];
    
    // Remove existing route
    if (dayRoutePolylines[dayNumber]) {
        map.removeLayer(dayRoutePolylines[dayNumber]);
        delete dayRoutePolylines[dayNumber];
    }
    
    if (dayVenues.length < 2) return;
    
    // Create route coordinates
    const coordinates = dayVenues.map(venue => [venue.location.lat, venue.location.lng]);
    const dayColor = DAY_COLORS[(dayNumber - 1) % DAY_COLORS.length];
    
    // Create polyline
    const polyline = L.polyline(coordinates, {
        color: dayColor,
        weight: 4,
        opacity: showAllRoutes ? 0.8 : (currentActiveDayPlan === dayNumber ? 0.8 : 0.3),
        dashArray: '10, 5'
    }).addTo(map);
    
    dayRoutePolylines[dayNumber] = polyline;
    
    // Add click handler to highlight day
    polyline.on('click', () => {
        highlightDay(dayNumber);
    });
}

// Redraw all routes
function redrawAllRoutes() {
    if (!window.cityData) return;
    
    const cityName = window.cityData.name;
    const dayPlan = cityDayPlans[cityName];
    
    if (!dayPlan) return;
    
    // Clear existing routes
    Object.values(dayRoutePolylines).forEach(polyline => {
        map.removeLayer(polyline);
    });
    dayRoutePolylines = {};
    
    // Redraw all day routes
    for (let day = 1; day <= dayPlan.dayCount; day++) {
        drawDayRoute(day);
    }
}

// Highlight specific day
function highlightDay(dayNumber) {
    // Remove previous highlights
    document.querySelectorAll('.day-plan').forEach(plan => {
        plan.classList.remove('active');
    });
    
    // Highlight selected day
    const dayPlan = document.querySelector(`[data-day="${dayNumber}"]`);
    if (dayPlan) {
        dayPlan.classList.add('active');
        dayPlan.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    currentActiveDayPlan = dayNumber;
    
    // Update route visibility
    updateRouteVisibility();
}

// Update route visibility based on settings
function updateRouteVisibility() {
    Object.entries(dayRoutePolylines).forEach(([day, polyline]) => {
        const dayNum = parseInt(day);
        const opacity = showAllRoutes ? 0.8 : (currentActiveDayPlan === dayNum ? 0.8 : 0.3);
        polyline.setStyle({ opacity });
    });
}

// Toggle route display
function toggleRouteDisplay() {
    const checkbox = document.getElementById('show-all-routes');
    showAllRoutes = checkbox.checked;
    updateRouteVisibility();
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { month: 'long', day: 'numeric' };
    const suffix = getOrdinalSuffix(date.getDate());
    return date.toLocaleDateString('en-US', options).replace(/\d+/, date.getDate() + suffix);
}

// Get ordinal suffix for date
function getOrdinalSuffix(day) {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
}

// Save day plan to localStorage
function saveDayPlanToStorage() {
    try {
        localStorage.setItem('travel-planner-day-plans', JSON.stringify(cityDayPlans));
    } catch (error) {
        console.error('Error saving day plans to storage:', error);
        showToast('Unable to save day plan data', 'error');
    }
}

// Load day plan from localStorage
function loadDayPlanFromStorage() {
    try {
        const savedPlans = localStorage.getItem('travel-planner-day-plans');
        if (savedPlans) {
            cityDayPlans = JSON.parse(savedPlans);
        }
    } catch (error) {
        console.error('Error loading day plans from storage:', error);
        cityDayPlans = {};
    }
}

// Load city day plan when city changes
function loadCityDayPlan(cityName) {
    const dayPlan = cityDayPlans[cityName];
    if (!dayPlan) return;
    
    // Update form controls
    const startDateInput = document.getElementById('trip-start-date');
    const dayCountSelect = document.getElementById('trip-day-count');
    
    if (startDateInput) startDateInput.value = dayPlan.startDate;
    if (dayCountSelect) dayCountSelect.value = dayPlan.dayCount;
    
    // Generate day bins
    generateDayBins(cityName, dayPlan.startDate, dayPlan.dayCount);
}

// Clear day plan for current city
function clearDayPlan() {
    if (!window.cityData) return;
    
    const cityName = window.cityData.name;
    if (cityDayPlans[cityName]) {
        delete cityDayPlans[cityName];
        saveDayPlanToStorage();
        
        // Clear display
        const container = document.getElementById('day-plans-container');
        if (container) {
            container.innerHTML = '';
        }
        
        // Clear routes
        Object.values(dayRoutePolylines).forEach(polyline => {
            map.removeLayer(polyline);
        });
        dayRoutePolylines = {};
        
        showToast('Day plan cleared', 'info');
    }
}