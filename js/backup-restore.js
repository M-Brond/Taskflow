// Backup and Restore functionality for TaskFlow
// This file contains all the functions related to data backup and restore

// Global variables for data storage notice
let minimizeNoticeHandler, expandNoticeHandler;
let dataStorageNoticeInitialized = false;

/**
 * Initialize the data storage notice with backup and restore functionality
 * This implements a modern design for the data storage notice
 */
function initDataStorageNotice() {
    if (dataStorageNoticeInitialized) return;
    
    const dataStorageNotice = document.getElementById('dataStorageNotice');
    const minimizedNotice = document.getElementById('minimizedNotice');
    const minimizeNoticeBtn = document.getElementById('minimizeNoticeBtn');
    const expandNoticeBtn = document.getElementById('expandNoticeBtn');
    const exportImportBtn = document.getElementById('exportImportBtn');
    
    // Always show the notice by default (overriding previous settings)
    localStorage.setItem('taskflow_notice_minimized', 'false');
    
    // Check if notice should be minimized based on localStorage (but we've just set it to false)
    const isNoticeMinimized = localStorage.getItem('taskflow_notice_minimized') === 'true';
    
    if (isNoticeMinimized) {
        dataStorageNotice.style.display = 'none';
        minimizedNotice.style.display = 'flex';
    } else {
        dataStorageNotice.style.display = 'flex';
        minimizedNotice.style.display = 'none';
    }
    
    // Make sure the minimized notice is visible in the DOM
    minimizedNotice.style.opacity = '1';
    
    // Reset any existing classes that might interfere with visibility
    minimizedNotice.classList.remove('hiding', 'showing');
    dataStorageNotice.classList.remove('hiding', 'showing');
    
    // Remove any existing event listeners
    if (minimizeNoticeHandler) {
        minimizeNoticeBtn.removeEventListener('click', minimizeNoticeHandler);
    }
    
    if (expandNoticeHandler) {
        expandNoticeBtn.removeEventListener('click', expandNoticeHandler);
    }
    
    // Define simplified event handlers without complex animations
    minimizeNoticeHandler = function() {
        // Simple transition - hide main notice
        dataStorageNotice.style.display = 'none';
        
        // Show minimized notice
        minimizedNotice.style.display = 'flex';
        minimizedNotice.style.opacity = '1';
        
        // Save preference
        localStorage.setItem('taskflow_notice_minimized', 'true');
    };
    
    expandNoticeHandler = function() {
        // Simple transition - hide minimized notice
        minimizedNotice.style.display = 'none';
        
        // Show main notice
        dataStorageNotice.style.display = 'flex';
        dataStorageNotice.style.opacity = '1';
        
        // Save preference
        localStorage.setItem('taskflow_notice_minimized', 'false');
    };
    
    // Add event listeners
    minimizeNoticeBtn.addEventListener('click', minimizeNoticeHandler);
    expandNoticeBtn.addEventListener('click', expandNoticeHandler);
    
    // Setup export/import button
    exportImportBtn.addEventListener('click', openExportImportModal);
    
    // Setup export/import modal if it exists
    const exportImportModal = document.getElementById('exportImportModal');
    if (exportImportModal) {
        // Make sure we don't have duplicate event listeners
        const importFileInput = document.getElementById('importFileInput');
        if (importFileInput) {
            // Remove any existing listeners
            const newImportFileInput = importFileInput.cloneNode(true);
            importFileInput.parentNode.replaceChild(newImportFileInput, importFileInput);
            
            // Add fresh listener
            newImportFileInput.addEventListener('change', handleFileImport);
        }
        
        // Add event listener to the close button
        const closeModalBtn = document.querySelector('#exportImportModal .close-modal');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', closeExportImportModal);
        }
    }
    
    // Mark as initialized
    dataStorageNoticeInitialized = true;
}

/**
 * Open the export/import modal
 */
function openExportImportModal() {
    const modal = document.getElementById('exportImportModal');
    modal.style.display = 'flex';
    
    // Clear any previous import status
    document.getElementById('importStatus').textContent = '';
    document.getElementById('importStatus').className = 'import-status';
    
    // Setup the export button
    setupExportButton();
    
    // Setup the import button
    setupImportButton();
}

/**
 * Setup the export button with proper event listener
 */
