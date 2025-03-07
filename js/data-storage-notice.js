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

    // Minimize notice
    minimizeBtn.addEventListener('click', function() {
        dataStorageNotice.classList.add('hiding');
        
        setTimeout(() => {
            dataStorageNotice.style.display = 'none';
            minimizedNotice.style.display = 'block';
            minimizedNotice.classList.add('showing');
            
            setTimeout(() => {
                minimizedNotice.classList.remove('showing');
            }, 300);
        }, 300);
        
        localStorage.setItem('dataNoticeMinimized', 'true');
    });

    // Expand notice
    expandBtn.addEventListener('click', function() {
        minimizedNotice.classList.add('hiding');
        
        setTimeout(() => {
            minimizedNotice.style.display = 'none';
            dataStorageNotice.style.display = 'block';
            dataStorageNotice.classList.add('showing');
            
            setTimeout(() => {
                dataStorageNotice.classList.remove('showing');
            }, 300);
        }, 300);
        
        localStorage.setItem('dataNoticeMinimized', 'false');
    });

    // Open export/import modal
    exportImportBtn.addEventListener('click', function() {
        openExportImportModal();
    });
});
