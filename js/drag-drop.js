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
    // Select all non-completed todo items
    const todoItems = document.querySelectorAll('.todo-item:not(.completed)');
    const containers = document.querySelectorAll('.project-todos');
    
    // Remove any existing listeners to prevent duplicates
    todoItems.forEach(item => {
        item.removeEventListener('dragstart', handleDragStart);
        item.removeEventListener('dragend', handleDragEnd);
        
        // Add new listeners
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
    });
    
    containers.forEach(container => {
        container.removeEventListener('dragover', handleDragOver);
        container.removeEventListener('dragenter', handleDragEnter);
        container.removeEventListener('dragleave', handleDragLeave);
        container.removeEventListener('drop', handleDrop);
        
        // Add new listeners
        container.addEventListener('dragover', handleDragOver);
        container.addEventListener('dragenter', handleDragEnter);
        container.addEventListener('dragleave', handleDragLeave);
        container.addEventListener('drop', handleDrop);
    });
    
    // Log that listeners have been added
    console.log('Drag and drop listeners added to', todoItems.length, 'todo items and', containers.length, 'containers');
}

/**
 * Handle the start of a drag operation
 * @param {DragEvent} e - The drag event
 */
function handleDragStart(e) {
    // Make sure we're dragging the todo-item, not just the drag handle
    draggedItem = e.target.closest('.todo-item');
    if (!draggedItem) return;
    
    // Get the wrapper that contains the todo item and comments
    const todoWrapper = draggedItem.closest('.todo-wrapper');
    
    // Store the original container
    originalContainer = draggedItem.closest('.project-todos');
    
    // Add dragging class
    draggedItem.classList.add('dragging');
    if (todoWrapper) {
        todoWrapper.classList.add('dragging-wrapper');
    }
    
    // Close any open comments for this item
    const todoId = draggedItem.dataset.id;
    const commentsSection = document.getElementById(`comments-${todoId}`);
    if (commentsSection && commentsSection.classList.contains('show-comments')) {
        commentsSection.classList.remove('show-comments');
    }
    
    // Set drag effect
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ''); // Required for Firefox
    
    console.log('Drag started for todo item:', todoId);
}

/**
 * Handle the end of a drag operation
 * @param {DragEvent} e - The drag event
 */
function handleDragEnd(e) {
    if (!draggedItem) return;
    
    // Get the wrapper that contains the todo item and comments
    const todoWrapper = draggedItem.closest('.todo-wrapper');
    
    // Remove dragging classes
    draggedItem.classList.remove('dragging');
    if (todoWrapper) {
        todoWrapper.classList.remove('dragging-wrapper');
    }
    
    // Log the end of the drag operation
    console.log('Drag ended for todo item:', draggedItem.dataset.id);
    
    // Reset drag state
    draggedItem = null;
    originalContainer = null;
    
    // Remove all placeholder and over classes
    document.querySelectorAll('.drag-over').forEach(item => {
        item.classList.remove('drag-over');
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
    
    // Get the wrapper that contains the todo item and comments
    const todoWrapper = draggedItem.closest('.todo-wrapper');
    
    // Get all visible todo wrappers in the container (excluding the dragged one)
    const todoWrappers = Array.from(container.querySelectorAll('.todo-wrapper'));
    const visibleWrappers = todoWrappers.filter(wrapper => {
        const item = wrapper.querySelector('.todo-item');
        return item && !item.classList.contains('completed') && wrapper !== todoWrapper;
    });
    
    // Get the mouse position
    const mouseY = e.clientY;
    
    // Find the insertion point
    let insertBefore = null;
    
    // If there are no items or mouse is below all items, append to the end
    if (visibleWrappers.length === 0) {
        insertBefore = null;
    } else {
        // Find the first item that the mouse is above
        for (let i = 0; i < visibleWrappers.length; i++) {
            const item = visibleWrappers[i].querySelector('.todo-item');
            if (!item) continue;
            
            const rect = item.getBoundingClientRect();
            // If mouse is above the middle of this item
            if (mouseY < rect.top + (rect.height / 2)) {
                insertBefore = item;
                break;
            }
        }
    }
    
    // Remove drag-over class from all containers
    document.querySelectorAll('.project-todos').forEach(cont => {
        cont.classList.remove('drag-over');
    });
    
    // Ensure the comments section is closed for the dragged item
    const commentsSection = document.getElementById(`comments-${todoId}`);
    if (commentsSection) {
        commentsSection.classList.remove('show-comments');
    }
    
    console.log('Dropping todo item:', todoId, 'to project:', newProject, 'before:', insertBefore ? insertBefore.dataset.id : 'end');
    
    // Call the main app's function to update the data model
    // Pass the actual DOM element as the drop target
    window.updateTaskPosition(todoId, newProject, insertBefore);
}

/**
 * Add CSS styles for drag and drop
 */
function addDragAndDropStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .project-todos.drag-over {
            background-color: rgba(65, 105, 225, 0.2);
            border-radius: 8px;
            box-shadow: inset 0 0 5px rgba(65, 105, 225, 0.3);
        }
        
        .todo-item.dragging {
            opacity: 0.5;
            cursor: grabbing;
            box-shadow: var(--shadow-md);
        }
        
        .todo-wrapper.dragging-wrapper {
            opacity: 0.6;
            position: relative;
            z-index: 10;
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
