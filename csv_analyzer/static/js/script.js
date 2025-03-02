// CSV Analyzer Dashboard - Main JavaScript

// Global variables
let allData = [];
let filteredData = [];
let currentPage = 1;
const itemsPerPage = 10;
let charts = {};

// DOM Elements
const uploadForm = document.getElementById('upload-form');
const fileInput = document.getElementById('csv-file');
const uploadBtn = document.getElementById('upload-btn');
const loadingIndicator = document.getElementById('loading');
const resultsSection = document.getElementById('results-section');
const searchInput = document.getElementById('search-input');
const intentFilter = document.getElementById('intent-filter');
const sortBySelect = document.getElementById('sort-by');
const volumeMin = document.getElementById('volume-min');
const volumeMax = document.getElementById('volume-max');
const applyFiltersBtn = document.getElementById('apply-filters');
const resetFiltersBtn = document.getElementById('reset-filters');
const keywordsTable = document.getElementById('keywords-table');
const keywordsData = document.getElementById('keywords-data');
const keywordCount = document.getElementById('keyword-count');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageInfo = document.getElementById('page-info');

// File upload handling
uploadForm.addEventListener('submit', function(e) {
    e.preventDefault();

    if (fileInput.files.length === 0) {
        alert('Please select a CSV file to upload');
        return;
    }

    const file = fileInput.files[0];
    if (!file.name.endsWith('.csv')) {
        alert('Please select a valid CSV file');
        return;
    }

    // Show loading indicator
    loadingIndicator.classList.remove('hidden');
    uploadBtn.disabled = true;

    // Create form data
    const formData = new FormData();
    formData.append('file', file);

    // Send to server
    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.error || 'Unknown error occurred');
            });
        }
        return response.json();
    })
    .then(data => {
        // Hide loading indicator
        loadingIndicator.classList.add('hidden');
        uploadBtn.disabled = false;

        // Process and display data
        allData = data;
        filteredData = [...allData];

        // Show results section
        resultsSection.classList.remove('hidden');

        // Initialize dashboard
        initializeDashboard();
    })
    .catch(error => {
        // Hide loading indicator
        loadingIndicator.classList.add('hidden');
        uploadBtn.disabled = false;

        // Show error
        alert('Error: ' + error.message);
    });
});

// File input label update
fileInput.addEventListener('change', function() {
    const fileName = this.files[0] ? this.files[0].name : 'Choose a file';
    this.nextElementSibling.textContent = fileName;
});

// Initialize dashboard with data
function initializeDashboard() {
    // Apply initial filters and display
    applyFilters();

    // Initialize charts
    initializeCharts();
}

// Initialize all charts
function initializeCharts() {
    createVolumeChart();
    createDifficultyChart();
    createCpcChart();
    createIntentChart();
}

