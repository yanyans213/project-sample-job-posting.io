// Job Posting System JavaScript

class JobPostingSystem {
    constructor() {
        this.jobs = JSON.parse(localStorage.getItem('jobs')) || [];
        this.currentUser = null;
        this.currentSort = 'date';
        this.editingJobId = null;
        this.isEditMode = false;
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.totalPages = 1;
        this.filters = {
            dateFrom: '',
            dateTo: '',
            color: '',
            status: '',
            section: '',
            port: '',
            search: ''
        };
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateStats();
        this.renderJobs();
        this.updateSortButtons();
        
        // Set today's date as default
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('jobDate').value = today;
    }

    bindEvents() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Navigation
        document.getElementById('addJobBtn').addEventListener('click', () => {
            this.showPage('addJobPage');
        });

        document.getElementById('backToDashboard').addEventListener('click', () => {
            this.showPage('dashboardPage');
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Add job form
        document.getElementById('addJobForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddJob();
        });

        // Table header sorting
        document.querySelectorAll('.sortable').forEach(header => {
            header.addEventListener('click', () => {
                const sortField = header.dataset.sort;
                this.toggleSort(sortField);
            });
        });

        // Modal close
        document.querySelector('.close').addEventListener('click', () => {
            this.closeModal();
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('jobModal');
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }

    changeItemsPerPage(newItemsPerPage) {
        this.itemsPerPage = parseInt(newItemsPerPage);
        this.currentPage = 1; // Reset to first page
        this.renderJobs();
    }

    goToPage(pageNumber) {
        if (pageNumber >= 1 && pageNumber <= this.totalPages) {
            this.currentPage = pageNumber;
            this.renderJobs();
        }
    }

    calculatePagination(totalItems) {
        this.totalPages = Math.ceil(totalItems / this.itemsPerPage);
        if (this.currentPage > this.totalPages) {
            this.currentPage = Math.max(1, this.totalPages);
        }
    }

    updatePaginationControls(totalItems, currentItems) {
        // Update table info
        const startItem = totalItems === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1;
        const endItem = Math.min(this.currentPage * this.itemsPerPage, totalItems);
        document.getElementById('tableInfo').textContent = 
            `Showing ${startItem}-${endItem} of ${totalItems} jobs`;
        
        // Update pagination info
        document.getElementById('paginationInfo').textContent = 
            `Page ${this.currentPage} of ${this.totalPages}`;
        
        // Update pagination buttons
        const firstBtn = document.getElementById('firstPageBtn');
        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');
        const lastBtn = document.getElementById('lastPageBtn');
        
        firstBtn.disabled = this.currentPage === 1;
        prevBtn.disabled = this.currentPage === 1;
        nextBtn.disabled = this.currentPage === this.totalPages || this.totalPages === 0;
        lastBtn.disabled = this.currentPage === this.totalPages || this.totalPages === 0;
        
        // Update page numbers
        this.renderPageNumbers();
    }

    renderPageNumbers() {
        const pageNumbersContainer = document.getElementById('pageNumbers');
        pageNumbersContainer.innerHTML = '';
        
        if (this.totalPages <= 1) return;
        
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
        
        // Adjust start page if we're near the end
        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        // Add first page and ellipsis if needed
        if (startPage > 1) {
            this.createPageButton(1);
            if (startPage > 2) {
                this.createEllipsis();
            }
        }
        
        // Add visible page numbers
        for (let i = startPage; i <= endPage; i++) {
            this.createPageButton(i);
        }
        
        // Add ellipsis and last page if needed
        if (endPage < this.totalPages) {
            if (endPage < this.totalPages - 1) {
                this.createEllipsis();
            }
            this.createPageButton(this.totalPages);
        }
    }

    createPageButton(pageNumber) {
        const button = document.createElement('button');
        button.className = `page-number ${pageNumber === this.currentPage ? 'active' : ''}`;
        button.textContent = pageNumber;
        button.onclick = () => this.goToPage(pageNumber);
        document.getElementById('pageNumbers').appendChild(button);
    }

    createEllipsis() {
        const ellipsis = document.createElement('span');
        ellipsis.className = 'page-number ellipsis';
        ellipsis.textContent = '...';
        document.getElementById('pageNumbers').appendChild(ellipsis);
    }

    getPaginatedJobs(jobs) {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return jobs.slice(startIndex, endIndex);
    }

    handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // Simple authentication (in real app, this would be server-side)
        if (username === 'admin' && password === 'admin123') {
            this.currentUser = username;
            this.showPage('dashboardPage');
            this.showNotification('Login successful!', 'success');
        } else {
            this.showNotification('Invalid credentials. Use admin/admin123', 'error');
        }
    }

    handleLogout() {
        this.currentUser = null;
        this.showPage('loginPage');
        document.getElementById('loginForm').reset();
        this.showNotification('Logged out successfully!', 'success');
    }

    handleAddJob() {
        const formData = new FormData(document.getElementById('addJobForm'));
        const job = {
            id: Date.now(),
            date: formData.get('date'),
            color: formData.get('color'),
            port: formData.get('port'),
            status: formData.get('status'),
            section: formData.get('section'),
            entryNo: formData.get('entryNo'),
            containerNo: formData.get('containerNo'),
            remarks: formData.get('remarks'),
            createdAt: new Date().toISOString()
        };

        this.jobs.push(job);
        this.saveJobs();
        this.renderJobs();
        this.updateStats();
        
        document.getElementById('addJobForm').reset();
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('jobDate').value = today;
        
        this.showNotification('Job added successfully!', 'success');
        this.showPage('dashboardPage');
    }

    applyFilters() {
        this.filters.dateFrom = document.getElementById('filterDateFrom').value;
        this.filters.dateTo = document.getElementById('filterDateTo').value;
        this.filters.color = document.getElementById('filterColor').value;
        this.filters.status = document.getElementById('filterStatus').value;
        this.filters.section = document.getElementById('filterSection').value;
        this.filters.port = document.getElementById('filterPort').value;
        this.filters.search = document.getElementById('searchEntry').value.toLowerCase();
        
        this.renderJobs();
        this.updateFilterStatus();
    }

    clearFilters() {
        document.getElementById('filterDateFrom').value = '';
        document.getElementById('filterDateTo').value = '';
        document.getElementById('filterColor').value = '';
        document.getElementById('filterStatus').value = '';
        document.getElementById('filterSection').value = '';
        document.getElementById('filterPort').value = '';
        document.getElementById('searchEntry').value = '';
        
        this.filters = {
            dateFrom: '',
            dateTo: '',
            color: '',
            status: '',
            section: '',
            port: '',
            search: ''
        };
        
        this.renderJobs();
        this.updateFilterStatus();
        this.showNotification('Filters cleared!', 'info');
    }

    updateFilterStatus() {
        const activeFilters = [];
        if (this.filters.dateFrom && this.filters.dateTo) {
            activeFilters.push(`Date: ${this.formatDate(this.filters.dateFrom)} to ${this.formatDate(this.filters.dateTo)}`);
        } else if (this.filters.dateFrom) {
            activeFilters.push(`Date from: ${this.formatDate(this.filters.dateFrom)}`);
        } else if (this.filters.dateTo) {
            activeFilters.push(`Date to: ${this.formatDate(this.filters.dateTo)}`);
        }
        
        if (this.filters.color) activeFilters.push(`Color: ${this.filters.color}`);
        if (this.filters.status) activeFilters.push(`Status: ${this.filters.status}`);
        if (this.filters.section) activeFilters.push(`Section: ${this.filters.section}`);
        if (this.filters.port) activeFilters.push(`Port: ${this.filters.port}`);
        if (this.filters.search) activeFilters.push(`Search: ${this.filters.search}`);
        
        const statusElement = document.querySelector('.filter-status');
        if (activeFilters.length > 0) {
            statusElement.textContent = `Active filters: ${activeFilters.join(', ')}`;
        } else {
            statusElement.textContent = 'No filters applied';
        }
    }

    filterJobs(jobs) {
        return jobs.filter(job => {
            // Date range filter
            if (this.filters.dateFrom || this.filters.dateTo) {
                const jobDate = new Date(job.date);
                
                if (this.filters.dateFrom) {
                    const fromDate = new Date(this.filters.dateFrom);
                    if (jobDate < fromDate) return false;
                }
                
                if (this.filters.dateTo) {
                    const toDate = new Date(this.filters.dateTo);
                    if (jobDate > toDate) return false;
                }
            }
            
            // Color filter
            if (this.filters.color && job.color !== this.filters.color) {
                return false;
            }
            
            // Status filter
            if (this.filters.status && job.status !== this.filters.status) {
                return false;
            }
            
            // Section filter
            if (this.filters.section && job.section !== this.filters.section) {
                return false;
            }
            
            // Port filter
            if (this.filters.port && job.port !== this.filters.port) {
                return false;
            }
            
            // Search filter (Entry No.)
            if (this.filters.search && !job.entryNo.toLowerCase().includes(this.filters.search)) {
                return false;
            }
            
            return true;
        });
    }

    setSortField(field) {
        this.currentSort = field;
        this.updateSortButtons();
        this.renderJobs();
    }

    updateSortButtons() {
        // Remove active class from all buttons
        document.querySelectorAll('.sort-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active class to current sort button
        const activeBtn = document.querySelector(`[data-sort="${this.currentSort}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }

    toggleSort(field) {
        this.setSortField(field);
    }

    sortJobs(jobs) {
        return [...jobs].sort((a, b) => {
            let aValue = a[this.currentSort];
            let bValue = b[this.currentSort];

            // Handle date sorting
            if (this.currentSort === 'date') {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            }

            // Handle string sorting (case insensitive)
            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            if (aValue > bValue) return 1;
            if (aValue < bValue) return -1;
            return 0;
        });
    }

    renderJobs() {
        const tbody = document.getElementById('jobsTableBody');
        
        // Apply filters first, then sort
        let filteredJobs = this.filterJobs(this.jobs);
        const sortedJobs = this.sortJobs(filteredJobs);
        
        // Calculate pagination
        this.calculatePagination(sortedJobs.length);
        
        // Get paginated jobs
        const paginatedJobs = this.getPaginatedJobs(sortedJobs);
        
        // Update pagination controls
        this.updatePaginationControls(sortedJobs.length, paginatedJobs.length);
        
        // Update filtered jobs count
        document.getElementById('filteredJobs').textContent = sortedJobs.length;
        
        if (paginatedJobs.length === 0) {
            const message = this.jobs.length === 0 ? 
                'No jobs found. Click "Add New Job" to create your first job posting.' :
                'No jobs match your current filters. Try adjusting your filter criteria.';
            
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="empty-state">
                        <h3>No jobs found</h3>
                        <p>${message}</p>
                    </td>
                </tr>
            `;
            return;
        }

        const startRowNumber = (this.currentPage - 1) * this.itemsPerPage + 1;
        
        tbody.innerHTML = paginatedJobs.map((job, index) => `
            <tr>
                <td><span class="row-number">${startRowNumber + index}</span></td>
                <td>${this.formatDate(job.date)}</td>
                <td><strong>${job.entryNo}</strong></td>
                <td>${job.containerNo}</td>
                <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${job.port}">${job.port}</td>
                <td><strong>Section ${job.section}</strong></td>
                <td><span class="status-badge status-${job.status.toLowerCase()}">${job.status}</span></td>
                <td>
                    <div class="color-indicator">
                        <div class="color-dot" style="background-color: ${job.color.toLowerCase()};"></div>
                        <span>${job.color}</span>
                    </div>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-info" onclick="jobSystem.viewJob(${job.id})">View</button>
                        <button class="btn btn-danger" onclick="jobSystem.deleteJob(${job.id})">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    viewJob(jobId) {
        const job = this.jobs.find(j => j.id === jobId);
        if (!job) return;

        this.editingJobId = jobId;
        this.isEditMode = false;
        document.getElementById('modalTitle').textContent = 'Job Details';

        this.renderJobModal(job);
        const modal = document.getElementById('jobModal');
        modal.style.display = 'block';
        
        // Add animation class
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }

    renderJobModal(job) {
        const modalBody = document.getElementById('jobModalBody');
        const modeClass = this.isEditMode ? 'edit-mode' : 'view-mode';
        
        const portOptions = [
            'MCT - Mindanao Container Terminal',
            'LGICT - Laguna Gateway Terminal',
            'VCT - Visayas Container Terminal',
            'MGT - Matadi Gateway Terminal',
            'SPICT - South Pacific International Container',
            'MITL - Motukea International Terminal',
            'BICT - Batumi International Container Terminal',
            'OMT - Onne Multipurpose Terminal',
            'TecPlata - TecPlata S.A.',
            'AGCT - Adriatic Gate Container Terminal',
            'MICT - Manila International Container Terminal',
            'NORTHPORT - Manila North Harbor Port International Terminal',
            'SBITC - Subic Bay International Terminals',
            'POM - Port of Manila'
        ];
        
        // Status indicator
        const isActive = job.status !== 'Done';
        const statusIndicator = `
            <div class="modal-status-indicator ${isActive ? 'active' : 'inactive'}">
                <span>${isActive ? '🟢' : '🔴'}</span>
                ${isActive ? 'Active Job' : 'Completed Job'}
            </div>
        `;
        
        modalBody.innerHTML = `
            ${statusIndicator}
            <form id="viewEditJobForm" class="view-form ${modeClass}">
                <div class="form-group form-field-group">
                    <label for="viewEditDate">📅 Date</label>
                    <input type="date" id="viewEditDate" name="date" value="${job.date}" ${!this.isEditMode ? 'readonly' : ''} required>
                    ${this.isEditMode ? '<span class="field-icon"></span>' : ''}
                </div>
                <div class="form-group form-field-group">
                    <label for="viewEditColor">🎨 Color</label>
                    <select id="viewEditColor" name="color" ${!this.isEditMode ? 'disabled' : ''} required>
                        <option value="Red" ${job.color === 'Red' ? 'selected' : ''}>🔴 Red</option>
                        <option value="Blue" ${job.color === 'Blue' ? 'selected' : ''}>🔵 Blue</option>
                        <option value="Green" ${job.color === 'Green' ? 'selected' : ''}>🟢 Green</option>
                        <option value="Yellow" ${job.color === 'Yellow' ? 'selected' : ''}>🟡 Yellow</option>
                        <option value="Orange" ${job.color === 'Orange' ? 'selected' : ''}>🟠 Orange</option>
                        <option value="Purple" ${job.color === 'Purple' ? 'selected' : ''}>🟣 Purple</option>
                        <option value="Black" ${job.color === 'Black' ? 'selected' : ''}>⚫ Black</option>
                        <option value="White" ${job.color === 'White' ? 'selected' : ''}>⚪ White</option>
                    </select>
                </div>
                <div class="form-group form-field-group">
                    <label for="viewEditPort">🚢 Port</label>
                    <select id="viewEditPort" name="port" ${!this.isEditMode ? 'disabled' : ''} required>
                        ${portOptions.map(port => 
                            `<option value="${port}" ${job.port === port ? 'selected' : ''}>${port}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group form-field-group">
                    <label for="viewEditStatus">📊 Status</label>
                    <select id="viewEditStatus" name="status" ${!this.isEditMode ? 'disabled' : ''} required>
                        <option value="Lodge" ${job.status === 'Lodge' ? 'selected' : ''}>🏢 Lodge</option>
                        <option value="Marine" ${job.status === 'Marine' ? 'selected' : ''}>⚓ Marine</option>
                        <option value="Examiner" ${job.status === 'Examiner' ? 'selected' : ''}>🔍 Examiner</option>
                        <option value="Appraiser" ${job.status === 'Appraiser' ? 'selected' : ''}>💰 Appraiser</option>
                        <option value="Final" ${job.status === 'Final' ? 'selected' : ''}>📋 Final</option>
                        <option value="Done" ${job.status === 'Done' ? 'selected' : ''}>✅ Done</option>
                    </select>
                </div>
                <div class="form-group form-field-group">
                    <label for="viewEditSection">📂 Section</label>
                    <select id="viewEditSection" name="section" ${!this.isEditMode ? 'disabled' : ''} required>
                        ${Array.from({length: 15}, (_, i) => i + 1).map(num => 
                            `<option value="${num}" ${job.section == num ? 'selected' : ''}>Section ${num}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group form-field-group">
                    <label for="viewEditEntryNo">🔢 Entry No.</label>
                    <input type="text" id="viewEditEntryNo" name="entryNo" value="${job.entryNo}" ${!this.isEditMode ? 'readonly' : ''} required>
                    ${this.isEditMode ? '<span class="field-icon">🔢</span>' : ''}
                </div>
                <div class="form-group full-width form-field-group">
                    <label for="viewEditContainerNo">📦 Container No.</label>
                    <input type="text" id="viewEditContainerNo" name="containerNo" value="${job.containerNo}" ${!this.isEditMode ? 'readonly' : ''} required>
                    ${this.isEditMode ? '<span class="field-icon">📦</span>' : ''}
                </div>
                <div class="form-group full-width">
                    <label for="viewEditRemarks">📝 Remarks</label>
                    <textarea id="viewEditRemarks" name="remarks" rows="4" ${!this.isEditMode ? 'readonly' : ''} placeholder="${this.isEditMode ? 'Enter any additional remarks or notes...' : ''}">${job.remarks || ''}</textarea>
                </div>
            </form>
            <div class="modal-info-section">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <strong>📅 Created:</strong><br>
                        ${this.formatDateTime(job.createdAt)}
                    </div>
                    ${job.updatedAt ? `
                    <div>
                        <strong>🔄 Last Updated:</strong><br>
                        ${this.formatDateTime(job.updatedAt)}
                    </div>
                    ` : '<div></div>'}
                </div>
                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #ddd;">
                    <strong>Job ID:</strong> #${job.id} | 
                    <strong>Total Days:</strong> ${this.calculateDaysSince(job.createdAt)} days
                </div>
            </div>
        `;

        this.updateModalFooter();
    }

    // Add this new method to calculate days since creation
    calculateDaysSince(dateString) {
        const createdDate = new Date(dateString);
        const currentDate = new Date();
        const timeDiff = currentDate.getTime() - createdDate.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        return daysDiff;
    }

    updateModalFooter() {
        const modalFooter = document.getElementById('modalFooter');
        
        if (this.isEditMode) {
            modalFooter.innerHTML = `
                <button type="button" class="btn btn-secondary" onclick="jobSystem.cancelEdit()">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="jobSystem.saveJobEdit()">Save Changes</button>
            `;
        } else {
            modalFooter.innerHTML = `
                <button type="button" class="btn btn-secondary" onclick="jobSystem.closeModal()">Close</button>
                <button type="button" class="btn btn-primary" onclick="jobSystem.enableEditMode()">Edit</button>
            `;
        }
    }

    enableEditMode() {
        this.isEditMode = true;
        document.getElementById('modalTitle').textContent = 'Edit Job Details';
        
        const job = this.jobs.find(j => j.id === this.editingJobId);
        this.renderJobModal(job);
    }

    cancelEdit() {
        this.isEditMode = false;
        document.getElementById('modalTitle').textContent = 'Job Details';
        
        const job = this.jobs.find(j => j.id === this.editingJobId);
        this.renderJobModal(job);
    }

    saveJobEdit() {
        const form = document.getElementById('viewEditJobForm');
        const formData = new FormData(form);
        
        const jobIndex = this.jobs.findIndex(job => job.id === this.editingJobId);
        if (jobIndex === -1) return;

        // Update job with new data
        this.jobs[jobIndex] = {
            ...this.jobs[jobIndex],
            date: formData.get('date'),
            color: formData.get('color'),
            port: formData.get('port'),
            status: formData.get('status'),
            section: formData.get('section'),
            entryNo: formData.get('entryNo'),
            containerNo: formData.get('containerNo'),
            remarks: formData.get('remarks'),
            updatedAt: new Date().toISOString()
        };

        this.saveJobs();
        this.renderJobs();
        this.updateStats();
        this.closeModal();
        this.showNotification('Job updated successfully!', 'success');
    }

    deleteJob(jobId) {
        if (confirm('Are you sure you want to delete this job?')) {
            this.jobs = this.jobs.filter(job => job.id !== jobId);
            this.saveJobs();
            this.renderJobs();
            this.updateStats();
            this.showNotification('Job deleted successfully!', 'success');
        }
    }

    updateStats() {
        const totalJobs = this.jobs.length;
        const activeJobs = this.jobs.filter(job => 
            job.status !== 'Done'
        ).length;

        document.getElementById('totalJobs').textContent = totalJobs;
        document.getElementById('activeJobs').textContent = activeJobs;
        
        // Update filtered jobs count
        const filteredJobs = this.filterJobs(this.jobs);
        document.getElementById('filteredJobs').textContent = filteredJobs.length;
    }

    showPage(pageId) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Show selected page
        document.getElementById(pageId).classList.add('active');
    }

    closeModal() {
        const modal = document.getElementById('jobModal');
        modal.classList.remove('show');
        
        setTimeout(() => {
            modal.style.display = 'none';
            this.editingJobId = null;
            this.isEditMode = false;
        }, 300);
    }

    saveJobs() {
        localStorage.setItem('jobs', JSON.stringify(this.jobs));
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 4px;
            color: white;
            font-weight: 500;
            z-index: 1001;
            animation: slideIn 0.3s ease-out;
            max-width: 300px;
        `;

        // Set background color based on type
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            info: '#17a2b8',
            warning: '#ffc107'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        notification.textContent = message;

        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(notification);

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 3000);
    }
}

// Initialize the system
const jobSystem = new JobPostingSystem();

// Add some sample data for demonstration
if (jobSystem.jobs.length === 0) {
    const sampleJobs = [
        {
            id: 1,
            date: '2024-08-06',
            color: 'Blue',
            port: 'MCT - Mindanao Container Terminal',
            status: 'Marine',
            section: '1',
            entryNo: 'ENT001',
            containerNo: 'CONT12345',
            remarks: 'Priority shipment - handle with care',
            createdAt: '2024-01-15T10:30:00.000Z'
        },
        {
            id: 2,
            date: '2024-08-06',
            color: 'Green',
            port: 'LGICT - Laguna Gateway Terminal',
            status: 'Lodge',
            section: '2',
            entryNo: 'ENT002',
            containerNo: 'CONT67890',
            remarks: 'Standard processing',
            createdAt: '2024-01-16T14:15:00.000Z'
        },
        {
            id: 3,
            date: '2024-01-17',
            color: 'Green',
            port: 'VCT - Visayas Container Terminal',
            status: 'Examiner',
            section: '3',
            entryNo: 'ENT003',
            containerNo: 'CONT11111',
            remarks: 'Requires special inspection',
            createdAt: '2024-01-17T09:15:00.000Z'
        },
        {
            id: 4,
            date: '2024-01-18',
            color: 'Yellow',
            port: 'MGT - Matadi Gateway Terminal',
            status: 'Done',
            section: '4',
            entryNo: 'ENT004',
            containerNo: 'CONT22222',
            remarks: 'Completed successfully',
            createdAt: '2024-01-18T16:45:00.000Z'
        }
    ];
    
    jobSystem.jobs = sampleJobs;
    jobSystem.saveJobs();
    jobSystem.renderJobs();
    jobSystem.updateStats();
}
