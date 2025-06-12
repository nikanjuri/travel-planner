// Dashboard State
let currentCategory = 'all';
let map = null;
let markers = {};
let myTrip = [];

// Utility: List of city JSON files (add more as needed)
const cityFiles = [
    { file: 'Copenhagen.json', label: 'Copenhagen' },
    { file: 'Stockholm.json', label: 'Stockholm' }
];

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    initializeEventListeners();

    populateCityDropdown();

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
        attractions: L.layerGroup().addTo(map),
        restaurants: L.layerGroup().addTo(map),
        bars: L.layerGroup().addTo(map)
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
        html: `<span style="background:${colorMap[color]};" class="marker-dot"></span>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
    });
}

function createPopupContent(venue, type) {
    let price = '';
    if (type === 'restaurant' || type === 'bar') {
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

function loadAttractions(attractions) {
    const grid = document.getElementById('attractions-grid');
    if (!grid) return;
    grid.innerHTML = attractions.map(createAttractionCard).join('');
}

function loadRestaurants(restaurants) {
    const grid = document.getElementById('restaurants-grid');
    if (!grid) return;
    grid.innerHTML = restaurants.map(createRestaurantCard).join('');
}

function loadBars(bars) {
    const grid = document.getElementById('bars-grid');
    if (!grid) return;
    grid.innerHTML = bars.map(createBarCard).join('');
}

function loadLocalTips(cityName) {
    const tipsSection = document.getElementById('tips-content');
    if (!tipsSection) return;
    const tips = window.cityData.local_tips;
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

function createAttractionCard(attraction) {
    return `
        <div class="venue-card" data-category="attractions" data-price="${attraction.entry_fee || ''}" data-venue-id="attraction-${attraction.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}">
            <h3>${attraction.name}</h3>
            <div class="venue-desc">${attraction.description || ''}</div>
            <div class="venue-meta">
                <span class="venue-rating">Rating: ${attraction.rating ? attraction.rating : 'N/A'}</span>
                ${attraction.website ? `<a href="${attraction.website}" target="_blank">Website</a>` : ''}
            </div>
            <button class="action-btn" onclick="addToTrip('${attraction.name}', 'attraction')"><i class="fas fa-heart"></i></button>
        </div>
    `;
}

function createRestaurantCard(restaurant) {
    return `
        <div class="venue-card" data-category="restaurants" data-price="${restaurant.price_range || ''}" data-venue-id="restaurant-${restaurant.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}">
            <h3>${restaurant.name}</h3>
            <div class="venue-desc">${restaurant.description || ''}</div>
            <div class="venue-meta">
                <span class="venue-rating">Rating: ${restaurant.rating ? restaurant.rating : 'N/A'}</span>
                ${restaurant.website ? `<a href="${restaurant.website}" target="_blank">Website</a>` : ''}
            </div>
            <button class="action-btn" onclick="addToTrip('${restaurant.name}', 'restaurant')"><i class="fas fa-heart"></i></button>
        </div>
    `;
}

function createBarCard(bar) {
    return `
        <div class="venue-card" data-category="bars" data-price="${bar.price_range || ''}" data-venue-id="bar-${bar.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}">
            <h3>${bar.name}</h3>
            <div class="venue-desc">${bar.description || ''}</div>
            <div class="venue-meta">
                <span class="venue-rating">Rating: ${bar.rating ? bar.rating : 'N/A'}</span>
                ${bar.website ? `<a href="${bar.website}" target="_blank">Website</a>` : ''}
            </div>
            <button class="action-btn" onclick="addToTrip('${bar.name}', 'bar')"><i class="fas fa-heart"></i></button>
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

// City Dropdown Logic
function populateCityDropdown() {
    const select = document.getElementById('city-select');
    select.innerHTML = '';
    cityFiles.forEach(city => {
        const option = document.createElement('option');
        option.value = city.file;
        option.textContent = city.label;
        select.appendChild(option);
    });
    // Set default selection to the first city
    select.value = cityFiles[0].file;
    select.addEventListener('change', function() {
        loadCityFromFile(this.value);
    });
}

function loadCityFromFile(filename) {
    fetch(filename)
        .then(response => response.json())
        .then(cityData => {
            window.cityData = cityData;
            updateDashboardWithCity(cityData);
        })
        .catch(err => {
            console.error('❌ Failed to fetch city data:', err);
            alert('Could not load city data.');
        });
}

function updateDashboardWithCity(cityData) {
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
    loadLocalTips(cityData.name.toLowerCase());

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