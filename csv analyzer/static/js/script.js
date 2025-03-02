// CSV Analyzer Dashboard - Main JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const uploadForm = document.getElementById('upload-form');
    const csvFileInput = document.getElementById('csv-file');
    const uploadBtn = document.getElementById('upload-btn');
    const loadingIndicator = document.getElementById('loading');
    const resultsSection = document.getElementById('results-section');
    const searchInput = document.getElementById('search-input');
    const intentFilter = document.getElementById('intent-filter');
    const minDifficulty = document.getElementById('min-difficulty');
    const maxDifficulty = document.getElementById('max-difficulty');
    const applyFiltersBtn = document.getElementById('apply-filters');
    const resetFiltersBtn = document.getElementById('reset-filters');
    const tableBody = document.getElementById('table-body');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');
    
    // Stats Elements
    const totalKeywords = document.getElementById('total-keywords');
    const avgVolume = document.getElementById('avg-volume');
    const avgDifficulty = document.getElementById('avg-difficulty');
    const avgCpc = document.getElementById('avg-cpc');
    
    // Chart Elements
    const intentChartCtx = document.getElementById('intent-chart').getContext('2d');
    const difficultyChartCtx = document.getElementById('difficulty-chart').getContext('2d');
    const volumeCpcChartCtx = document.getElementById('volume-cpc-chart').getContext('2d');
    
    // Chart Instances
    let intentChart, difficultyChart, volumeCpcChart;
    
    // Data and State
    let csvData = [];
    let filteredData = [];
    let currentPage = 1;
    let rowsPerPage = 10;
    let sortColumn = 'keyword';
    let sortDirection = 'asc';
    
    // File Upload Handler
    uploadForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const file = csvFileInput.files[0];
        if (!file) {
            alert('Please select a CSV file to upload');
            return;
        }
        
        // Show loading indicator
        loadingIndicator.classList.remove('hidden');
        uploadBtn.disabled = true;
        
        const formData = new FormData();
        formData.append('file', file);
        
        // Send file to backend
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Process the data
            csvData = data;
            filteredData = [...csvData];
            
            // Initialize the dashboard
            initializeDashboard();
            
            // Hide loading indicator and show results
            loadingIndicator.classList.add('hidden');
            uploadBtn.disabled = false;
            resultsSection.classList.remove('hidden');
            setTimeout(() => {
                resultsSection.classList.add('visible');
            }, 100);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error processing the file. Please try again.');
            loadingIndicator.classList.add('hidden');
            uploadBtn.disabled = false;
        });
    });
    
    // Initialize Dashboard with Data
    function initializeDashboard() {
        // Populate intent filter options
        populateIntentFilter();
        
        // Calculate and display summary statistics
        updateSummaryStats(csvData);
        
        // Create charts
        createCharts(csvData);
        
        // Display data table
        updateTable();
        
        // Add event listeners for sorting and filtering
        setupEventListeners();
    }
    
    // Populate Intent Filter Dropdown
    function populateIntentFilter() {
        // Clear existing options except 'All'
        while (intentFilter.options.length > 1) {
            intentFilter.remove(1);
        }
        
        // Get unique intents
        const intents = [...new Set(csvData.map(item => item.search_intent))];
        
        // Add options
        intents.forEach(intent => {
            const option = document.createElement('option');
            option.value = intent;
            option.textContent = intent;
            intentFilter.appendChild(option);
        });
    }
    
    // Update Summary Statistics
    function updateSummaryStats(data) {
        if (data.length === 0) return;
        
        // Calculate statistics
        const count = data.length;
        const volumeSum = data.reduce((sum, item) => sum + item.search_volume, 0);
        const difficultySum = data.reduce((sum, item) => sum + item.keyword_difficulty, 0);
        const cpcSum = data.reduce((sum, item) => sum + item.cpc, 0);
        
        const volumeAvg = Math.round(volumeSum / count);
        const difficultyAvg = (difficultySum / count).toFixed(1);
        const cpcAvg = (cpcSum / count).toFixed(2);
        
        // Update DOM
        totalKeywords.textContent = count;
        avgVolume.textContent = volumeAvg.toLocaleString();
        avgDifficulty.textContent = difficultyAvg;
        avgCpc.textContent = `$${cpcAvg}`;
    }
    
    // Create Charts
    function createCharts(data) {
        // Destroy existing charts if they exist
        if (intentChart) intentChart.destroy();
        if (difficultyChart) difficultyChart.destroy();
        if (volumeCpcChart) volumeCpcChart.destroy();
        
        // 1. Intent Distribution Chart (Pie Chart)
        createIntentChart(data);
        
        // 2. Difficulty Distribution Chart (Bar Chart)
        createDifficultyChart(data);
        
        // 3. Search Volume vs CPC Chart (Scatter Plot)
        createVolumeCpcChart(data);
    }
    
    // Create Intent Distribution Chart
    function createIntentChart(data) {
        // Count occurrences of each intent
        const intentCounts = {};
        data.forEach(item => {
            const intent = item.search_intent;
            intentCounts[intent] = (intentCounts[intent] || 0) + 1;
        });
        
        // Prepare data for chart
        const labels = Object.keys(intentCounts);
        const counts = Object.values(intentCounts);
        
        // Generate colors
        const colors = generateColors(labels.length);
        
        // Create chart
        intentChart = new Chart(intentChartCtx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: counts,
                    backgroundColor: colors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Create Difficulty Distribution Chart
    function createDifficultyChart(data) {
        // Create difficulty ranges
        const ranges = {
            'Very Easy (0-20)': 0,
            'Easy (21-40)': 0,
            'Medium (41-60)': 0,
            'Hard (61-80)': 0,
            'Very Hard (81-100)': 0
        };
        
        // Count keywords in each range
        data.forEach(item => {
            const difficulty = item.keyword_difficulty;
            if (difficulty <= 20) ranges['Very Easy (0-20)']++;
            else if (difficulty <= 40) ranges['Easy (21-40)']++;
            else if (difficulty <= 60) ranges['Medium (41-60)']++;
            else if (difficulty <= 80) ranges['Hard (61-80)']++;
            else ranges['Very Hard (81-100)']++;
        });
        
        // Create chart
        difficultyChart = new Chart(difficultyChartCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(ranges),
                datasets: [{
                    label: 'Number of Keywords',
                    data: Object.values(ranges),
                    backgroundColor: [
                        '#4fc3a1', // Very Easy
                        '#7fd1b6', // Easy
                        '#f9c74f', // Medium
                        '#f8961e', // Hard
                        '#f3722c'  // Very Hard
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Keywords'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Difficulty Range'
                        }
                    }
                }
            }
        });
    }
    
    // Create Volume vs CPC Chart
    function createVolumeCpcChart(data) {
        // Prepare data for scatter plot
        const scatterData = data.map(item => ({
            x: item.search_volume,
            y: item.cpc,
            keyword: item.keyword
        }));
        
        // Create chart
        volumeCpcChart = new Chart(volumeCpcChartCtx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Keywords',
                    data: scatterData,
                    backgroundColor: 'rgba(74, 111, 165, 0.7)',
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: 'Search Volume'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'CPC ($)'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const point = context.raw;
                                return `${point.keyword}: Volume ${point.x}, CPC $${point.y.toFixed(2)}`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Generate random colors for charts
    function generateColors(count) {
        const baseColors = [
            '#4a6fa5', '#166088', '#4fc3a1', '#f9c74f', '#f8961e',
            '#f3722c', '#90be6d', '#43aa8b', '#577590', '#277da1'
        ];
        
        // If we need more colors than in our base set, generate them
        if (count <= baseColors.length) {
            return baseColors.slice(0, count);
        } else {
            const colors = [...baseColors];
            for (let i = baseColors.length; i < count; i++) {
                const r = Math.floor(Math.random() * 200) + 55;
                const g = Math.floor(Math.random() * 200) + 55;
                const b = Math.floor(Math.random() * 200) + 55;
                colors.push(`rgba(${r}, ${g}, ${b}, 0.7)`);
            }
            return colors;
        }
    }
    
    // Update Data Table
    function updateTable() {
        // Apply pagination
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        const paginatedData = filteredData.slice(startIndex, endIndex);
        
        // Clear table
        tableBody.innerHTML = '';
        
        // Add rows
        paginatedData.forEach(item => {
            const row = document.createElement('tr');
            
            // Keyword
            const keywordCell = document.createElement('td');
            keywordCell.textContent = item.keyword;
            row.appendChild(keywordCell);
            
            // Search Intent
            const intentCell = document.createElement('td');
            intentCell.textContent = item.search_intent;
            row.appendChild(intentCell);
            
            // Search Volume
            const volumeCell = document.createElement('td');
            volumeCell.textContent = item.search_volume.toLocaleString();
            volumeCell.className = 'numeric-col';
            row.appendChild(volumeCell);
            
            // Keyword Difficulty
            const difficultyCell = document.createElement('td');
            difficultyCell.textContent = item.keyword_difficulty;
            difficultyCell.className = 'numeric-col';
            row.appendChild(difficultyCell);
            
            // CPC
            const cpcCell = document.createElement('td');
            cpcCell.textContent = `$${item.cpc.toFixed(2)}`;
            cpcCell.className = 'numeric-col';
            row.appendChild(cpcCell);
            
            tableBody.appendChild(row);
        });
        
        // Update pagination controls
        updatePagination();
    }
    
    // Update Pagination Controls
    function updatePagination() {
        const totalPages = Math.ceil(filteredData.length / rowsPerPage);
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
    }
    
    // Setup Event Listeners for Sorting and Filtering
    function setupEventListeners() {
        // Table header sorting
        document.querySelectorAll('#data-table th[data-sort]').forEach(th => {
            th.addEventListener('click', () => {
                const column = th.getAttribute('data-sort');
                
                // Toggle sort direction if clicking the same column
                if (column === sortColumn) {
                    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    sortColumn = column;
                    sortDirection = 'asc';
                }
                
                // Update sort indicators
                document.querySelectorAll('#data-table th i').forEach(icon => {
                    icon.className = 'fas fa-sort';
                });
                
                const icon = th.querySelector('i');
                icon.className = `fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'}`;
                
                // Sort data and update table
                sortData();
                updateTable();
            });
        });
        
        // Apply filters button
        applyFiltersBtn.addEventListener('click', () => {
            applyFilters();
        });
        
        // Reset filters button
        resetFiltersBtn.addEventListener('click', () => {
            // Clear filter inputs
            searchInput.value = '';
            intentFilter.value = 'all';
            minDifficulty.value = '';
            maxDifficulty.value = '';
            
            // Reset data and update display
            filteredData = [...csvData];
            currentPage = 1;
            updateSummaryStats(filteredData);
            createCharts(filteredData);
            updateTable();
        });
        
        // Search input (real-time filtering)
        searchInput.addEventListener('input', () => {
            // Only apply filter if search term has at least 2 characters or is empty
            if (searchInput.value.length >= 2 || searchInput.value.length === 0) {
                applyFilters();
            }
        });
        
        // Pagination controls
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                updateTable();
            }
        });
        
        nextPageBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(filteredData.length / rowsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                updateTable();
            }
        });
    }
    
    // Apply Filters Function
    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        const intent = intentFilter.value;
        const minDiff = minDifficulty.value ? parseInt(minDifficulty.value) : 0;
        const maxDiff = maxDifficulty.value ? parseInt(maxDifficulty.value) : 100;
        
        // Filter data based on criteria
        filteredData = csvData.filter(item => {
            // Search term filter
            const matchesSearch = searchTerm === '' || 
                item.keyword.toLowerCase().includes(searchTerm);
            
            // Intent filter
            const matchesIntent = intent === 'all' || 
                item.search_intent === intent;
            
            // Difficulty range filter
            const matchesDifficulty = item.keyword_difficulty >= minDiff && 
                item.keyword_difficulty <= maxDiff;
            
            return matchesSearch && matchesIntent && matchesDifficulty;
        });
        
        // Reset to first page
        currentPage = 1;
        
        // Update dashboard with filtered data
        updateSummaryStats(filteredData);
        createCharts(filteredData);
        updateTable();
    }
    
    // Sort Data Function
    function sortData() {
        filteredData.sort((a, b) => {
            let valueA = a[sortColumn];
            let valueB = b[sortColumn];
            
            // Handle string vs number comparison
            if (typeof valueA === 'string' && typeof valueB === 'string') {
                return sortDirection === 'asc' ? 
                    valueA.localeCompare(valueB) : 
                    valueB.localeCompare(valueA);
            } else {
                // Numeric comparison
                return sortDirection === 'asc' ? 
                    valueA - valueB : 
                    valueB - valueA;
            }
        });
    }
});