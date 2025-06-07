// Travel Dashboard Data
const travelData = {
  "cities": [
    {
      "name": "Copenhagen",
      "center": {"lat": 55.6761, "lng": 12.5683},
      "attractions": [
        {
          "name": "Tivoli Gardens",
          "description": "One of the world's oldest amusement parks that inspired Walt Disney",
          "hours": "Mon-Thu: 11:00-22:00, Fri-Sat: 11:00-24:00, Sun: 11:00-22:00",
          "fee": "€25",
          "duration": "3+ hours",
          "location": {"lat": 55.6736, "lng": 12.5681},
          "website": "tivoli.dk",
          "tags": ["family-friendly", "seasonal", "evening", "historic"]
        },
        {
          "name": "Nyhavn",
          "description": "Picturesque 17th-century waterfront district with colorful buildings",
          "hours": "24/7",
          "fee": "Free",
          "duration": "1-2 hours",
          "location": {"lat": 55.6796, "lng": 12.5912},
          "tags": ["historic", "waterfront", "photography", "dining"]
        },
        {
          "name": "Amalienborg Palace",
          "description": "The Queen's residence with guard changing at 12 noon",
          "hours": "Daily, guard at 12:00",
          "fee": "Museum entry required",
          "duration": "1-2 hours",
          "location": {"lat": 55.6844, "lng": 12.5928},
          "tags": ["royal", "historic", "ceremony", "museum"]
        },
        {
          "name": "The Little Mermaid",
          "description": "Copenhagen's iconic symbol inspired by Hans Christian Andersen",
          "hours": "24/7",
          "fee": "Free",
          "duration": "30 minutes",
          "location": {"lat": 55.6929, "lng": 12.5993},
          "tags": ["iconic", "cultural", "photography", "free"]
        },
        {
          "name": "Rosenborg Castle",
          "description": "Renaissance castle with Danish crown jewels and gardens",
          "hours": "Seasonal variations",
          "fee": "Admission required",
          "duration": "2-3 hours",
          "location": {"lat": 55.6857, "lng": 12.5773},
          "tags": ["royal", "historic", "gardens", "crown-jewels"]
        },
        {
          "name": "The Round Tower",
          "description": "17th-century tower with spiraling ramp and city views",
          "hours": "Daily",
          "fee": "Free with Copenhagen Card",
          "duration": "1-2 hours",
          "location": {"lat": 55.6813, "lng": 12.5757},
          "tags": ["historic", "panoramic-views", "architecture", "indoor"]
        }
      ],
      "restaurants": [
        {
          "name": "Geranium",
          "cuisine": "Nordic Contemporary",
          "description": "Three Michelin stars, run by Rasmus Kofoed with city views",
          "hours": "Dinner service",
          "priceRange": "$$$$",
          "location": {"lat": 55.7058, "lng": 12.5546},
          "bookingRequired": "Essential",
          "michelinStars": 3,
          "tags": ["fine-dining", "city-views", "nordic"]
        },
        {
          "name": "noma",
          "cuisine": "New Nordic", 
          "description": "Revolutionary restaurant that launched New Nordic movement",
          "hours": "Limited days",
          "priceRange": "$$$$",
          "location": {"lat": 55.6960, "lng": 12.6081},
          "bookingRequired": "Essential",
          "michelinStars": 2,
          "tags": ["innovative", "fermentation", "local-ingredients"]
        },
        {
          "name": "AOC",
          "cuisine": "Contemporary",
          "description": "Located in vaulted cellars of 17th-century mansion",
          "hours": "Dinner service",
          "priceRange": "$$$",
          "location": {"lat": 55.6822, "lng": 12.5854},
          "bookingRequired": "Recommended",
          "michelinStars": 2,
          "tags": ["historic-setting", "wine-collection"]
        },
        {
          "name": "Ida Davidsen",
          "cuisine": "Traditional Danish",
          "description": "4th generation smørrebrød specialist since 1888",
          "hours": "Lunch service",
          "priceRange": "$$",
          "location": {"lat": 55.6851, "lng": 12.5897},
          "bookingRequired": "Groups only",
          "tags": ["traditional", "smørrebrød", "family-run"]
        }
      ],
      "bars": [
        {
          "name": "ROOF CPH",
          "type": "Rooftop Bar",
          "description": "Rooftop bar with city skyline views and mint-green rooftops",
          "hours": "Evening, weather dependent",
          "location": {"lat": 55.6784, "lng": 12.5732},
          "dressCode": "Smart casual",
          "priceRange": "$$$",
          "tags": ["panoramic-views", "cocktails", "hotel-bar"]
        },
        {
          "name": "Mikkeller",
          "type": "Craft Brewery",
          "description": "Copenhagen's craft brewery pioneer with unique flavors",
          "hours": "Vary by location",
          "location": {"lat": 55.6831, "lng": 12.5724},
          "priceRange": "$$",
          "tags": ["craft-beer", "innovative-flavors", "local"]
        },
        {
          "name": "Rosforth & Rosforth",
          "type": "Wine Bar",
          "description": "Natural wine bar under Knippelsbro bridge",
          "hours": "Afternoon/evening",
          "location": {"lat": 55.6734, "lng": 12.5821},
          "priceRange": "$$$",
          "tags": ["natural-wine", "waterfront", "local"]
        }
      ],
      "itinerary": [
        {
          "day": "Day 1: Historic Center",
          "activities": [
            {"time": "Morning", "activity": "Tivoli Gardens", "duration": "2-3 hours"},
            {"time": "Lunch", "activity": "Ida Davidsen for smørrebrød", "duration": "1 hour"},
            {"time": "Afternoon", "activity": "Nyhavn walking and canal cruise", "duration": "2-3 hours"},
            {"time": "Dinner", "activity": "AOC or Michelin restaurant", "duration": "2-3 hours"},
            {"time": "Evening", "activity": "ROOF CPH for cocktails", "duration": "2 hours"}
          ]
        },
        {
          "day": "Day 2: Royal Copenhagen",
          "activities": [
            {"time": "Morning", "activity": "Amalienborg Palace with guard ceremony", "duration": "2 hours"},
            {"time": "Lunch", "activity": "Royal Cafe", "duration": "1 hour"},
            {"time": "Afternoon", "activity": "Rosenborg Castle and gardens", "duration": "2-3 hours"},
            {"time": "Dinner", "activity": "Geranium or noma", "duration": "3-4 hours"},
            {"time": "Evening", "activity": "Craft beer tour in Nørrebro", "duration": "2-3 hours"}
          ]
        }
      ]
    },
    {
      "name": "Stockholm",
      "center": {"lat": 59.3293, "lng": 18.0686},
      "attractions": [
        {
          "name": "Gamla Stan",
          "description": "Stockholm's oldest district with medieval cobblestone streets",
          "hours": "24/7, attractions vary",
          "fee": "Free to explore",
          "duration": "Half day",
          "location": {"lat": 59.3251, "lng": 18.0719},
          "tags": ["historic", "medieval", "walking", "photography"]
        },
        {
          "name": "Vasa Museum",
          "description": "17th-century warship recovered after 333 years",
          "hours": "Daily",
          "fee": "SEK 180",
          "duration": "2-3 hours",
          "location": {"lat": 59.3280, "lng": 18.0916},
          "tags": ["maritime", "unique", "family-friendly"]
        },
        {
          "name": "Skansen",
          "description": "World's oldest open-air museum with Nordic wildlife",
          "hours": "Daily, seasonal",
          "fee": "Up to SEK 285",
          "duration": "Full day",
          "location": {"lat": 59.3255, "lng": 18.1034},
          "tags": ["cultural-heritage", "family-friendly", "outdoor", "wildlife"]
        },
        {
          "name": "Royal Palace",
          "description": "600+ room palace with royal apartments and museums",
          "hours": "Daily",
          "fee": "Museum tickets required",
          "duration": "2-3 hours",
          "location": {"lat": 59.3267, "lng": 18.0717},
          "tags": ["royal", "ceremony", "historic", "architecture"]
        },
        {
          "name": "Fotografiska",
          "description": "Contemporary photography center with waterfront views",
          "hours": "Daily",
          "fee": "Admission required",
          "duration": "2-3 hours",
          "location": {"lat": 59.3186, "lng": 18.0840},
          "tags": ["contemporary-art", "photography", "waterfront"]
        }
      ],
      "restaurants": [
        {
          "name": "Frantzén",
          "cuisine": "Contemporary",
          "description": "Sweden's first three Michelin star restaurant",
          "hours": "Dinner, very limited",
          "priceRange": "$$$$",
          "location": {"lat": 59.3326, "lng": 18.0649},
          "bookingRequired": "Essential, months ahead",
          "michelinStars": 3,
          "tags": ["fine-dining", "innovative", "historic-building"]
        },
        {
          "name": "AIRA",
          "cuisine": "Nordic",
          "description": "Seasonal Nordic flavors on Djurgården with sea views",
          "hours": "Dinner service",
          "priceRange": "$$$$",
          "location": {"lat": 59.3247, "lng": 18.0952},
          "bookingRequired": "Essential",
          "michelinStars": 2,
          "tags": ["seasonal", "sea-views", "nordic"]
        },
        {
          "name": "Ekstedt",
          "cuisine": "Nordic",
          "description": "Unique cooking using only open fire, wood, and smoke",
          "hours": "Dinner service",
          "priceRange": "$$$",
          "location": {"lat": 59.3345, "lng": 18.0632},
          "bookingRequired": "Required",
          "michelinStars": 1,
          "tags": ["unique-cooking", "fire", "innovative"]
        },
        {
          "name": "Sushi Sho",
          "cuisine": "Japanese",
          "description": "15-dish sushi tasting menu in open kitchen",
          "hours": "Dinner service",
          "priceRange": "$$$",
          "location": {"lat": 59.342, "lng": 18.0639},
          "bookingRequired": "Essential",
          "michelinStars": 1,
          "tags": ["sushi", "tasting-menu", "open-kitchen"]
        }
      ],
      "bars": [
        {
          "name": "Freyja Söder",
          "type": "Rooftop Bar",
          "description": "Scandinavian elegance with graffiti outdoor bar and panoramic views",
          "hours": "Seasonal outdoor",
          "location": {"lat": 59.3167, "lng": 18.0679},
          "priceRange": "$$$",
          "tags": ["panoramic-views", "eclectic", "seasonal"]
        },
        {
          "name": "Le Hibou",
          "type": "Rooftop Bar", 
          "description": "Year-round rooftop with Parisian-inspired cocktails",
          "hours": "Year-round",
          "location": {"lat": 59.3293, "lng": 18.0686},
          "priceRange": "$$$",
          "tags": ["cocktails", "year-round", "parisian-elegance"]
        },
        {
          "name": "Trädgården",
          "type": "Nightclub",
          "description": "Popular summer outdoor club under Skanstull bridge",
          "hours": "Summer seasonal",
          "location": {"lat": 59.3086, "lng": 18.0747},
          "priceRange": "$$",
          "tags": ["outdoor-summer", "popular", "bridge-location"]
        }
      ],
      "itinerary": [
        {
          "day": "Day 1: Old Town & Museums",
          "activities": [
            {"time": "Morning", "activity": "Gamla Stan exploration", "duration": "3-4 hours"},
            {"time": "Lunch", "activity": "Traditional Swedish café", "duration": "1 hour"},
            {"time": "Afternoon", "activity": "Royal Palace tour", "duration": "2-3 hours"},
            {"time": "Dinner", "activity": "Traditional Swedish restaurant", "duration": "2 hours"},
            {"time": "Evening", "activity": "Cocktails in Södermalm", "duration": "2-3 hours"}
          ]
        },
        {
          "day": "Day 2: Djurgården Island",
          "activities": [
            {"time": "Morning", "activity": "Vasa Museum", "duration": "2-3 hours"},
            {"time": "Lunch", "activity": "Island café", "duration": "1 hour"},
            {"time": "Afternoon", "activity": "Skansen Open-Air Museum", "duration": "3-4 hours"},
            {"time": "Dinner", "activity": "Frantzén or AIRA", "duration": "3-4 hours"},
            {"time": "Evening", "activity": "Rooftop bar with city views", "duration": "2 hours"}
          ]
        }
      ]
    }
  ],
  "localTips": {
    "copenhagen": {
      "transportation": "Copenhagen Card for unlimited transport + 80 attractions, DOT app for tickets",
      "culture": "Hygge culture, fika coffee breaks, service included in bills",
      "emergency": "Emergency: 112, Police: 114, Currency: DKK"
    },
    "stockholm": {
      "transportation": "SL app for public transport, contactless payment works",
      "culture": "Fika essential, Systembolaget for alcohol, English widely spoken",
      "emergency": "Emergency: 112, Currency: SEK"
    }
  },
  "budgetEstimates": {
    "budget": {"daily": "€30-50", "description": "Street food, free attractions, neighborhood bars"},
    "midrange": {"daily": "€80-120", "description": "Museum entries, casual dining, craft cocktails"},
    "luxury": {"daily": "€200+", "description": "Michelin dining, premium experiences, high-end bars"}
  }
};

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
    loadCity('copenhagen');
    updateTripDisplay();
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
    const cityData = travelData.cities.find(city => city.name.toLowerCase() === cityName);
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
    
    if (venue.hours) content += `<p><strong>Hours:</strong> ${venue.hours}</p>`;
    if (venue.fee) content += `<p><strong>Fee:</strong> ${venue.fee}</p>`;
    if (venue.priceRange) content += `<p><strong>Price:</strong> ${venue.priceRange}</p>`;
    
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
    const tips = travelData.localTips[cityName];
    
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
    const priceCategory = attraction.fee === 'Free' || attraction.fee === 'Free to explore' ? 'free' : 
                         attraction.fee.includes('€') || attraction.fee.includes('SEK') ? '$$' : '$';
    
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
                    <span class="detail-value">${attraction.hours}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Fee:</span>
                    <span class="detail-value">${attraction.fee}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Duration:</span>
                    <span class="detail-value">${attraction.duration}</span>
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
    const stars = restaurant.michelinStars ? '⭐'.repeat(restaurant.michelinStars) : '';
    
    return `
        <div class="venue-card" data-venue-id="${id}" data-category="restaurants" data-price="${restaurant.priceRange}">
            ${restaurant.bookingRequired === 'Essential' || restaurant.bookingRequired === 'Essential, months ahead' ? '<div class="booking-badge essential">Booking Essential</div>' : ''}
            ${restaurant.bookingRequired === 'Recommended' || restaurant.bookingRequired === 'Required' ? '<div class="booking-badge recommended">Booking Recommended</div>' : ''}
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
                    <span class="detail-value">${restaurant.priceRange}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Hours:</span>
                    <span class="detail-value">${restaurant.hours}</span>
                </div>
                ${restaurant.michelinStars ? `
                <div class="detail-item">
                    <span class="detail-label">Michelin:</span>
                    <span class="detail-value michelin-stars">${stars}</span>
                </div>
                ` : ''}
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
        <div class="venue-card" data-venue-id="${id}" data-category="bars" data-price="${bar.priceRange || '$$'}">
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
                    <span class="detail-value">${bar.hours}</span>
                </div>
                ${bar.dressCode ? `
                <div class="detail-item">
                    <span class="detail-label">Dress Code:</span>
                    <span class="detail-value">${bar.dressCode}</span>
                </div>
                ` : ''}
                ${bar.priceRange ? `
                <div class="detail-item">
                    <span class="detail-label">Price:</span>
                    <span class="detail-value">${bar.priceRange}</span>
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