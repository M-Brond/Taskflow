/**
 * TaskFlow Drag and Drop Module
 * Handles all drag and drop functionality for reordering and moving tasks between projects
 */

// Global variables for drag and drop state
let draggedItem = null;
let originalContainer = null;

/**
 * Initialize drag and drop functionality
 * This function is called when the app is initialized
 */
function setupDragAndDrop() {
    addDragAndDropListeners();
}

/**
 * Add event listeners to draggable items and drop containers
 * This function is called after rendering to ensure all elements have listeners
 */
function addDragAndDropListeners() {
    const todoItems = document.querySelectorAll('.todo-item:not(.completed)');
    const containers = document.querySelectorAll('.project-todos');
    
    todoItems.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
    });
    
    containers.forEach(container => {
        container.addEventListener('dragover', handleDragOver);
        container.addEventListener('dragenter', handleDragEnter);
        container.addEventListener('dragleave', handleDragLeave);
        container.addEventListener('drop', handleDrop);
    });
}

/**
 * Handle the start of a drag operation
 * @param {DragEvent} e - The drag event
 */
function handleDragStart(e) {
    draggedItem = e.target;
    originalContainer = e.target.closest('.project-todos');
    e.target.classList.add('dragging');
    
    // Set drag effect
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ''); // Required for Firefox
}

/**
 * Handle the end of a drag operation
 * @param {DragEvent} e - The drag event
 */
function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    draggedItem = null;
    originalContainer = null;
    document.querySelectorAll('.project-todos').forEach(container => {
        container.classList.remove('drag-over');
    });
}

/**
 * Handle dragging over a drop target
 * @param {DragEvent} e - The drag event
 */
function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

/**
 * Handle entering a drop target
 * @param {DragEvent} e - The drag event
 */
function handleDragEnter(e) {
    e.preventDefault();
    const container = e.target.closest('.project-todos');
    if (container) {
        container.classList.add('drag-over');
    }
}

/**
 * Handle leaving a drop target
 * @param {DragEvent} e - The drag event
 */
function handleDragLeave(e) {
    const container = e.target.closest('.project-todos');
    if (container) {
        container.classList.remove('drag-over');
    }
}

/**
 * Handle dropping an item on a target
 * @param {DragEvent} e - The drag event
 */
function handleDrop(e) {
    e.preventDefault();
    const container = e.target.closest('.project-todos');
    if (!container || !draggedItem) return;

    const newProject = container.dataset.project;
    const todoId = parseInt(draggedItem.dataset.id);
    
    // Call the main app's function to update the data model
    // This avoids direct manipulation of the todos array from this module
    window.updateTaskPosition(todoId, newProject, e.target.closest('.todo-item'));
}

/**
 * Add CSS styles for drag and drop
 */
function addDragAndDropStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .project-todos.drag-over {
            background-color: rgba(65, 105, 225, 0.1);
            border-radius: 8px;
        }
        
        .todo-item.dragging {
            opacity: 0.5;
            cursor: grabbing;
        }
    `;
    document.head.appendChild(style);
}

// Add styles when the module loads
addDragAndDropStyles();

// Export the public API
window.dragDropModule = {
    setupDragAndDrop,
    addDragAndDropListeners
};
