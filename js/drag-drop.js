/**
 * TaskFlow Drag and Drop Module
 * Handles all drag and drop functionality for reordering and moving tasks between projects
 * Using SortableJS for improved drag and drop experience
 */

// Store all Sortable instances for cleanup
let sortableInstances = [];

/**
 * Initialize drag and drop functionality
 * This function is called when the app is initialized
 */
function setupDragAndDrop() {
    // Load SortableJS if not already loaded
    if (typeof Sortable === 'undefined') {
        loadSortableJS();
    } else {
        initializeSortable();
    }
}

/**
 * Load SortableJS library dynamically
 */
function loadSortableJS() {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/sortablejs@1.14.0/Sortable.min.js';
    script.onload = function() {
        console.log('SortableJS loaded successfully');
        initializeSortable();
    };
    script.onerror = function() {
        console.error('Failed to load SortableJS');
    };
    document.head.appendChild(script);
}

/**
 * Initialize Sortable on all project task lists
 */
function initializeSortable() {
    // Clean up existing instances
    cleanupSortableInstances();
    
    // Get all project task lists
    const taskLists = document.querySelectorAll('.project-todos');
    
    // Initialize Sortable on each list
    taskLists.forEach(taskList => {
        const projectId = taskList.dataset.project;
        
        const sortable = new Sortable(taskList, {
            group: 'tasks',  // This allows dragging between different lists
            animation: 150,  // Animation speed in ms
            ghostClass: 'sortable-ghost',  // Class for the dragged item
            chosenClass: 'sortable-chosen',  // Class for the chosen item
            dragClass: 'sortable-drag',  // Class for the dragging item
            handle: '.todo-item',  // Drag handle
            filter: '.completed',  // Don't allow dragging completed items
            preventOnFilter: true,  // Prevent default action on filtered elements
            onStart: function(evt) {
                // Close any open comments for this item
                const todoId = evt.item.dataset.id;
                const commentsSection = document.getElementById(`comments-${todoId}`);
                if (commentsSection && commentsSection.classList.contains('show-comments')) {
                    commentsSection.classList.remove('show-comments');
                }
                
                console.log('Drag started for todo item:', todoId);
            },
            onEnd: function(evt) {
                const todoId = parseInt(evt.item.dataset.id);
                const newProjectId = evt.to.dataset.project;
                const oldProjectId = evt.from.dataset.project;
                
                console.log('Drag ended for todo item:', todoId, 'from', oldProjectId, 'to', newProjectId);
                
                // Find the next sibling to determine position
                let nextElement = evt.item.nextElementSibling;
                while (nextElement && nextElement.classList.contains('completed')) {
                    nextElement = nextElement.nextElementSibling;
                }
                
                // Call the app's updateTaskPosition function to update the data model
                window.updateTaskPosition(todoId, newProjectId, nextElement);
                
                // No need to re-render all since Sortable already updates the DOM
                // Just save the data
                if (window.saveTodos) {
                    window.saveTodos();
                } else if (window.saveData) {
                    window.saveData();
                }
            }
        });
        
        // Store the instance for cleanup
        sortableInstances.push(sortable);
        
        console.log('Sortable initialized for project:', projectId);
    });
}

/**
 * Clean up existing Sortable instances
 */
function cleanupSortableInstances() {
    sortableInstances.forEach(instance => {
        if (instance && typeof instance.destroy === 'function') {
            instance.destroy();
        }
    });
    sortableInstances = [];
}

/**
 * Add event listeners to draggable items and drop containers
 * This function is called after rendering to ensure all elements have listeners
 */
function addDragAndDropListeners() {
    // With SortableJS, we just need to reinitialize Sortable
    if (typeof Sortable !== 'undefined') {
        initializeSortable();
    }
}

/**
 * Add CSS styles for drag and drop
 */
function addDragAndDropStyles() {
    // Create a style element if it doesn't exist
    let styleEl = document.getElementById('drag-drop-styles');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'drag-drop-styles';
        document.head.appendChild(styleEl);
    }
    
    // Add styles for SortableJS
    styleEl.textContent = `
        .sortable-ghost {
            opacity: 0.4;
            background-color: #f0f0f0;
            border: 2px dashed #aaa !important;
        }
        
        .dark-mode .sortable-ghost {
            background-color: #333;
            border: 2px dashed #666 !important;
        }
        
        .sortable-chosen {
            cursor: grabbing;
        }
        
        .sortable-drag {
            opacity: 0.8;
            cursor: grabbing;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        
        .todo-item {
            cursor: grab;
        }
        
        .todo-item.completed {
            cursor: default;
        }
    `;
}

// Add styles when the module loads
addDragAndDropStyles();

// Export the public API
window.dragDropModule = {
    setupDragAndDrop,
    addDragAndDropListeners
};
