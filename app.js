// Dashboard State
let currentCategory = 'all';
let map;
let directionsService;
let directionsRenderer;
let markers = {
    sightseeing: [],
    food: [],
    drinks: []
};
let routePolylines = {}; // Store route polylines for each day
let openInfoWindows = []; // Track open info windows
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
let nearbyMarkers = [];
const NEARBY_RADIUS_KM = 5;
const CITY_MAX_DISTANCE_KM = 50;
const LOCATION_UPDATE_THRESHOLD_M = 200;

// Day Planner functionality variables
let cityDayPlans = {}; // Per-city day planning data
let currentActiveDayPlan = null;
let dayRoutePolylines = {}; // Map day numbers to polylines
let sortableInstances = {}; // Track sortable instances
let showAllRoutes = true;

// New route colors that avoid pin colors (red, purple, green)
const ROUTE_COLORS = [
    '#FF6B35', // Day 1 - Bright Orange
    '#00E5FF', // Day 2 - Electric Cyan
    '#1E88E5', // Day 3 - Bright Blue (changed from red #FF1744)
    '#FFD23F', // Day 4 - Golden Yellow
    '#06FFA5', // Day 5 - Mint Green
    '#FF9100', // Day 6 - Deep Orange
    '#E91E63', // Day 7 - Magenta
    '#00BCD4', // Day 8 - Teal
    '#FFC107', // Day 9 - Amber
    '#8BC34A', // Day 10 - Light Green
    '#FF5722', // Day 11 - Deep Orange Red
    '#00ACC1', // Day 12 - Dark Cyan
    '#F06292', // Day 13 - Light Pink
    '#FFEB3B', // Day 14 - Bright Yellow
    '#4CAF50', // Day 15 - Green (different from pin green)
    '#FF7043', // Day 16 - Orange Red
    '#26C6DA', // Day 17 - Light Cyan
    '#EC407A', // Day 18 - Pink
    '#FFCA28', // Day 19 - Orange Yellow
    '#66BB6A', // Day 20 - Light Green
    '#FF8A65', // Day 21 - Light Orange
    '#4DD0E1', // Day 22 - Cyan
    '#F48FB1', // Day 23 - Light Pink
    '#FFD54F', // Day 24 - Light Yellow
    '#81C784', // Day 25 - Soft Green
    '#FFAB91', // Day 26 - Peach
    '#80DEEA', // Day 27 - Light Cyan
    '#F8BBD9', // Day 28 - Very Light Pink
    '#FFF176', // Day 29 - Pale Yellow
    '#A5D6A7'  // Day 30 - Pale Green
];

// Replace DAY_COLORS with ROUTE_COLORS
const DAY_COLORS = ROUTE_COLORS;

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
    // This function is now empty - Google Maps will call initMap() instead
    console.log('Waiting for Google Maps to load...');
}

// New Google Maps initialization (this is the callback function)
function initMap() {
    console.log('Google Maps loaded, initializing...');
    
    // Initialize map centered on Copenhagen (adjust for your default city)
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: { lat: 55.6761, lng: 12.5683 }, // Copenhagen
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: [
            // Optional: Subtle dark theme to match your app
            {
                "featureType": "all",
                "elementType": "labels.text.fill",
                "stylers": [{"color": "#ffffff"}]
            },
            {
                "featureType": "all",
                "elementType": "labels.text.stroke",
                "stylers": [{"color": "#000000"}, {"lightness": 13}]
            }
        ]
    });

    // Initialize directions service
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true, // We'll use custom markers
        polylineOptions: {
            strokeWeight: 4,
            strokeOpacity: 0.8
        }
    });

    // Add click listener to remove highlights when clicking on map
    map.addListener('click', function() {
        removeAllHighlights();
        closeAllInfoWindows();
    });

    // Initialize other components
    initializeEventListeners();
    populateCityDropdown();
    loadCityFromFile('cities/Copenhagen.json');
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
    
    const originalTripPlanner = document.querySelector('.trip-planner');
    
    if (currentCategory === 'trip-planner') {
        // Show trip planner in content section, hide original
        document.getElementById('trip-planner-section').classList.add('active');
        if (originalTripPlanner) {
            originalTripPlanner.style.display = 'none';
        }
        loadTripPlannerContent();
    } else {
        // Show original trip planner at bottom, hide content section
        if (originalTripPlanner) {
            originalTripPlanner.style.display = 'block';
        }
        
        // Show appropriate content sections
        if (currentCategory === 'all') {
            document.getElementById('sightseeing-section').classList.add('active');
            document.getElementById('food-section').classList.add('active');
            document.getElementById('drinks-section').classList.add('active');
        } else if (currentCategory === 'tips') {
            document.getElementById('tips-section').classList.add('active');
        } else if (currentCategory === 'nearby') {
            document.getElementById('nearby-section').classList.add('active');
        } else {
            document.getElementById(`${currentCategory}-section`).classList.add('active');
        }
    }
}

