// Data Storage Notice functionality
document.addEventListener('DOMContentLoaded', function() {
    // Get elements
    const dataStorageNotice = document.getElementById('dataStorageNotice');
    const minimizedNotice = document.getElementById('minimizedNotice');
    const minimizeBtn = document.getElementById('minimizeNoticeBtn');
    const expandBtn = document.getElementById('expandNoticeBtn');
    const exportImportBtn = document.getElementById('exportImportBtn');

    // Check if notice was previously minimized
    const isMinimized = localStorage.getItem('dataNoticeMinimized') === 'true';
    
    if (isMinimized) {
        dataStorageNotice.style.display = 'none';
        minimizedNotice.style.display = 'block';
    }

    // Minimize notice - with shorter animation times for mobile
    minimizeBtn.addEventListener('click', function() {
        // Immediately set the minimized state to prevent UI blocking
        localStorage.setItem('dataNoticeMinimized', 'true');
        
        dataStorageNotice.classList.add('hiding');
        
        // Reduced timeout for mobile
        setTimeout(() => {
            dataStorageNotice.style.display = 'none';
            minimizedNotice.style.display = 'block';
            minimizedNotice.classList.add('showing');
            
            setTimeout(() => {
                minimizedNotice.classList.remove('showing');
                // Ensure body scrolling is enabled
                document.body.style.overflow = '';
                document.body.style.touchAction = '';
            }, 200); // Reduced from 300ms
        }, 200); // Reduced from 300ms
    });

    // Expand notice - with shorter animation times for mobile
    expandBtn.addEventListener('click', function(e) {
        // Prevent any default behavior
        e.preventDefault();
        e.stopPropagation();
        
        // Immediately set the expanded state to prevent UI blocking
        localStorage.setItem('dataNoticeMinimized', 'false');
        
        minimizedNotice.classList.add('hiding');
        
        // Reduced timeout for mobile
        setTimeout(() => {
            minimizedNotice.style.display = 'none';
            dataStorageNotice.style.display = 'block';
            dataStorageNotice.classList.add('showing');
            
            setTimeout(() => {
                dataStorageNotice.classList.remove('showing');
                // Ensure body scrolling is enabled
                document.body.style.overflow = '';
                document.body.style.touchAction = '';
            }, 200); // Reduced from 300ms
        }, 200); // Reduced from 300ms
    });

    // Open export/import modal
    exportImportBtn.addEventListener('click', function() {
        openExportImportModal();
    });
    
    // Add a click handler to the document to ensure scrolling works
    document.addEventListener('click', function(e) {
        // If we're not clicking on the minimized notice or its children
        if (!minimizedNotice.contains(e.target)) {
            // Ensure body scrolling is enabled
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
        }
    });
});
