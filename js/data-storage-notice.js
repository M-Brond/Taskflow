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
            }, 200);
        }, 200);
    });

    // Expand notice - with shorter animation times for mobile
    expandBtn.addEventListener('click', function() {
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
            }, 200);
        }, 200);
    });

    // Open export/import modal
    exportImportBtn.addEventListener('click', function() {
        openExportImportModal();
    });
});