function setupExportButton() {
    const exportDataBtn = document.getElementById('exportDataBtn');
    if (exportDataBtn) {
        // Remove any existing listeners
        const newExportDataBtn = exportDataBtn.cloneNode(true);
        exportDataBtn.parentNode.replaceChild(newExportDataBtn, exportDataBtn);
        
        // Add fresh listener
        newExportDataBtn.addEventListener('click', exportData);
    }
}

/**
 * Setup the import button with proper event listener
 */
function setupImportButton() {
    const importDataBtn = document.getElementById('importDataBtn');
    if (importDataBtn) {
        // Remove any existing listeners
        const newImportDataBtn = importDataBtn.cloneNode(true);
        importDataBtn.parentNode.replaceChild(newImportDataBtn, importDataBtn);
        
        // Add fresh listener
        newImportDataBtn.addEventListener('click', function() {
            document.getElementById('importFileInput').click();
        });
    }
    
    // Setup file input change listener
    const importFileInput = document.getElementById('importFileInput');
    if (importFileInput) {
        // Remove any existing listeners
        const newImportFileInput = importFileInput.cloneNode(true);
        importFileInput.parentNode.replaceChild(newImportFileInput, importFileInput);
        
        // Add fresh listener
        newImportFileInput.addEventListener('change', handleFileImport);
    }
}

/**
 * Close the export/import modal
 */
function closeExportImportModal() {
    const modal = document.getElementById('exportImportModal');
    modal.style.display = 'none';
}

/**
 * Export all app data to a JSON file
 */
function exportData() {
    // Create a data object with all the app data
    const appData = {
        todos: todos,
        projects: projects,
        hiddenProjects: Array.from(hiddenProjects),
        projectColors: projectColors,
        version: '1.0' // For future compatibility checks
    };
    
    // Convert to JSON string
    const jsonData = JSON.stringify(appData, null, 2);
    
    // Create a blob and download link
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary download link
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    
    // Generate filename with date
    const date = new Date();
    const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    downloadLink.download = `taskflow-backup-${dateStr}.json`;
    
    // Trigger download
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // Clean up
    URL.revokeObjectURL(url);
}

/**
 * Trigger file input for importing data
 */
function importData() {
    // Trigger file input click
    const fileInput = document.getElementById('importFileInput');
    fileInput.click();
}

/**
 * Handle file import when a file is selected
 */
function handleFileImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Validate imported data
            if (!importedData.todos || !importedData.projects || !importedData.version) {
                throw new Error('Invalid backup file format');
            }
            
            // Update app data
            todos = importedData.todos;
            projects = importedData.projects;
            
            // Handle hidden projects (convert from array to Set)
            if (importedData.hiddenProjects) {
                hiddenProjects = new Set(importedData.hiddenProjects);
            }
            
            // Handle project colors
            if (importedData.projectColors) {
                projectColors = importedData.projectColors;
            }
            
            // Save to localStorage
            saveData();
            
            // Update UI
            renderAll();
            
            // Show success message
            const importStatus = document.getElementById('importStatus');
            importStatus.textContent = 'Data imported successfully!';
            importStatus.className = 'import-status success';
            
            // Reset file input
            e.target.value = '';
            
        } catch (error) {
            console.error('Import error:', error);
            
            // Show error message
            const importStatus = document.getElementById('importStatus');
            importStatus.textContent = 'Error: Invalid backup file format';
            importStatus.className = 'import-status error';
            
            // Reset file input
            e.target.value = '';
        }
    };
    
    reader.readAsText(file);
}

/**
 * Remove any duplicate backup & restore sections that might be present
 */
function removeDuplicateBackupRestoreSections() {
    // Get all elements with "Backup & Restore Tasks" heading
    const backupHeadings = Array.from(document.querySelectorAll('h2')).filter(h => 
        h.textContent.includes('Backup & Restore Tasks') && 
        !h.closest('#exportImportModal')
    );
    
    // Remove any backup sections outside the modal
    backupHeadings.forEach(heading => {
        const section = heading.closest('div');
        if (section && section.parentNode) {
            section.parentNode.removeChild(section);
        }
    });
}

// Initialize the backup and restore functionality when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize data storage notice
    initDataStorageNotice();
    
    // Remove any duplicate backup sections
    removeDuplicateBackupRestoreSections();
});
