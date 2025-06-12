
// Dashboard State
let currentCity = 'copenhagen';
let currentCategory = 'all';
let map = null;
let markers = {};
let myTrip = [];

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    initializeEventListeners();

    fetch('travel_dashboard_data.json')
  .then(response => response.text()) // TEMP: read as text
  .then(text => {
    console.log('Raw response:', text); // Show what's actually coming in

    try {
      const data = JSON.parse(text); // Manually try parsing
      window.travelData = data;
      loadCity('copenhagen');
      updateTripDisplay();
    } catch (jsonErr) {
      console.error("❌ JSON parse failed:", jsonErr.message);
      alert("JSON file is found but has a parse error.");
    }
  })
  .catch(err => {
    console.error('❌ Failed to fetch travel data:', err);
    alert('Could not load travel data.');
  });
});

// Map Initialization
function initializeMap() {
    map = L.map('map').setView([55.6761, 12.5683], 12);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    markers = {
        attractions: L.layerGroup().addTo(map),
        restaurants: L.layerGroup().addTo(map),
        bars: L.layerGroup().addTo(map)
    };
}

// Event Listeners
function initializeEventListeners() {
    // City tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const city = btn.dataset.city;
            switchCity(city);
        });
    });
    
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
    const layerControls = ['attractions-layer', 'restaurants-layer', 'bars-layer'];
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

// City Management
function switchCity(cityName) {
    currentCity = cityName;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.city === cityName);
    });
    
    loadCity(cityName);
}

function loadCity(cityName) {
    const cityData = window.travelData.cities.find(city => city.name.toLowerCase() === cityName);
    if (!cityData) {
        console.error('City not found:', cityName);
        return;
    }
    
    // Update map center
    map.setView([cityData.center.lat, cityData.center.lng], 12);
    
    // Clear existing markers
    Object.values(markers).forEach(layer => layer.clearLayers());
    
    // Add new markers
    addMarkersToMap(cityData);
    
    // Load content sections
    loadAttractions(cityData.attractions);
    loadRestaurants(cityData.restaurants);
    loadBars(cityData.bars);
    loadItinerary(cityData.itinerary);
    loadLocalTips(cityName);
    
    // Clear search and price filters
    const searchInput = document.getElementById('search-input');
    const priceFilter = document.getElementById('price-filter');
    if (searchInput) searchInput.value = '';
    if (priceFilter) priceFilter.value = 'all';
    
    // Show appropriate sections based on current category
    showContentSections();
    
    // Apply current filters
    setTimeout(() => {
        applyFilters();
    }, 100);
}

// Show/Hide Content Sections
function showContentSections() {
    // First hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show sections based on current category
    if (currentCategory === 'all') {
        // Show all venue sections
        document.getElementById('attractions-section').classList.add('active');
        document.getElementById('restaurants-section').classList.add('active');
        document.getElementById('bars-section').classList.add('active');
    } else {
        // Show specific section
        const sectionId = currentCategory === 'tips' ? 'tips-section' : `${currentCategory}-section`;
        const section = document.getElementById(sectionId);
        if (section) section.classList.add('active');
    }
}

