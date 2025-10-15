// Admin JavaScript Functions for Voting Management System

// Global variables
let refreshInterval;
let chartInstances = {};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeAdmin();
});

// Main initialization function
function initializeAdmin() {
    // Initialize tooltips
    initializeTooltips();
    
    // Initialize auto-refresh if on dashboard
    if (window.location.pathname.includes('dashboard') || window.location.pathname === '/') {
        initializeAutoRefresh();
    }
    
    // Initialize search functionality
    initializeSearch();
    
    // Initialize filter functionality
    initializeFilters();
    
    // Add loading states to buttons
    initializeButtonLoading();
    
    console.log('Admin interface initialized');
}

// Initialize Bootstrap tooltips
function initializeTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Auto-refresh functionality
function initializeAutoRefresh() {
    const refreshToggle = document.getElementById('auto-refresh-toggle');
    if (refreshToggle) {
        refreshToggle.addEventListener('change', function() {
            if (this.checked) {
                startAutoRefresh();
            } else {
                stopAutoRefresh();
            }
        });
    }
}

function startAutoRefresh(interval = 30000) { // 30 seconds default
    stopAutoRefresh(); // Clear any existing interval
    refreshInterval = setInterval(function() {
        refreshDashboardData();
    }, interval);
    
    console.log('Auto-refresh started');
}

function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
        console.log('Auto-refresh stopped');
    }
}

// Refresh dashboard data via AJAX
function refreshDashboardData() {
    fetch(window.location.pathname + '?ajax=1')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateDashboardElements(data);
                showToast('success', 'Dashboard updated');
            }
        })
        .catch(error => {
            console.error('Auto-refresh failed:', error);
            showToast('error', 'Auto-refresh failed');
        });
}

// Update dashboard elements with new data
function updateDashboardElements(data) {
    // Update statistics
    const stats = data.stats;
    if (stats) {
        updateElement('total-votes', stats.total_votes);
        updateElement('unique-voters', stats.unique_voters);
        updateElement('last-updated', formatTimeAgo(stats.last_updated));
        
        // Update backend connection status
        const backendStatus = document.getElementById('backend-connection');
        if (backendStatus) {
            if (stats.backend_connected) {
                backendStatus.innerHTML = '<span class="text-success"><i class="fas fa-check-circle me-1"></i>Connected</span>';
            } else {
                backendStatus.innerHTML = '<span class="text-danger"><i class="fas fa-times-circle me-1"></i>Disconnected</span>';
            }
        }
    }
    
    // Update charts if data is available
    if (data.chart_data && chartInstances.votingChart) {
        updateChart('votingChart', data.chart_data);
    }
}

// Helper function to update element content
function updateElement(id, content) {
    const element = document.getElementById(id);
    if (element && content !== undefined) {
        element.textContent = content;
    }
}

// Search functionality
function initializeSearch() {
    const searchInputs = document.querySelectorAll('.search-input');
    searchInputs.forEach(input => {
        let searchTimeout;
        input.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                performSearch(this.value, this.dataset.searchType);
            }, 500); // Debounce search
        });
    });
}

function performSearch(query, searchType) {
    // This would implement live search functionality
    console.log(`Searching for: ${query} in ${searchType}`);
    // Implementation would depend on specific search requirements
}

// Filter functionality
function initializeFilters() {
    const filterSelects = document.querySelectorAll('.filter-select');
    filterSelects.forEach(select => {
        select.addEventListener('change', function() {
            applyFilter(this.value, this.dataset.filterType);
        });
    });
}

function applyFilter(value, filterType) {
    // This would implement filtering functionality
    console.log(`Applying filter: ${value} for ${filterType}`);
    // Implementation would depend on specific filter requirements
}

// Button loading states
function initializeButtonLoading() {
    const actionButtons = document.querySelectorAll('.action-btn');
    actionButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (!this.disabled) {
                showButtonLoading(this);
            }
        });
    });
}