function addMarkersToMap(cityData) {
    // Clear existing markers
    clearAllMarkers();

    // Add sightseeing markers (red)
    cityData.sightseeing.forEach(attraction => {
        const marker = new google.maps.Marker({
            position: { lat: attraction.location.lat, lng: attraction.location.lng },
            map: map,
            title: attraction.name,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#e74c3c',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
                scale: 8
            }
        });

        // Add info window
        const infoWindow = new google.maps.InfoWindow({
            content: createPopupContent(attraction, 'sightseeing')
        });

        marker.addListener('click', () => {
            closeAllInfoWindows();
            infoWindow.open(map, marker);
            openInfoWindows.push(infoWindow);
            highlightCard(`sightseeing-${attraction.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`);
        });

        // Close info window listener
        infoWindow.addListener('closeclick', () => {
            removeAllHighlights();
        });

        marker.venueId = `sightseeing-${attraction.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;
        marker.infoWindow = infoWindow;
        markers.sightseeing.push(marker);
    });

    // Add food markers (purple)
    cityData.food.forEach(restaurant => {
        const marker = new google.maps.Marker({
            position: { lat: restaurant.location.lat, lng: restaurant.location.lng },
            map: map,
            title: restaurant.name,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#9b59b6',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
                scale: 8
            }
        });

        const infoWindow = new google.maps.InfoWindow({
            content: createPopupContent(restaurant, 'food')
        });

        marker.addListener('click', () => {
            closeAllInfoWindows();
            infoWindow.open(map, marker);
            openInfoWindows.push(infoWindow);
            highlightCard(`food-${restaurant.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`);
        });

        infoWindow.addListener('closeclick', () => {
    removeAllHighlights();
        });

        marker.venueId = `food-${restaurant.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;
        marker.infoWindow = infoWindow;
        markers.food.push(marker);
    });

    // Add drinks markers (green)
    cityData.drinks.forEach(bar => {
        const marker = new google.maps.Marker({
            position: { lat: bar.location.lat, lng: bar.location.lng },
            map: map,
            title: bar.name,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#27ae60',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
                scale: 8
            }
        });

        const infoWindow = new google.maps.InfoWindow({
            content: createPopupContent(bar, 'drinks')
        });

        marker.addListener('click', () => {
            closeAllInfoWindows();
            infoWindow.open(map, marker);
            openInfoWindows.push(infoWindow);
            highlightCard(`drinks-${bar.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`);
        });

        infoWindow.addListener('closeclick', () => {
            removeAllHighlights();
        });

        marker.venueId = `drinks-${bar.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;
        marker.infoWindow = infoWindow;
        markers.drinks.push(marker);
    });
}

function createMarkerIcon(color) {
    const colors = {
        red: '#e74c3c',
        purple: '#9b59b6', 
        green: '#27ae60'
    };
    
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
            <circle cx="15" cy="15" r="12" fill="${colors[color]}" stroke="white" stroke-width="3"/>
        </svg>
    `)}`;
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
                <div class="tags-left">
                    ${(attraction.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
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
                <div class="tags-left">
                    ${(restaurant.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                ${bookingBadge}
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
                <div class="tags-left">
                    ${(bar.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                ${bookingBadge}
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
    const markerArray = markers[layerType];
    
    if (event.target.checked) {
        // Show markers
        markerArray.forEach(marker => {
            marker.setMap(map);
        });
    } else {
        // Hide markers
        markerArray.forEach(marker => {
            marker.setMap(null);
        });
    }
}

function highlightOnMap(venueId) {
    // Remove existing highlights
    removeAllHighlights();
    
    // Highlight selected card
    const card = document.querySelector(`[data-venue-id="${venueId}"]`);
    if (card) {
        card.classList.add('highlighted');
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // Find and open corresponding marker
    const allMarkers = [...markers.sightseeing, ...markers.food, ...markers.drinks];
    const marker = allMarkers.find(m => m.venueId === venueId);
    
    if (marker) {
        closeAllInfoWindows();
        marker.infoWindow.open(map, marker);
        openInfoWindows.push(marker.infoWindow);
        map.setCenter(marker.getPosition());
        map.setZoom(Math.max(map.getZoom(), 15));
    }
}

function removeAllHighlights() {
    document.querySelectorAll('.venue-card.highlighted').forEach(card => {
        card.classList.remove('highlighted');
    });
}

function closeAllInfoWindows() {
    openInfoWindows.forEach(infoWindow => infoWindow.close());
    openInfoWindows = [];
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

// COMPLETELY REWRITE updateTripDisplay to have flat structure
function updateTripDisplay() {
    const tripItems = document.getElementById('trip-items');
    if (!tripItems) return;
    
    if (myTrip.length === 0) {
        tripItems.innerHTML = '<div class="empty-state">No items in your trip yet. Click the heart icon on venues to add them!</div>';
        return;
    }
    
    // Create flat structure without nested groups
    let html = '';
    myTrip.forEach(item => {
        const typeIcon = getTypeIcon(item.type);
        html += `
            <div class="trip-item" data-venue-name="${item.name}" data-venue-type="${item.type}">
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
    
    // Add states for items in day plans
    if (window.cityData) {
        const cityName = window.cityData.name;
        const cityPlan = cityDayPlans[cityName];
        
        if (cityPlan && cityPlan.days) {
            // Collect all venues from all days
            const allDayVenues = [];
            for (const dayNumber in cityPlan.days) {
                allDayVenues.push(...cityPlan.days[dayNumber]);
            }
            
            // Update button states for day plan venues
            allDayVenues.forEach(item => {
                document.querySelectorAll(`[onclick*="${item.name}"]`).forEach(btn => {
                    if (btn.title === 'Add to trip') {
                        btn.classList.add('added');
                    }
                });
            });
        }
    }
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
    map.setCenter({ lat: currentCityCenter[0], lng: currentCityCenter[1] });
    map.setZoom(12);
    
    // Clear existing markers
    clearAllMarkers();
    
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
    console.log('Showing current location:', lat, lng, 'accuracy:', accuracy);
    
    // Remove existing markers
    if (currentLocationMarker) {
        currentLocationMarker.setMap(null);
    }
    if (accuracyCircle) {
        accuracyCircle.setMap(null);
    }
    
    // Create accuracy circle (Google Maps Circle)
    accuracyCircle = new google.maps.Circle({
        strokeColor: '#007AFF',
        strokeOpacity: 0.3,
        strokeWeight: 1,
        fillColor: '#007AFF',
        fillOpacity: 0.1,
        map: map,
        center: { lat: lat, lng: lng },
        radius: accuracy // radius in meters
    });
    
    // Create current location marker
    currentLocationMarker = new google.maps.Marker({
        position: { lat: lat, lng: lng },
        map: map,
        title: 'Your current location',
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#007AFF',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 3,
            scale: 8
        },
        zIndex: 1000
    });
    
    // Center map on current location
    map.setCenter({ lat: lat, lng: lng });
    map.setZoom(15);
    
    showToast('Current location found', 'success');
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
    console.log('Updating current location marker:', lat, lng);
    
    // Update accuracy circle
    if (accuracyCircle) {
        accuracyCircle.setCenter({ lat: lat, lng: lng });
        accuracyCircle.setRadius(accuracy);
    }
    
    // Update marker position
    if (currentLocationMarker) {
        currentLocationMarker.setPosition({ lat: lat, lng: lng });
    }
}