// Map Markers
function addMarkersToMap(cityData) {
    // Attractions (red markers)
    cityData.attractions.forEach(attraction => {
        const marker = L.marker([attraction.location.lat, attraction.location.lng], {
            icon: createCustomIcon('red')
        }).bindPopup(createPopupContent(attraction, 'attraction'));
        
        marker.venueId = `attraction-${attraction.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;
        markers.attractions.addLayer(marker);
    });
    
    // Restaurants (blue markers)
    cityData.restaurants.forEach(restaurant => {
        const marker = L.marker([restaurant.location.lat, restaurant.location.lng], {
            icon: createCustomIcon('blue')
        }).bindPopup(createPopupContent(restaurant, 'restaurant'));
        
        marker.venueId = `restaurant-${restaurant.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;
        markers.restaurants.addLayer(marker);
    });
    
    // Bars (green markers)
    cityData.bars.forEach(bar => {
        const marker = L.marker([bar.location.lat, bar.location.lng], {
            icon: createCustomIcon('green')
        }).bindPopup(createPopupContent(bar, 'bar'));
        
        marker.venueId = `bar-${bar.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;
        markers.bars.addLayer(marker);
    });
}

function createCustomIcon(color) {
    const colorMap = {
        red: '#e74c3c',
        blue: '#3498db',
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
    let content = `<div class="map-popup">
        <h4>${venue.name}</h4>
        <p>${venue.description}</p>`;
    
    if (venue.opening_hours) content += `<p><strong>Hours:</strong> ${venue.opening_hours}</p>`;
    if (venue.entry_fee) content += `<p><strong>Fee:</strong> ${venue.entry_fee}</p>`;
    if (venue.price_range) content += `<p><strong>Price:</strong> ${venue.price_range}</p>`;
    
    content += `</div>`;
    return content;
}

// Content Loading
function loadAttractions(attractions) {
    const grid = document.getElementById('attractions-grid');
    if (grid) {
        grid.innerHTML = attractions.map(attraction => createAttractionCard(attraction)).join('');
    }
}

function loadRestaurants(restaurants) {
    const grid = document.getElementById('restaurants-grid');
    if (grid) {
        grid.innerHTML = restaurants.map(restaurant => createRestaurantCard(restaurant)).join('');
    }
}

function loadBars(bars) {
    const grid = document.getElementById('bars-grid');
    if (grid) {
        grid.innerHTML = bars.map(bar => createBarCard(bar)).join('');
    }
}

function loadItinerary(itinerary) {
    const content = document.getElementById('itinerary-content');
    if (content) {
        content.innerHTML = itinerary.map(day => createItineraryDay(day)).join('');
    }
}

function loadLocalTips(cityName) {
    const content = document.getElementById('tips-content');
    const tips = (window.travelData.cities.find(c => c.name.toLowerCase() === cityName) || {}).local_tips;
    
    if (content && tips) {
        content.innerHTML = `
            <div class="tips-grid">
                <div class="tip-card">
                    <div class="tip-title">
                        <i class="fas fa-bus"></i>
                        Transportation
                    </div>
                    <div class="tip-content">${tips.transportation}</div>
                </div>
                <div class="tip-card">
                    <div class="tip-title">
                        <i class="fas fa-heart"></i>
                        Culture
                    </div>
                    <div class="tip-content">${tips.culture}</div>
                </div>
                <div class="tip-card">
                    <div class="tip-title">
                        <i class="fas fa-phone"></i>
                        Emergency Info
                    </div>
                    <div class="tip-content">${tips.emergency}</div>
                </div>
            </div>
        `;
    }
}

// Card Creation Functions
function createAttractionCard(attraction) {
    const id = `attraction-${attraction.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;
    const fee = attraction.entry_fee || '';
    const priceCategory = fee === 'Free' || fee === 'Free to explore' ? 'free' :
                         (fee.includes('€') || fee.includes('SEK')) ? '$$' : '$';
    
    return `
        <div class="venue-card" data-venue-id="${id}" data-category="attractions" data-price="${priceCategory}">
            <div class="venue-header">
                <h3 class="venue-name">${attraction.name}</h3>
                <div class="venue-actions">
                    <button class="action-btn" onclick="highlightOnMap('${id}')" title="Show on map">
                        <i class="fas fa-map-marker-alt"></i>
                    </button>
                    <button class="action-btn" onclick="addToTrip('${attraction.name}', 'attraction')" title="Add to trip">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
            </div>
            <p class="venue-description">${attraction.description}</p>
            <div class="venue-details">
                <div class="detail-item">
                    <span class="detail-label">Hours:</span>
                    <span class="detail-value">${attraction.opening_hours || ''}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Fee:</span>
                    <span class="detail-value">${attraction.entry_fee || ''}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Duration:</span>
                    <span class="detail-value">${attraction.duration || ''}</span>
                </div>
            </div>
            <div class="venue-tags">
                ${attraction.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        </div>
    `;
}

function createRestaurantCard(restaurant) {
    const id = `restaurant-${restaurant.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;
    // Show booking badge if booking_required is true
    const bookingBadge = restaurant.booking_required ? '<div class="booking-badge essential">Booking Essential</div>' : '';
    // Optionally show rating if present
    const ratingDisplay = restaurant.rating ? `
        <div class="detail-item">
            <span class="detail-label">Rating:</span>
            <span class="detail-value">${restaurant.rating}</span>
        </div>
    ` : '';

    return `
        <div class="venue-card" data-venue-id="${id}" data-category="restaurants" data-price="${restaurant.price_range}">
            ${bookingBadge}
            <div class="venue-header">
                <h3 class="venue-name">${restaurant.name}</h3>
                <div class="venue-actions">
                    <button class="action-btn" onclick="highlightOnMap('${id}')" title="Show on map">
                        <i class="fas fa-map-marker-alt"></i>
                    </button>
                    <button class="action-btn" onclick="addToTrip('${restaurant.name}', 'restaurant')" title="Add to trip">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
            </div>
            <p class="venue-description">${restaurant.description}</p>
            <div class="venue-details">
                <div class="detail-item">
                    <span class="detail-label">Cuisine:</span>
                    <span class="detail-value">${restaurant.cuisine}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Price:</span>
                    <span class="detail-value">${restaurant.price_range}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Hours:</span>
                    <span class="detail-value">${restaurant.opening_hours}</span>
                </div>
                ${ratingDisplay}
            </div>
            <div class="venue-tags">
                ${restaurant.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        </div>
    `;
}

function createBarCard(bar) {
    const id = `bar-${bar.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;
    
    return `
        <div class="venue-card" data-venue-id="${id}" data-category="bars" data-price="${bar.price_range || '$$'}">
            <div class="venue-header">
                <h3 class="venue-name">${bar.name}</h3>
                <div class="venue-actions">
                    <button class="action-btn" onclick="highlightOnMap('${id}')" title="Show on map">
                        <i class="fas fa-map-marker-alt"></i>
                    </button>
                    <button class="action-btn" onclick="addToTrip('${bar.name}', 'bar')" title="Add to trip">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
            </div>
            <p class="venue-description">${bar.description}</p>
            <div class="venue-details">
                <div class="detail-item">
                    <span class="detail-label">Type:</span>
                    <span class="detail-value">${bar.type}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Hours:</span>
                    <span class="detail-value">${bar.opening_hours || ''}</span>
                </div>
                ${bar.dressCode ? `
                <div class="detail-item">
                    <span class="detail-label">Dress Code:</span>
                    <span class="detail-value">${bar.dressCode}</span>
                </div>
                ` : ''}
                ${bar.price_range ? `
                <div class="detail-item">
                    <span class="detail-label">Price:</span>
                    <span class="detail-value">${bar.price_range}</span>
                </div>
                ` : ''}
            </div>
            <div class="venue-tags">
                ${bar.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        </div>
    `;
}

function createItineraryDay(day) {
    return `
        <div class="itinerary-day">
            <h3 class="day-title">${day.day}</h3>
            <div class="activities-timeline">
                ${day.activities.map(activity => `
                    <div class="activity-item">
                        <div class="activity-time">${activity.time}</div>
                        <div class="activity-name">${activity.activity}</div>
                        <div class="activity-duration">${activity.duration}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Category Management
function switchCategory(category) {
    currentCategory = category;
    
    // Update filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
    });
    
    // Show appropriate content sections
    showContentSections();
    
    // Apply filters
    applyFilters();
}

// Filtering
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
                map.setView(marker.getLatLng(), 15);
                marker.openPopup();
            }
        });
    });
}