function showButtonLoading(button, loadingText = 'Loading...') {
    button.dataset.originalText = button.innerHTML;
    button.innerHTML = `<i class="fas fa-spinner fa-spin me-1"></i>${loadingText}`;
    button.disabled = true;
}

function hideButtonLoading(button) {
    if (button.dataset.originalText) {
        button.innerHTML = button.dataset.originalText;
        delete button.dataset.originalText;
    }
    button.disabled = false;
}

// Toast notifications
function showToast(type, message, duration = 5000) {
    const toastContainer = getOrCreateToastContainer();
    
    const toastId = 'toast-' + Date.now();
    const toastHtml = `
        <div id="${toastId}" class="toast align-items-center text-white bg-${getBootstrapColorClass(type)} border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas ${getToastIcon(type)} me-2"></i>${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { delay: duration });
    toast.show();
    
    // Remove toast element after it's hidden
    toastElement.addEventListener('hidden.bs.toast', function() {
        this.remove();
    });
}

function getOrCreateToastContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '1055';
        document.body.appendChild(container);
    }
    return container;
}

function getBootstrapColorClass(type) {
    const colorMap = {
        'success': 'success',
        'error': 'danger',
        'warning': 'warning',
        'info': 'info'
    };
    return colorMap[type] || 'info';
}

function getToastIcon(type) {
    const iconMap = {
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-circle',
        'warning': 'fa-exclamation-triangle',
        'info': 'fa-info-circle'
    };
    return iconMap[type] || 'fa-info-circle';
}

// Chart utilities
function updateChart(chartId, newData) {
    const chart = chartInstances[chartId];
    if (chart && newData) {
        chart.data.labels = newData.labels;
        chart.data.datasets[0].data = newData.data;
        chart.update('none'); // No animation for live updates
    }
}

function destroyChart(chartId) {
    if (chartInstances[chartId]) {
        chartInstances[chartId].destroy();
        delete chartInstances[chartId];
    }
}

// Utility functions
function formatTimeAgo(timestamp) {
    if (!timestamp) return 'Never';
    
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return Math.floor(diffInSeconds / 60) + ' minutes ago';
    if (diffInSeconds < 86400) return Math.floor(diffInSeconds / 3600) + ' hours ago';
    return Math.floor(diffInSeconds / 86400) + ' days ago';
}

function formatNumber(num) {
    return new Intl.NumberFormat().format(num);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(function() {
        showToast('success', 'Copied to clipboard');
    }).catch(function(err) {
        console.error('Could not copy text: ', err);
        showToast('error', 'Failed to copy to clipboard');
    });
}

// API helper functions
function makeApiRequest(url, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        }
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    return fetch(url, mergedOptions)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        });
}

// Export functions for global use
window.adminUtils = {
    showToast,
    showButtonLoading,
    hideButtonLoading,
    makeApiRequest,
    formatTimeAgo,
    formatNumber,
    copyToClipboard,
    startAutoRefresh,
    stopAutoRefresh,
    updateChart,
    destroyChart
};

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    stopAutoRefresh();
    
    // Destroy all chart instances
    Object.keys(chartInstances).forEach(chartId => {
        destroyChart(chartId);
    });
});

// Handle AJAX errors globally
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    showToast('error', 'An unexpected error occurred');
});

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Ctrl/Cmd + R: Refresh dashboard
    if ((event.ctrlKey || event.metaKey) && event.key === 'r' && 
        (window.location.pathname.includes('dashboard') || window.location.pathname === '/')) {
        event.preventDefault();
        location.reload();
    }
    
    // Escape: Close modals
    if (event.key === 'Escape') {
        const openModals = document.querySelectorAll('.modal.show');
        openModals.forEach(modal => {
            const modalInstance = bootstrap.Modal.getInstance(modal);
            if (modalInstance) {
                modalInstance.hide();
            }
        });
    }
});

console.log('Admin JavaScript loaded successfully');