function returnToCityCenter() {
    const locationBtn = document.getElementById('current-location-btn');
    
    // Stop location tracking
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
    
    // Return to city center - FIXED for Google Maps
    if (currentCityCenter) {
        map.setCenter({ lat: currentCityCenter[0], lng: currentCityCenter[1] });
        map.setZoom(12);
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
    nearbyMode = false;
    
    // Clear nearby venues
    const nearbyGrid = document.getElementById('nearby-grid');
    if (nearbyGrid) {
        nearbyGrid.innerHTML = '';
    }
    
    // Remove nearby radius circle
    if (nearbyRadiusCircle) {
        nearbyRadiusCircle.setMap(null); // Fixed for Google Maps
        nearbyRadiusCircle = null;
    }
    
    // Remove current location marker and accuracy circle
    if (currentLocationMarker) {
        currentLocationMarker.setMap(null); // Fixed for Google Maps
        currentLocationMarker = null;
    }
    if (accuracyCircle) {
        accuracyCircle.setMap(null); // Fixed for Google Maps
        accuracyCircle = null;
    }
    
    // Stop location tracking
    if (locationWatchId) {
        navigator.geolocation.clearWatch(locationWatchId);
        locationWatchId = null;
    }
    
    // Update button state
    const locationBtn = document.getElementById('current-location-btn');
    if (locationBtn) {
        locationBtn.classList.remove('active');
    }
    
    // Show all venues again
    document.querySelectorAll('.venue-card').forEach(card => {
        card.style.display = 'block';
    });
    
    // Clear nearby status
    updateNearbyStatus('info', 'Nearby mode disabled');
    
    // Restore original map view
    returnToCityCenter();
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
    console.log('Showing current location marker only:', lat, lng);
    
    // Remove existing markers
    if (currentLocationMarker) {
        currentLocationMarker.setMap(null);
    }
    if (accuracyCircle) {
        accuracyCircle.setMap(null);
    }
    
    // Create accuracy circle
    accuracyCircle = new google.maps.Circle({
        strokeColor: '#007AFF',
        strokeOpacity: 0.3,
        strokeWeight: 1,
        fillColor: '#007AFF',
        fillOpacity: 0.1,
        map: map,
        center: { lat: lat, lng: lng },
        radius: accuracy
    });
    
    // Create current location marker
    currentLocationMarker = new google.maps.Marker({
        position: { lat: lat, lng: lng },
        map: map,
        title: 'Your current location',
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#007AFF',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 3,
            scale: 8
        },
        zIndex: 1000
    });
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

// Fix updateMapForNearbyMode function
function updateMapForNearbyMode(venues) {
    // Clear existing nearby markers
    clearNearbyMarkers();
    
    if (venues.length === 0) return;
    
    // Add markers for nearby venues
    venues.forEach(venue => {
        const color = venue.type === 'sightseeing' ? '#e74c3c' : 
                     venue.type === 'food' ? '#9b59b6' : '#27ae60';
        
        const marker = new google.maps.Marker({
            position: { lat: venue.location.lat, lng: venue.location.lng },
            map: map,
            title: venue.name,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: color,
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
                scale: 6
            }
        });
        
        // Add info window
        const infoWindow = new google.maps.InfoWindow({
            content: createPopupContent(venue, venue.type)
        });
        
        marker.addListener('click', () => {
            closeAllInfoWindows();
            infoWindow.open(map, marker);
            openInfoWindows.push(infoWindow);
        });
        
        nearbyMarkers.push(marker);
    });
    
    // Create radius circle around user location
    if (userLocation && !nearbyRadiusCircle) {
        nearbyRadiusCircle = new google.maps.Circle({
            strokeColor: '#007AFF',
            strokeOpacity: 0.5,
            strokeWeight: 2,
            fillColor: '#007AFF',
            fillOpacity: 0.1,
            map: map,
            center: { lat: userLocation.lat, lng: userLocation.lng },
            radius: nearbyRadius * 1000 // Convert km to meters
        });
    }
}

