// CSV Analyzer Dashboard - Main JavaScript

document.addEventListener('DOMContentLoaded', () => {
    // Safely get DOM elements
    const uploadForm = document.getElementById('upload-form');
    const fileInput = document.getElementById('csv-file');
    const loadingIndicator = document.getElementById('loading');
    const uploadSection = document.getElementById('upload-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const dashboardLink = document.getElementById('dashboard-link');
    const selectedFileText = document.getElementById('selected-file');
    const dropZone = document.getElementById('drop-zone');
    const uploadBtn = document.getElementById('upload-btn');

    // Table and pagination elements
    const keywordsTable = document.getElementById('keywords-table');
    const keywordsData = document.getElementById('keywords-data');
    const keywordCount = document.getElementById('keyword-count');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');
    const recordsPerPageSelect = document.getElementById('records-per-page'); // Added for records per page


    // Filter elements
    const searchInput = document.getElementById('search-input');
    const intentFilter = document.getElementById('intent-filter');
    const sortBySelect = document.getElementById('sort-by');
    const volumeMin = document.getElementById('volume-min');
    const volumeMax = document.getElementById('volume-max');
    const applyFiltersBtn = document.getElementById('apply-filters');
    const resetFiltersBtn = document.getElementById('reset-filters');

    // Toggle elements
    const toggleFiltersBtn = document.getElementById('toggle-filters');
    const toggleChartsBtn = document.getElementById('toggle-charts');
    const chartsSection = document.getElementById('charts-section');

    // State variables
    let allData = [];
    let filteredData = [];
    let currentPage = 1;
    let itemsPerPage = 10; // Default items per page
    let currentSortField = 'quality_score_desc';

    // Functions
    function updateSummaryStats(data) {
        const totalKeywords = data.length;
        document.getElementById('total-keywords').textContent = totalKeywords;

        // Calculate averages
        if (data.length > 0) {
            const avgVolume = data.reduce((sum, item) => sum + parseInt(item.search_volume || 0), 0) / data.length;
            const avgDifficulty = data.reduce((sum, item) => sum + parseInt(item.keyword_difficulty || 0), 0) / data.length;
            const avgCpc = data.reduce((sum, item) => sum + parseFloat(item.cpc || 0), 0) / data.length;

            document.getElementById('avg-volume').textContent = Math.round(avgVolume).toLocaleString();
            document.getElementById('avg-difficulty').textContent = Math.round(avgDifficulty);
            document.getElementById('avg-cpc').textContent = '$' + avgCpc.toFixed(2);
        }
    }

    function calculateQualityScore(item) {
        // Simple quality score calculation: higher volume, lower difficulty, higher CPC is better
        const volume = parseInt(item.search_volume || 0);
        const difficulty = parseInt(item.keyword_difficulty || 0);
        const cpc = parseFloat(item.cpc || 0);

        // Normalize values (0-1 scale)
        const normalizedVolume = Math.min(volume / 10000, 1); // Assume 10000+ is max volume
        const normalizedDifficulty = 1 - (difficulty / 100); // Lower difficulty is better
        const normalizedCpc = Math.min(cpc / 10, 1); // Assume $10+ is max CPC

        // Calculate score (0-100 scale)
        return Math.round((normalizedVolume * 0.4 + normalizedDifficulty * 0.4 + normalizedCpc * 0.2) * 100);
    }

    function sortData(data, sortBy) {
        const sortedData = [...data];

        switch (sortBy) {
            case 'quality_score_desc':
                sortedData.sort((a, b) => b.qualityScore - a.qualityScore);
                break;
            case 'search_volume_desc':
                sortedData.sort((a, b) => parseInt(b.search_volume || 0) - parseInt(a.search_volume || 0));
                break;
            case 'search_volume_asc':
                sortedData.sort((a, b) => parseInt(a.search_volume || 0) - parseInt(b.search_volume || 0));
                break;
            case 'keyword_difficulty_desc':
                sortedData.sort((a, b) => parseInt(b.keyword_difficulty || 0) - parseInt(a.keyword_difficulty || 0));
                break;
            case 'keyword_difficulty_asc':
                sortedData.sort((a, b) => parseInt(a.keyword_difficulty || 0) - parseInt(b.keyword_difficulty || 0));
                break;
            case 'cpc_desc':
                sortedData.sort((a, b) => parseFloat(b.cpc || 0) - parseFloat(a.cpc || 0));
                break;
            case 'cpc_asc':
                sortedData.sort((a, b) => parseFloat(a.cpc || 0) - parseFloat(b.cpc || 0));
                break;
            case 'keyword_asc':
                sortedData.sort((a, b) => a.keyword.localeCompare(b.keyword));
                break;
        }

        return sortedData;
    }

    function filterData() {
        let filtered = [...allData];

        // Apply search filter
        if (searchInput && searchInput.value) {
            const searchTerm = searchInput.value.toLowerCase();
            filtered = filtered.filter(item =>
                item.keyword.toLowerCase().includes(searchTerm)
            );
        }

        // Apply intent filter
        if (intentFilter && intentFilter.value !== 'all') {
            filtered = filtered.filter(item =>
                item.search_intent.toLowerCase() === intentFilter.value.toLowerCase()
            );
        }

        // Apply volume range filter
        if (volumeMin && volumeMin.value) {
            filtered = filtered.filter(item =>
                parseInt(item.search_volume || 0) >= parseInt(volumeMin.value)
            );
        }

        if (volumeMax && volumeMax.value) {
            filtered = filtered.filter(item =>
                parseInt(item.search_volume || 0) <= parseInt(volumeMax.value)
            );
        }

        return filtered;
    }

    function applyFilters() {
        currentPage = 1;
        filteredData = filterData();
        filteredData = sortData(filteredData, currentSortField);
        renderTable();
        updatePagination();
    }

    function resetFilters() {
        if (searchInput) searchInput.value = '';
        if (intentFilter) intentFilter.value = 'all';
        if (volumeMin) volumeMin.value = '';
        if (volumeMax) volumeMax.value = '';
        if (sortBySelect) sortBySelect.value = 'quality_score_desc';

        currentSortField = 'quality_score_desc';
        currentPage = 1;
        filteredData = [...allData];
        renderTable();
        updatePagination();
    }

    function renderTable() {
        if (!keywordsData) return;

        keywordsData.innerHTML = '';

        if (filteredData.length === 0) {
            keywordsData.innerHTML = `
                <tr>
                    <td colspan="6" class="no-data">No keywords found with the current filters</td>
                </tr>
            `;
            if (keywordCount) keywordCount.textContent = '(0 keywords)';
            return;
        }

        // Update keyword count
        if (keywordCount) keywordCount.textContent = `(${filteredData.length} keywords)`;

        // Pagination
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
        const currentPageData = filteredData.slice(startIndex, endIndex);

        // Render table rows
        currentPageData.forEach(item => {
            const row = document.createElement('tr');

            // Determine quality score class
            let qualityClass = 'medium-quality';
            if (item.qualityScore >= 70) qualityClass = 'high-quality';
            if (item.qualityScore < 40) qualityClass = 'low-quality';

            row.innerHTML = `
                <td data-column="keyword">${item.keyword}</td>
                <td data-column="intent">${item.search_intent || 'N/A'}</td>
                <td data-column="volume">${parseInt(item.search_volume || 0).toLocaleString()}</td>
                <td data-column="difficulty">${item.keyword_difficulty || '0'}</td>
                <td data-column="cpc">$${parseFloat(item.cpc || 0).toFixed(2)}</td>
                <td class="quality-score ${qualityClass}" data-column="qualityScore">${item.qualityScore}</td>
            `;

            keywordsData.appendChild(row);
        });
    }

    function updatePagination() {
        if (!pageInfo || !prevPageBtn || !nextPageBtn) return;

        const totalPages = Math.ceil(filteredData.length / itemsPerPage);
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
    }

    function createCharts(data) {
        if (!chartsSection) return;

        // Intent distribution chart
        const intentCounts = {};
        data.forEach(item => {
            const intent = item.search_intent || 'Unknown';
            intentCounts[intent] = (intentCounts[intent] || 0) + 1;
        });

        const intentCtx = document.getElementById('intent-chart');
        if (intentCtx) {
            new Chart(intentCtx, {
                type: 'pie',
                data: {
                    labels: Object.keys(intentCounts),
                    datasets: [{
                        data: Object.values(intentCounts),
                        backgroundColor: [
                            '#4361EE', '#3A0CA3', '#4CC9F0', '#4895EF', '#560BAD'
                        ]
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

        // Volume distribution chart
        const volumeCtx = document.getElementById('volume-chart');
        if (volumeCtx) {
            // Group data into volume ranges
            const volumeRanges = {
                '0-100': 0,
                '101-500': 0,
                '501-1000': 0,
                '1001-5000': 0,
                '5001+': 0
            };

            data.forEach(item => {
                const volume = parseInt(item.search_volume || 0);
                if (volume <= 100) volumeRanges['0-100']++;
                else if (volume <= 500) volumeRanges['101-500']++;
                else if (volume <= 1000) volumeRanges['501-1000']++;
                else if (volume <= 5000) volumeRanges['1001-5000']++;
                else volumeRanges['5001+']++;
            });

            new Chart(volumeCtx, {
                type: 'bar',
                data: {
                    labels: Object.keys(volumeRanges),
                    datasets: [{
                        label: 'Number of Keywords',
                        data: Object.values(volumeRanges),
                        backgroundColor: '#4361EE'
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
                                text: 'Search Volume Range'
                            }
                        }
                    }
                }
            });
        }

        // Difficulty distribution chart
        const difficultyCtx = document.getElementById('difficulty-chart');
        if (difficultyCtx) {
            // Group data into difficulty ranges
            const difficultyRanges = {
                'Very Easy (0-20)': 0,
                'Easy (21-40)': 0,
                'Medium (41-60)': 0,
                'Hard (61-80)': 0,
                'Very Hard (81-100)': 0
            };

            data.forEach(item => {
                const difficulty = parseInt(item.keyword_difficulty || 0);
                if (difficulty <= 20) difficultyRanges['Very Easy (0-20)']++;
                else if (difficulty <= 40) difficultyRanges['Easy (21-40)']++;
                else if (difficulty <= 60) difficultyRanges['Medium (41-60)']++;
                else if (difficulty <= 80) difficultyRanges['Hard (61-80)']++;
                else difficultyRanges['Very Hard (81-100)']++;
            });

            new Chart(difficultyCtx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(difficultyRanges),
                    datasets: [{
                        data: Object.values(difficultyRanges),
                        backgroundColor: ['#4BC0C0', '#97E3D5', '#FFCE56', '#FF9F40', '#FF6384']
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

        // CPC chart
        const cpcCtx = document.getElementById('cpc-chart');
        if (cpcCtx) {
            // Create CPC ranges
            const cpcRanges = {
                '$0-$1': 0,
                '$1-$2': 0,
                '$2-$5': 0,
                '$5-$10': 0,
                '$10+': 0
            };

            data.forEach(item => {
                const cpc = parseFloat(item.cpc || 0);
                if (cpc <= 1) cpcRanges['$0-$1']++;
                else if (cpc <= 2) cpcRanges['$1-$2']++;
                else if (cpc <= 5) cpcRanges['$2-$5']++;
                else if (cpc <= 10) cpcRanges['$5-$10']++;
                else cpcRanges['$10+']++;
            });

            new Chart(cpcCtx, {
                type: 'bar',
                data: {
                    labels: Object.keys(cpcRanges),
                    datasets: [{
                        label: 'Number of Keywords',
                        data: Object.values(cpcRanges),
                        backgroundColor: '#36A2EB'
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Number of Keywords'
                            }
                        }
                    }
                }
            });
        }
    }

    // Event Listeners
    if (uploadForm) {
        uploadForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = new FormData();
            const file = fileInput.files[0];

            if (!file) {
                alert('Please select a CSV file');
                return;
            }

            formData.append('file', file);

            // Show loading indicator
            if (loadingIndicator) loadingIndicator.classList.remove('hidden');
            if (uploadBtn) uploadBtn.disabled = true;

            // Send file to server
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
                if (loadingIndicator) loadingIndicator.classList.add('hidden');
                if (uploadBtn) uploadBtn.disabled = false;

                // Add quality scores to data
                allData = data.map(item => {
                    const qualityScore = calculateQualityScore(item);
                    return { ...item, qualityScore };
                });

                // Sort and filter data
                currentSortField = 'quality_score_desc';
                filteredData = sortData([...allData], currentSortField);

                // Populate intent filter options
                if (intentFilter) {
                    const intents = [...new Set(allData.map(item => item.search_intent))].filter(Boolean);
                    intentFilter.innerHTML = '<option value="all">All Intents</option>';
                    intents.forEach(intent => {
                        const option = document.createElement('option');
                        option.value = intent;
                        option.textContent = intent;
                        intentFilter.appendChild(option);
                    });
                }

                // Render table
                renderTable();
                updatePagination();

                // Create charts
                createCharts(allData);

                // Show dashboard section, hide upload section
                if (uploadSection) uploadSection.classList.remove('active');
                if (dashboardSection) {
                    dashboardSection.classList.remove('hidden');
                    dashboardSection.classList.add('active');
                }

                // Update navigation
                const activeNavLink = document.querySelector('.nav-links a.active');
                if (activeNavLink) activeNavLink.classList.remove('active');
                if (dashboardLink) {
                    dashboardLink.classList.remove('disabled');
                    dashboardLink.classList.add('active');
                }

                // Calculate summary stats
                updateSummaryStats(data);
            })
            .catch(error => {
                // Hide loading indicator
                if (loadingIndicator) loadingIndicator.classList.add('hidden');
                if (uploadBtn) uploadBtn.disabled = false;

                // Show error
                alert('Error: ' + error.message);
            });
        });
    }

    // Drag and drop file handling
    if (dropZone) {
        dropZone.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.add('active');
        });

        dropZone.addEventListener('dragleave', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.remove('active');
        });

        function handleDrop(e) {
            e.preventDefault();
            e.stopPropagation();

            this.classList.remove('active');

            const files = e.dataTransfer.files;

            if (files.length > 0 && fileInput) {
                fileInput.files = files;
                if (selectedFileText) selectedFileText.textContent = files[0].name;
            }
        }

        dropZone.addEventListener('drop', handleDrop);
    }

    // File input change handler
    if (fileInput && selectedFileText) {
        fileInput.addEventListener('change', function() {
            const fileName = this.files[0] ? this.files[0].name : 'No file selected';
            selectedFileText.textContent = fileName;
        });
    }

    // Filter and sort events
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }

    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', resetFilters);
    }

    if (sortBySelect) {
        sortBySelect.addEventListener('change', function() {
            currentSortField = this.value;
            filteredData = sortData(filteredData, currentSortField);
            renderTable();
        });
    }

    //Records per page change
    if (recordsPerPageSelect) {
        recordsPerPageSelect.addEventListener('change', function() {
            itemsPerPage = parseInt(this.value, 10);
            currentPage = 1; // Reset to page 1 when changing items per page
            renderTable();
            updatePagination();
        });
    }


    // Toggle sections
    if (toggleFiltersBtn) {
        toggleFiltersBtn.addEventListener('click', function() {
            const filterContent = this.closest('.filter-section').querySelector('.filter-content');
            if (filterContent) {
                filterContent.classList.toggle('hidden');
                this.querySelector('i').classList.toggle('fa-chevron-down');
                this.querySelector('i').classList.toggle('fa-chevron-up');
            }
        });
    }

    if (toggleChartsBtn && chartsSection) {
        toggleChartsBtn.addEventListener('click', function() {
            chartsSection.classList.toggle('hidden');
            this.querySelector('i').classList.toggle('fa-chart-pie');
            this.querySelector('i').classList.toggle('fa-chart-line');
        });
    }

    // Pagination
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', function() {
            if (currentPage > 1) {
                currentPage--;
                renderTable();
                updatePagination();
            }
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', function() {
            const totalPages = Math.ceil(filteredData.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderTable();
                updatePagination();
            }
        });
    }

    // Dashboard link
    if (dashboardLink) {
        dashboardLink.addEventListener('click', function(e) {
            if (this.classList.contains('disabled')) {
                e.preventDefault();
                alert('Please upload a CSV file first');
            } else {
                document.querySelector('.nav-links a.active').classList.remove('active');
                this.classList.add('active');

                if (uploadSection) uploadSection.classList.remove('active');
                if (dashboardSection) {
                    dashboardSection.classList.remove('hidden');
                    dashboardSection.classList.add('active');
                }
            }
        });
    }
});