// Create Volume Distribution Chart
function createVolumeChart() {
    const ctx = document.getElementById('volume-chart').getContext('2d');

    // Group data into volume ranges
    const volumeRanges = {
        '0-100': 0,
        '101-500': 0,
        '501-1000': 0,
        '1001-5000': 0,
        '5001+': 0
    };

    allData.forEach(item => {
        const volume = item.search_volume;
        if (volume <= 100) volumeRanges['0-100']++;
        else if (volume <= 500) volumeRanges['101-500']++;
        else if (volume <= 1000) volumeRanges['501-1000']++;
        else if (volume <= 5000) volumeRanges['1001-5000']++;
        else volumeRanges['5001+']++;
    });

    charts.volume = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(volumeRanges),
            datasets: [{
                label: 'Keywords',
                data: Object.values(volumeRanges),
                backgroundColor: 'rgba(79, 195, 161, 0.7)',
                borderColor: 'rgba(79, 195, 161, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

// Create Keyword Difficulty Chart
function createDifficultyChart() {
    const ctx = document.getElementById('difficulty-chart').getContext('2d');

    // Group data into difficulty ranges
    const difficultyRanges = {
        'Easy (0-25)': 0,
        'Medium (26-50)': 0,
        'Hard (51-75)': 0,
        'Very Hard (76-100)': 0
    };

    allData.forEach(item => {
        const difficulty = item.keyword_difficulty;
        if (difficulty <= 25) difficultyRanges['Easy (0-25)']++;
        else if (difficulty <= 50) difficultyRanges['Medium (26-50)']++;
        else if (difficulty <= 75) difficultyRanges['Hard (51-75)']++;
        else difficultyRanges['Very Hard (76-100)']++;
    });

    charts.difficulty = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(difficultyRanges),
            datasets: [{
                data: Object.values(difficultyRanges),
                backgroundColor: [
                    'rgba(79, 195, 161, 0.7)',
                    'rgba(74, 111, 165, 0.7)',
                    'rgba(249, 170, 51, 0.7)',
                    'rgba(229, 57, 53, 0.7)'
                ],
                borderColor: [
                    'rgba(79, 195, 161, 1)',
                    'rgba(74, 111, 165, 1)',
                    'rgba(249, 170, 51, 1)',
                    'rgba(229, 57, 53, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

// Create CPC Chart
function createCpcChart() {
    const ctx = document.getElementById('cpc-chart').getContext('2d');

    // Group data into CPC ranges
    const cpcRanges = {
        '$0-1': 0,
        '$1-3': 0,
        '$3-5': 0,
        '$5-10': 0,
        '$10+': 0
    };

    allData.forEach(item => {
        const cpc = item.cpc;
        if (cpc <= 1) cpcRanges['$0-1']++;
        else if (cpc <= 3) cpcRanges['$1-3']++;
        else if (cpc <= 5) cpcRanges['$3-5']++;
        else if (cpc <= 10) cpcRanges['$5-10']++;
        else cpcRanges['$10+']++;
    });

    charts.cpc = new Chart(ctx, {
        type: 'polarArea',
        data: {
            labels: Object.keys(cpcRanges),
            datasets: [{
                data: Object.values(cpcRanges),
                backgroundColor: [
                    'rgba(79, 195, 161, 0.7)',
                    'rgba(74, 111, 165, 0.7)',
                    'rgba(22, 96, 136, 0.7)',
                    'rgba(249, 170, 51, 0.7)',
                    'rgba(229, 57, 53, 0.7)'
                ],
                borderColor: [
                    'rgba(79, 195, 161, 1)',
                    'rgba(74, 111, 165, 1)',
                    'rgba(22, 96, 136, 1)',
                    'rgba(249, 170, 51, 1)',
                    'rgba(229, 57, 53, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

// Create Intent Distribution Chart
function createIntentChart() {
    const ctx = document.getElementById('intent-chart').getContext('2d');

    // Count intents
    const intentCounts = {};

    allData.forEach(item => {
        const intent = item.search_intent;
        intentCounts[intent] = (intentCounts[intent] || 0) + 1;
    });

    charts.intent = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(intentCounts),
            datasets: [{
                data: Object.values(intentCounts),
                backgroundColor: [
                    'rgba(79, 195, 161, 0.7)',
                    'rgba(74, 111, 165, 0.7)',
                    'rgba(22, 96, 136, 0.7)',
                    'rgba(249, 170, 51, 0.7)'
                ],
                borderColor: [
                    'rgba(79, 195, 161, 1)',
                    'rgba(74, 111, 165, 1)',
                    'rgba(22, 96, 136, 1)',
                    'rgba(249, 170, 51, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

// Apply filters and update display
function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    const intent = intentFilter.value;
    const sortBy = sortBySelect.value;
    const minVolume = volumeMin.value ? parseInt(volumeMin.value) : 0;
    const maxVolume = volumeMax.value ? parseInt(volumeMax.value) : Infinity;

    // Filter data
    filteredData = allData.filter(item => {
        // Search term filter
        if (searchTerm && !item.keyword.toLowerCase().includes(searchTerm)) {
            return false;
        }

        // Intent filter
        if (intent !== 'all' && item.search_intent !== intent) {
            return false;
        }

        // Volume range filter
        if (item.search_volume < minVolume || item.search_volume > maxVolume) {
            return false;
        }

        return true;
    });

    // Sort data
    filteredData.sort((a, b) => {
        const [field, direction] = sortBy.split('_');
        let comparison = 0;

        if (field === 'search_volume') {
            comparison = a.search_volume - b.search_volume;
        } else if (field === 'keyword_difficulty') {
            comparison = a.keyword_difficulty - b.keyword_difficulty;
        } else if (field === 'cpc') {
            comparison = a.cpc - b.cpc;
        }

        return direction === 'asc' ? comparison : -comparison;
    });

    // Reset pagination
    currentPage = 1;

    // Update display
    displayData();
    updatePagination();
}

// Display data in table
function displayData() {
    // Calculate range to display
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
    const displayData = filteredData.slice(startIndex, endIndex);

    // Clear table
    keywordsData.innerHTML = '';

    // Add data to table
    displayData.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.keyword}</td>
            <td>${item.search_intent}</td>
            <td>${item.search_volume.toLocaleString()}</td>
            <td>${item.keyword_difficulty}</td>
            <td>$${item.cpc.toFixed(2)}</td>
        `;
        keywordsData.appendChild(row);
    });

    // Update keyword count
    keywordCount.textContent = `(${filteredData.length} keywords)`;
}

// Update pagination controls
function updatePagination() {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;

    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage >= totalPages;
}

// Event listeners for filter controls
searchInput.addEventListener('input', debounce(applyFilters, 300));
intentFilter.addEventListener('change', applyFilters);
sortBySelect.addEventListener('change', applyFilters);
applyFiltersBtn.addEventListener('click', applyFilters);

resetFiltersBtn.addEventListener('click', function() {
    searchInput.value = '';
    intentFilter.value = 'all';
    sortBySelect.value = 'search_volume_desc';
    volumeMin.value = '';
    volumeMax.value = '';
    applyFilters();
});

// Pagination event listeners
prevPageBtn.addEventListener('click', function() {
    if (currentPage > 1) {
        currentPage--;
        displayData();
        updatePagination();
    }
});

nextPageBtn.addEventListener('click', function() {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        displayData();
        updatePagination();
    }
});

// Helper function to debounce input
function debounce(func, delay) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}