// Add helper function to clear nearby markers
function clearNearbyMarkers() {
    if (nearbyMarkers) {
        nearbyMarkers.forEach(marker => marker.setMap(null));
        nearbyMarkers = [];
    }
}

// Fix the createGeodesicCircle function (around line 1793)
function createGeodesicCircle(center, radiusMeters) {
    const points = [];
    const numPoints = 64;
    
    for (let i = 0; i < numPoints; i++) {
        const angle = (i * 360) / numPoints;
        const point = calculatePointAtDistance(center[0], center[1], radiusMeters, angle);
        points.push({ lat: point.lat, lng: point.lng });
    }
    
    return new google.maps.Polygon({
        paths: points,
        strokeColor: '#007bff',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#007bff',
        fillOpacity: 0.1,
        map: map
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
            <div class="day-container" data-day="${day}">
                <div class="day-header" onclick="toggleDayCollapse(${day})">
                    <div class="day-title">
                        <div class="day-badge day-${day}" style="background-color: ${dayColor}"></div>
                        <span>Day ${day} – ${formattedDate}</span>
                    </div>
                    <div class="day-controls">
                        <button class="optimize-btn" onclick="optimizeDay(${day}, event)" 
                                ${dayVenues.length < 2 ? 'disabled' : ''}>
                            <i class="fas fa-route"></i> Optimize Route
                        </button>
                        <button class="collapse-btn" onclick="event.stopPropagation(); toggleDayCollapse(${day})">
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
        animation: 150,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        forceFallback: false,
        fallbackOnBody: false,
        onAdd: function(evt) {
            // Handle items coming back from day plans
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
        animation: 150,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        forceFallback: false,
        fallbackOnBody: false,
        onAdd: function(evt) {
            // Handle items from trip or other days
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
    if (!dayPlan) return;
    
    const dayContent = dayPlan.querySelector('.day-content');
    const collapseBtn = dayPlan.querySelector('.collapse-btn');
    
    if (!dayContent || !collapseBtn) return;
    
    const isCollapsed = collapseBtn.classList.contains('collapsed');
    
    if (isCollapsed) {
        // Expand
        dayContent.style.display = 'block';
        collapseBtn.classList.remove('collapsed');
        collapseBtn.dataset.collapsed = 'false';
    } else {
        // Collapse
        dayContent.style.display = 'none';
        collapseBtn.classList.add('collapsed');
        collapseBtn.dataset.collapsed = 'true';
    }
}

// Draw route for a specific day
function drawDayRoute(dayNumber) {
    const cityName = window.cityData.name;
    const dayVenues = cityDayPlans[cityName]?.days[dayNumber] || [];
    
    if (dayVenues.length < 2) {
        // Clear existing route for this day
        if (routePolylines[dayNumber]) {
            routePolylines[dayNumber].setMap(null);
            delete routePolylines[dayNumber];
        }
        return;
    }

    // Create waypoints for Google Directions API
    const waypoints = [];
    const locations = [];
    
    dayVenues.forEach(venue => {
        const venueData = findVenueData(venue.name, venue.type);
        if (venueData && venueData.location) {
            locations.push({ lat: venueData.location.lat, lng: venueData.location.lng });
        }
    });

    if (locations.length < 2) return;

    const origin = locations[0];
    const destination = locations[locations.length - 1];
    const waypointsMiddle = locations.slice(1, -1).map(loc => ({
        location: loc,
        stopover: true
    }));

    const request = {
        origin: origin,
        destination: destination,
        waypoints: waypointsMiddle,
        travelMode: google.maps.TravelMode.WALKING,
        optimizeWaypoints: false // Keep user's order
    };

    directionsService.route(request, (result, status) => {
        if (status === 'OK') {
            // Clear existing route
            if (routePolylines[dayNumber]) {
                routePolylines[dayNumber].setMap(null);
            }

            // Create polyline with day-specific color
            const dayColor = ROUTE_COLORS[(dayNumber - 1) % ROUTE_COLORS.length];
            
            const polyline = new google.maps.Polyline({
                path: result.routes[0].overview_path,
                geodesic: true,
                strokeColor: dayColor,
                strokeOpacity: 0.8,
                strokeWeight: 4,
                map: map
            });

            routePolylines[dayNumber] = polyline;
        } else {
            console.error('Directions request failed:', status);
        }
    });
}

// Redraw all routes
function redrawAllRoutes() {
    if (!window.cityData) return;
    
    const cityName = window.cityData.name;
    const dayPlan = cityDayPlans[cityName];
    
    if (!dayPlan) return;
    
    // Clear existing routes - FIXED for Google Maps
    Object.values(routePolylines).forEach(polyline => {
        polyline.setMap(null);
    });
    routePolylines = {};
    
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
    Object.entries(routePolylines).forEach(([day, polyline]) => {
        const dayNum = parseInt(day);
        const opacity = showAllRoutes ? 0.8 : (currentActiveDayPlan === dayNum ? 0.8 : 0.3);
        
        // FIXED for Google Maps
        polyline.setOptions({ 
            strokeOpacity: opacity 
        });
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
        
        // Clear routes - FIXED for Google Maps
        Object.values(routePolylines).forEach(polyline => {
            polyline.setMap(null);
        });
        routePolylines = {};
        
        showToast('Day plan cleared', 'info');
    }
}

// Helper function to check if a venue is in any day plan
function isVenueInDayPlans(venueName, venueType) {
    if (!window.cityData) return false;
    
    const cityName = window.cityData.name;
    const cityPlan = cityDayPlans[cityName];
    
    if (!cityPlan || !cityPlan.days) return false;
    
    // Check all days for this venue
    for (const dayNumber in cityPlan.days) {
        const dayVenues = cityPlan.days[dayNumber];
        const found = dayVenues.find(venue => 
            venue.name === venueName && venue.type === venueType
        );
        if (found) return true;
    }
    
    return false;
}

// New function to load trip planner content
function loadTripPlannerContent() {
    const tripPlannerContent = document.getElementById('trip-planner-content');
    const originalTripPlanner = document.querySelector('.trip-planner');
    
    if (!tripPlannerContent || !originalTripPlanner) return;
    
    // Copy the HTML content (don't move the elements)
    tripPlannerContent.innerHTML = originalTripPlanner.innerHTML;
    
    // Re-initialize sortable for the copied content
    // We need to target the elements in the content section specifically
    const contentTripItems = tripPlannerContent.querySelector('#trip-items');
    if (contentTripItems) {
        // Temporarily change the ID to avoid conflicts
        contentTripItems.id = 'trip-items-content';
        
        // Initialize sortable for the content section trip items
        if (sortableInstances.sourceContent) {
            sortableInstances.sourceContent.destroy();
        }
        
        sortableInstances.sourceContent = new Sortable(contentTripItems, {
            group: {
                name: 'trip-planning-content',
                pull: true,
                put: true
            },
            sort: false,
            animation: 150,
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag',
            forceFallback: false,
            fallbackOnBody: false,
            onAdd: function(evt) {
                // Handle items coming back from day plans
                const venueName = evt.item.querySelector('.venue-item-name').textContent;
                const venueType = evt.item.querySelector('.venue-item-type').textContent;
                
                addToTrip(venueName, venueType);
                removeFromAllDayPlans(venueName, venueType);
                updateTripDisplay();
                // Also update the content section display
                loadTripPlannerContent();
            }
        });
    }
    
    // Re-initialize day sortables for content section if there are day plans
    if (window.cityData) {
        const cityName = window.cityData.name;
        const cityPlan = cityDayPlans[cityName];
        if (cityPlan && cityPlan.dayCount) {
            for (let day = 1; day <= cityPlan.dayCount; day++) {
                const dayVenues = tripPlannerContent.querySelector(`#day-${day}-venues`);
                if (dayVenues) {
                    // Temporarily change the ID to avoid conflicts
                    dayVenues.id = `day-${day}-venues-content`;
                    
                    if (sortableInstances[`day-${day}-content`]) {
                        sortableInstances[`day-${day}-content`].destroy();
                    }
                    
                    sortableInstances[`day-${day}-content`] = new Sortable(dayVenues, {
                        group: {
                            name: 'trip-planning-content',
                            pull: true,
                            put: true
                        },
                        animation: 150,
                        ghostClass: 'sortable-ghost',
                        chosenClass: 'sortable-chosen',
                        dragClass: 'sortable-drag',
                        forceFallback: false,
                        fallbackOnBody: false,
                        onAdd: function(evt) {
                            const venueName = evt.item.querySelector('.trip-item-name') 
                                ? evt.item.querySelector('.trip-item-name').textContent
                                : evt.item.querySelector('.venue-item-name').textContent;
                            const venueType = evt.item.querySelector('.trip-item-type')
                                ? evt.item.querySelector('.trip-item-type').textContent
                                : evt.item.querySelector('.venue-item-type').textContent;
                            
                            addVenueToDay(day, venueName, venueType);
                            removeFromTrip(venueName);
                            removeFromOtherDays(day, venueName, venueType);
                            
                            updateDayDisplay(day);
                            updateTripDisplay();
                            // Also update the content section display
                            loadTripPlannerContent();
                        },
                        onUpdate: function(evt) {
                            reorderDayVenues(day);
                            // Also update the content section display
                            loadTripPlannerContent();
                        }
                    });
                }
            }
        }
    }
}

// Function to update day legend
function updateDayLegend() {
    const legendContainer = document.getElementById('day-legend-items');
    if (!legendContainer) return;
    
    const cityName = window.cityData?.name;
    const cityPlan = cityDayPlans[cityName];
    
    if (!cityPlan || !cityPlan.dayCount) {
        legendContainer.innerHTML = '<div class="day-legend-empty">No day plans yet</div>';
        return;
    }
    
    let html = '';
    for (let day = 1; day <= cityPlan.dayCount; day++) {
        const color = ROUTE_COLORS[(day - 1) % ROUTE_COLORS.length];
        html += `
            <div class="day-legend-item">
                <div class="day-legend-color" style="background-color: ${color}"></div>
                <span>Day ${day}</span>
            </div>
        `;
    }
    
    legendContainer.innerHTML = html;
}

// Call updateDayLegend when day plans are generated/updated
// Add this to generateDayBins function and other relevant places

function clearAllMarkers() {
    // Clear all marker arrays
    markers.sightseeing.forEach(marker => marker.setMap(null));
    markers.food.forEach(marker => marker.setMap(null));
    markers.drinks.forEach(marker => marker.setMap(null));
    
    markers.sightseeing = [];
    markers.food = [];
    markers.drinks = [];
    
    closeAllInfoWindows();
}

function findVenueData(venueName, venueType) {
    if (!window.cityData) return null;
    
    const venueArrays = {
        'sightseeing': window.cityData.sightseeing,
        'food': window.cityData.food,
        'drinks': window.cityData.drinks
    };
    
    const venues = venueArrays[venueType] || [];
    return venues.find(venue => venue.name === venueName);
}