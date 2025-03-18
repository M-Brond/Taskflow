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
            group: 'shared',
            animation: 150,
            ghostClass: 'todo-ghost',
            chosenClass: 'todo-chosen',
            dragClass: 'todo-drag',
            filter: '.completed, .comments-container', // Prevent dragging completed items and comments
            preventOnFilter: true,
            onStart: function(evt) {
                // Add dragging class to body to apply special styles
                document.body.classList.add('dragging');
                
                // Close any open comments section
                const commentsContainers = document.querySelectorAll('.comments-container.show-comments');
                commentsContainers.forEach(container => {
                    container.classList.remove('show-comments');
                });
            },
            onEnd: function(evt) {
                // Remove dragging class
                document.body.classList.remove('dragging');
                
                // Get the task ID from the data-id attribute
                const todoId = parseInt(evt.item.dataset.id);
                const newProjectId = evt.to.dataset.project;
                const oldProjectId = evt.from.dataset.project;
                
                console.log('===== DRAG ENDED =====');
                console.log('Drag ended for todo item:', todoId, 'from', oldProjectId, 'to', newProjectId);
                
                // Check if app.js has loaded the todos array
                if (typeof window.app !== 'undefined' && typeof window.app.getTodos === 'function') {
                    // Get the todos array from app.js
                    const todos = window.app.getTodos();
                    console.log('Current todos array length:', todos.length);
                    
                    // Debug: Log all task IDs in the todos array
                    console.log('All task IDs in todos array:', todos.map(t => t.id));
                    
                    // Find the task in the todos array
                    let task = todos.find(t => t.id === todoId);
                    
                    if (!task) {
                        console.error('Task not found:', todoId);
                        console.log('Task element data:', evt.item.dataset);
                        
                        // Try to recover by getting the task data from the DOM element
                        const taskText = evt.item.querySelector('.todo-text').textContent;
                        console.log('Attempting to recover task with text:', taskText);
                        
                        // Try to find the task by text instead
                        const taskByText = todos.find(t => t.text === taskText);
                        if (taskByText) {
                            console.log('Found task by text:', taskByText);
                            task = taskByText;
                        } else {
                            console.error('Could not find task by text either');
                            
                            // As a last resort, create a new task object
                            task = {
                                id: todoId,
                                text: taskText,
                                project: newProjectId,
                                priority: 0,
                                completed: false,
                                createdAt: new Date().toISOString()
                            };
                            console.log('Created new task object:', task);
                            
                            // Add it to the todos array
                            todos.push(task);
                            console.log('Added new task to todos array');
                            
                            // Update the todos array in app.js
                            if (typeof window.app.setTodos === 'function') {
                                window.app.setTodos(todos);
                            }
                        }
                    }
                    
                    // Update project if it changed and we have a valid task
                    if (task && oldProjectId !== newProjectId) {
                        task.project = newProjectId;
                        console.log(`Updated task ${todoId} project from ${oldProjectId} to ${newProjectId}`);
                    }
                    
                    // Calculate new priorities based on DOM order
                    const allProjectLists = document.querySelectorAll('.project-todos');
                    
                    allProjectLists.forEach(list => {
                        const project = list.dataset.project;
                        const taskElements = list.querySelectorAll('.todo-item:not(.completed)');
                        
                        console.log(`Updating priorities for project: ${project}`);
                        console.log(`Found ${taskElements.length} tasks in project ${project}`);
                        
                        // Update priorities based on DOM order
                        taskElements.forEach((taskElement, index) => {
                            const id = parseInt(taskElement.dataset.id);
                            let taskToUpdate = todos.find(t => t.id === id);
                            
                            if (!taskToUpdate) {
                                console.warn(`Task with ID ${id} not found in todos array, attempting to recover`);
                                
                                // Try to recover by getting the task data from the DOM element
                                const taskText = taskElement.querySelector('.todo-text').textContent;
                                
                                // Try to find the task by text instead
                                const taskByText = todos.find(t => t.text === taskText);
                                if (taskByText) {
                                    console.log(`Found task by text: ${taskText}`);
                                    taskToUpdate = taskByText;
                                } else {
                                    console.warn(`Creating new task for ID ${id} with text: ${taskText}`);
                                    
                                    // Create a new task object
                                    taskToUpdate = {
                                        id: id,
                                        text: taskText,
                                        project: project,
                                        priority: index,
                                        completed: false,
                                        createdAt: new Date().toISOString()
                                    };
                                    
                                    // Add it to the todos array
                                    todos.push(taskToUpdate);
                                    console.log('Added new task to todos array:', taskToUpdate);
                                    
                                    // Update the todos array in app.js
                                    if (typeof window.app.setTodos === 'function') {
                                        window.app.setTodos(todos);
                                    }
                                }
                            }
                            
                            if (taskToUpdate) {
                                const oldPriority = taskToUpdate.priority;
                                taskToUpdate.priority = index;
                                console.log(`Updated task ${id} priority from ${oldPriority} to ${index}`);
                            } else {
                                console.error(`Failed to update or create task with ID ${id}`);
                            }
                        });
                    });
                    
                    // Log the updated todos array
                    console.log('Updated todos array:', JSON.stringify(todos.map(t => ({
                        id: t.id,
                        text: t.text,
                        project: t.project,
                        priority: t.priority
                    })), null, 2));
                    
                    // Save the updated data using app.js saveData function
                    if (typeof window.app.saveData === 'function') {
                        window.app.saveData();
                        console.log('Data saved after drag operation');
                        
                        // Verify the saved data by immediately loading it back
                        const savedTodos = localStorage.getItem('todos');
                        console.log('Verifying saved todos:', savedTodos);
                        
                        try {
                            const parsedTodos = JSON.parse(savedTodos);
                            console.log('Parsed todos after save:', JSON.stringify(parsedTodos.map(t => ({
                                id: t.id,
                                text: t.text,
                                project: t.project,
                                priority: t.priority
                            })).slice(0, 3), null, 2) + (parsedTodos.length > 3 ? '... (truncated)' : ''));
                        } catch (error) {
                            console.error('Error parsing saved todos:', error);
                        }
                    } else {
                        console.error('app.saveData function not found');
                        
                        // Fallback to direct localStorage save
                        if (typeof window.saveData === 'function') {
                            window.saveData();
                            console.log('Data saved using window.saveData fallback');
                        } else {
                            console.error('No saveData function found');
                        }
                    }
                } else {
                    console.error('app.js not loaded or getTodos function not available');
                    
                    // Fallback to direct window.todos access
                    if (window.todos) {
                        console.log('Using window.todos fallback');
                        // The rest of the code would be duplicated here, but we'll use updateTaskOrderFromDOM instead
                        if (typeof window.updateTaskOrderFromDOM === 'function') {
                            window.updateTaskOrderFromDOM();
                            console.log('Used updateTaskOrderFromDOM as fallback');
                        } else if (typeof window.saveData === 'function') {
                            window.saveData();
                            console.log('Used window.saveData as fallback');
                        } else {
                            console.error('No fallback methods available');
                        }
                    } else {
                        console.error('window.todos is undefined or empty');
                    }
                }
                
                console.log('Task order updated and saved successfully');
            }
        });
        
        sortableInstances.push(sortable);
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
        .todo-ghost {
            opacity: 0.4;
            background-color: #f0f0f0;
            border: 2px dashed #aaa !important;
        }
        
        .dark-mode .todo-ghost {
            background-color: #333;
            border: 2px dashed #666 !important;
        }
        
        .todo-chosen {
            cursor: grabbing;
        }
        
        .todo-drag {
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