// Trip Planning
function addToTrip(venueName, venueType) {
    const existingItem = myTrip.find(item => item.name === venueName);
    if (existingItem) return;
    
    myTrip.push({ name: venueName, type: venueType });
    updateTripDisplay();
    
    // Update button state - find all buttons with this venue name
    document.querySelectorAll('.action-btn').forEach(btn => {
        const onclickValue = btn.getAttribute('onclick');
        if (onclickValue && onclickValue.includes(`addToTrip('${venueName}'`)) {
            btn.classList.add('added');
            btn.innerHTML = '<i class="fas fa-check"></i>';
        }
    });
}

function removeFromTrip(venueName) {
    myTrip = myTrip.filter(item => item.name !== venueName);
    updateTripDisplay();
    
    // Update button state
    document.querySelectorAll('.action-btn').forEach(btn => {
        const onclickValue = btn.getAttribute('onclick');
        if (onclickValue && onclickValue.includes(`addToTrip('${venueName}'`)) {
            btn.classList.remove('added');
            btn.innerHTML = '<i class="fas fa-heart"></i>';
        }
    });
}

function clearTrip() {
    myTrip = [];
    updateTripDisplay();
    
    // Reset all buttons
    document.querySelectorAll('.action-btn').forEach(btn => {
        const onclickValue = btn.getAttribute('onclick');
        if (onclickValue && onclickValue.includes('addToTrip')) {
            btn.classList.remove('added');
            btn.innerHTML = '<i class="fas fa-heart"></i>';
        }
    });
}

function updateTripDisplay() {
    const container = document.getElementById('trip-items');
    
    if (!container) return;
    
    if (myTrip.length === 0) {
        container.innerHTML = '<div class="empty-state">No items in your trip yet</div>';
        return;
    }
    
    container.innerHTML = myTrip.map(item => `
        <div class="trip-item">
            <span class="trip-item-name">${item.name}</span>
            <button class="remove-item" onclick="removeFromTrip('${item.name}')" title="Remove from trip">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}