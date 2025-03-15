let todos = []; // Array to store all tasks
let projects = ['Work', 'Personal']; // Default projects
let showCompleted = true;
let hiddenProjects = new Set(); // Track hidden projects
let projectColors = {
    'Work': '#1e88e5', // Default blue color for Work
    'Personal': '#00a884'  // Default teal color for Personal
};
let newProjectPickr = null;
let selectedProjectColor = null;

// Load data from localStorage
function loadData() {
    const savedTodos = localStorage.getItem('todos');
    const savedProjects = localStorage.getItem('projects');
    const savedHiddenProjects = localStorage.getItem('hiddenProjects');
    const savedProjectColors = localStorage.getItem('projectColors');
    
    if (savedTodos) {
        todos = JSON.parse(savedTodos).map(todo => ({
            ...todo,
            completedAt: todo.completedAt ? new Date(todo.completedAt) : null,
            comments: todo.comments || [] // Ensure comments array exists
        }));
    }
    
    if (savedProjects) {
        projects = JSON.parse(savedProjects);
    }

    // Clear hidden projects on initial load to ensure all projects are visible
    hiddenProjects = new Set();
    
    // Default colors for standard projects
    const defaultColors = {
        'Work': '#1e88e5', // Blue
        'Personal': '#00a884' // Teal
    };

    if (savedProjectColors) {
        const savedColors = JSON.parse(savedProjectColors);
        
        // Merge saved colors with defaults, preserving user customizations
        projectColors = { ...projectColors, ...savedColors };
        
        // Ensure Work and Personal have their default colors if they exist but weren't customized
        if (projects.includes('Work') && !savedColors['Work']) {
            projectColors['Work'] = defaultColors['Work'];
        }
        
        if (projects.includes('Personal') && !savedColors['Personal']) {
            projectColors['Personal'] = defaultColors['Personal'];
        }
    }

    // Ensure all projects have colors
    projects.forEach(project => {
        if (!projectColors[project]) {
            projectColors[project] = getRandomColor();
        }
    });

    updateProjectSelect();
    renderAll();
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('todos', JSON.stringify(todos));
    localStorage.setItem('projects', JSON.stringify(projects));
    localStorage.setItem('hiddenProjects', JSON.stringify(Array.from(hiddenProjects)));
    localStorage.setItem('projectColors', JSON.stringify(projectColors));
}

function toggleProjectVisibility(project) {
    if (hiddenProjects.has(project)) {
        hiddenProjects.delete(project);
    } else {
        hiddenProjects.add(project);
    }
    saveData();
    renderAll();
}

function openNewProjectModal() {
    const modal = document.getElementById('newProjectModal');
    const nameInput = document.getElementById('newProjectName');
    const colorPickerEl = document.getElementById('newProjectColorPicker');
    
    // Reset form
    nameInput.value = '';
    selectedProjectColor = getRandomColor();
    
    // Update the color picker background
    colorPickerEl.style.backgroundColor = selectedProjectColor;
    
    // Destroy previous color picker if it exists
    if (newProjectPickr) {
        try {
            newProjectPickr.destroyAndRemove();
        } catch (e) {
            console.log('Error destroying color picker:', e);
        }
        newProjectPickr = null;
    }
    
    // Create a new color picker instance with a small delay to ensure DOM is ready
    setTimeout(() => {
        try {
            newProjectPickr = Pickr.create({
                el: '#newProjectColorPicker',
                theme: 'classic',
                default: selectedProjectColor,
                components: {
                    preview: true,
                    opacity: true,
                    hue: true,
                    interaction: {
                        hex: true,
                        rgba: true,
                        hsla: true,
                        hsva: true,
                        cmyk: true,
                        input: true,
                        clear: false,
                        save: true
                    }
                }
            });
            
            newProjectPickr.on('save', (color) => {
                selectedProjectColor = color.toHEXA().toString();
                colorPickerEl.style.backgroundColor = selectedProjectColor;
                newProjectPickr.hide();
            });
        } catch (e) {
            console.error('Error creating color picker:', e);
            // Fallback to a simple color input if pickr fails
            colorPickerEl.innerHTML = '<input type="color" value="' + selectedProjectColor + '" style="width:100%;height:100%;border:none;padding:0;margin:0;">';
            colorPickerEl.querySelector('input').addEventListener('change', function(e) {
                selectedProjectColor = e.target.value;
            });
        }
    }, 50);
    
    // Show modal
    modal.style.display = 'flex';
    
    // Focus on input
    setTimeout(() => nameInput.focus(), 100);
}

function closeNewProjectModal() {
    const modal = document.getElementById('newProjectModal');
    modal.style.display = 'none';
    
    // Make sure the color picker is hidden
    if (newProjectPickr) {
        newProjectPickr.hide();
    }
}

function createNewProject() {
    const nameInput = document.getElementById('newProjectName');
    const projectName = nameInput.value.trim();
    
    if (projectName && !projects.includes(projectName)) {
        projects.push(projectName);
        projectColors[projectName] = selectedProjectColor || getRandomColor();
        saveData();
        updateProjectSelect();
        renderAll();
        closeNewProjectModal();
        
        // Reset selectedProjectColor for next use
        selectedProjectColor = null;
    } else if (!projectName) {
        nameInput.focus();
    } else {
        alert('A project with this name already exists');
        nameInput.focus();
    }
}

function getRandomColor() {
    // Generate a more pleasing random color
    const hue = Math.floor(Math.random() * 360);
    const saturation = Math.floor(Math.random() * 30) + 70; // 70-100%
    const lightness = Math.floor(Math.random() * 20) + 40; // 40-60%
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function updateProjectSelect() {
    const select = document.getElementById('projectSelect');
    select.innerHTML = '<option value="">Select Project</option>';
    projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project;
        option.textContent = project;
        
        // Create a color indicator for the project
        const colorIndicator = document.createElement('span');
        colorIndicator.className = 'project-color-indicator';
        colorIndicator.style.backgroundColor = projectColors[project] || getRandomColor();
        
        // We can't directly add HTML to options, so we'll use data attributes
        option.dataset.color = projectColors[project] || getRandomColor();
        option.textContent = project;
        select.appendChild(option);
    });
}

function addTodo() {
    const input = document.getElementById('todoInput');
    const projectSelect = document.getElementById('projectSelect');
    const text = input.value.trim();
    const project = projectSelect.value;
    
    if (!project) {
        alert('Please select a project first');
        projectSelect.focus();
        return;
    }
    
    if (text) {
        const newTodo = {
            id: Date.now().toString(),
            text: text,
            completed: false,
            project: project,
            createdAt: new Date(),
            priority: 0, // Default priority
            comments: [] // Initialize empty comments array
        };
        
        todos.push(newTodo);
        saveData();
        renderAll();
        
        // Reset input
        input.value = '';
        input.focus();
    }
}

// Add event listener for Enter key
document.getElementById('todoInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addTodo();
    }
});

function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        // If the task is being completed (not uncompleted)
        if (!todo.completed) {
            // Play confetti animation before changing the state
            const todoElement = document.getElementById(`todo-${id}`);
            if (todoElement) {
                playConfettiAtElement(todoElement);
                
                // Delay the state change and rendering to allow the animation to be seen
                setTimeout(() => {
                    todo.completed = true;
                    todo.completedAt = new Date();
                    saveData();
                    renderAll();
                }, 800); // Delay the completion to allow confetti to be seen
            } else {
                // If element not found, just complete the task
                todo.completed = true;
                todo.completedAt = new Date();
                saveData();
                renderAll();
            }
        } else {
            // If uncompleting a task, do it immediately
            todo.completed = false;
            todo.completedAt = null;
            saveData();
            renderAll();
        }
    }
}

// Play confetti directly from the task position
function playConfettiAtElement(element) {
    if (!element) return;
    
    // Get the position of the element
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    // Calculate position as percentage of the window
    const xPercent = x / window.innerWidth;
    const yPercent = y / window.innerHeight;
    
    // Add a subtle pop animation to the element
    element.classList.add('pop-animation');
    
    // Play multiple confetti bursts for a more dramatic effect
    // First burst - centered on the task
    confetti({
        particleCount: 80,
        spread: 100,
        origin: { x: xPercent, y: yPercent },
        colors: ['#5cb85c', '#4a90e2', '#50e3c2', '#f0ad4e'],
        zIndex: 9999
    });
    
    // Second burst - slightly delayed
    setTimeout(() => {
        confetti({
            particleCount: 60,
            spread: 80,
            origin: { x: xPercent, y: yPercent },
            colors: ['#ff9f43', '#ee5253', '#0abde3', '#10ac84'],
            zIndex: 9999
        });
    }, 150);
    
    // Third burst - with different settings
    setTimeout(() => {
        confetti({
            particleCount: 40,
            spread: 60,
            origin: { x: xPercent, y: yPercent },
            colors: ['#ffffff', '#f1c40f', '#e74c3c', '#3498db'],
            zIndex: 9999,
            gravity: 1.5
        });
    }, 300);
    
    // Remove the pop animation after it completes
    setTimeout(() => {
        element.classList.remove('pop-animation');
    }, 500);
}

// This function is called from the confirmation dialog callback
function deleteTodo(id) {
    // Remove the task with the given ID from the todos array
    todos = todos.filter(todo => todo.id !== id);
    // Save the updated data
    saveData();
    // Re-render the UI
    renderAll();
}

function toggleCompletedTasks() {
    const completedTasks = document.getElementById('completedTasks');
    const toggleBtn = document.getElementById('toggleCompletedBtn');
    
    if (completedTasks.style.display === 'none' || !completedTasks.style.display) {
        // Show completed tasks
        completedTasks.style.display = 'block';
        completedTasks.style.maxHeight = completedTasks.scrollHeight + 'px';
        toggleBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
    } else {
        // Hide completed tasks
        completedTasks.style.maxHeight = '0';
        setTimeout(() => {
            completedTasks.style.display = 'none';
        }, 300);
        toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
    }
}

function clearCompletedTasks() {
    if (confirm('Are you sure you want to delete all completed tasks? This action cannot be undone.')) {
        // Filter out completed tasks
        todos = todos.filter(todo => !todo.completed);
        
        // Save and render
        saveData();
        renderAll();
        
        // Show notification
        showNotification('All completed tasks have been cleared', 'success');
    }
}

function formatDate(date) {
    if (!date) return '';
    
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit'
    };
    
    return new Date(date).toLocaleDateString(undefined, options);
}

function renderTodoItem(todo) {
    // Create a wrapper for the entire todo item including comments
    const todoWrapper = document.createElement('div');
    todoWrapper.className = 'todo-wrapper';
    todoWrapper.dataset.id = todo.id;
    
    // Create the main todo item
    const todoItem = document.createElement('div');
    todoItem.className = `todo-item${todo.completed ? ' completed' : ''}`;
    todoItem.id = `todo-${todo.id}`;
    todoItem.draggable = !todo.completed;
    todoItem.dataset.id = todo.id;
    
    // Apply project color to the task
    const projectColor = projectColors[todo.project] || getRandomColor();
    todoItem.style.borderLeftColor = projectColor;
    
    // Create the main todo content
    const todoContent = document.createElement('div');
    todoContent.className = 'todo-content';
    
    // Create date display only for completed tasks
    const todoDate = document.createElement('small');
    todoDate.className = 'todo-date';
    
    if (todo.completed) {
        todoDate.textContent = `Completed ${formatDate(todo.completedAt)}`;
        todoContent.appendChild(todoDate);
    }
    
    // Create checkbox wrapper for larger clickable area
    const checkboxWrapper = document.createElement('div');
    checkboxWrapper.className = 'checkbox-wrapper';
    checkboxWrapper.addEventListener('click', (e) => {
        // Only toggle if the click was on the wrapper itself, not on the checkbox
        // This prevents double toggling when clicking directly on the checkbox
        if (e.target === checkboxWrapper) {
            toggleTodo(todo.id);
        }
    });
    
    // Create checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'todo-checkbox';
    checkbox.checked = todo.completed;
    checkbox.addEventListener('change', () => toggleTodo(todo.id));
    
    // Create todo text
    const todoText = document.createElement('span');
    todoText.className = `todo-text${todo.completed ? ' completed' : ''}`;
    todoText.textContent = todo.text;
    
    // Add elements to todo content
    if (!todo.completed) {
        // For incomplete tasks, just add checkbox and text
        checkboxWrapper.appendChild(checkbox);
        todoContent.appendChild(checkboxWrapper);
        todoContent.appendChild(todoText);
    } else {
        // For completed tasks, date is already added above
        checkboxWrapper.appendChild(checkbox);
        todoContent.appendChild(checkboxWrapper);
        todoContent.appendChild(todoText);
    }
    
    // Create actions container
    const todoActions = document.createElement('div');
    todoActions.className = 'todo-actions';
    
    // Create comments button with counter
    const commentsCount = todo.comments ? todo.comments.length : 0;
    const commentsBtn = document.createElement('button');
    commentsBtn.className = 'todo-action-btn comments-btn';
    commentsBtn.innerHTML = `<i class="fas fa-comment"></i>${commentsCount > 0 ? ` <span class="comments-count">${commentsCount}</span>` : ''}`;
    commentsBtn.title = 'View/Add Comments';
    commentsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleComments(todo.id);
    });
    
    // Create delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'todo-action-btn delete-btn';
    deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
    deleteBtn.title = 'Delete Task';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Show confirmation dialog before deleting
        showConfirmationDialog(
            'Delete Task', 
            'Are you sure you want to delete this task?<br>This action cannot be undone.',
            () => {
                // Only delete if user confirms
                deleteTodo(todo.id);
            }
        );
    });
    
    // Add buttons to actions
    todoActions.appendChild(commentsBtn);
    todoActions.appendChild(deleteBtn);
    
    // Add content and actions to todo item
    todoItem.appendChild(todoContent);
    todoItem.appendChild(todoActions);
    
    // Add the todo item to the wrapper
    todoWrapper.appendChild(todoItem);
    
    // Create comments section (outside the todo item but inside the wrapper)
    const commentsSection = document.createElement('div');
    commentsSection.className = 'comments-section';
    commentsSection.id = `comments-${todo.id}`;
    
    // Create comments list
    const commentsList = document.createElement('div');
    commentsList.className = 'comments-list';
    
    // Add existing comments
    if (todo.comments && todo.comments.length > 0) {
        todo.comments.forEach(comment => {
            const commentItem = document.createElement('div');
            commentItem.className = 'comment-item';
            
            const commentText = document.createElement('div');
            commentText.className = 'comment-text';
            commentText.textContent = comment.text;
            
            const commentMeta = document.createElement('div');
            commentMeta.className = 'comment-meta';
            
            const commentDate = document.createElement('span');
            commentDate.className = 'comment-date';
            commentDate.textContent = formatDate(new Date(comment.createdAt));
            
            const deleteCommentBtn = document.createElement('button');
            deleteCommentBtn.className = 'delete-comment-btn';
            deleteCommentBtn.innerHTML = '<i class="fas fa-times"></i>';
            deleteCommentBtn.title = 'Delete Comment';
            deleteCommentBtn.addEventListener('click', () => deleteComment(todo.id, comment.id));
            
            commentMeta.appendChild(commentDate);
            commentMeta.appendChild(deleteCommentBtn);
            
            commentItem.appendChild(commentText);
            commentItem.appendChild(commentMeta);
            
            commentsList.appendChild(commentItem);
        });
    } else {
        const emptyComments = document.createElement('div');
        emptyComments.className = 'empty-comments';
        emptyComments.textContent = 'No comments yet';
        commentsList.appendChild(emptyComments);
    }
    
    // Create comment input
    const commentForm = document.createElement('div');
    commentForm.className = 'comment-form';
    
    const commentInput = document.createElement('input');
    commentInput.type = 'text';
    commentInput.className = 'comment-input';
    commentInput.id = `comment-input-${todo.id}`;
    commentInput.placeholder = 'Add a comment...';
    
    const addCommentBtn = document.createElement('button');
    addCommentBtn.className = 'add-comment-btn';
    addCommentBtn.innerHTML = '<i class="fas fa-plus"></i>';
    addCommentBtn.title = 'Add Comment';
    
    // Handle comment submission
    const submitComment = () => {
        const text = commentInput.value.trim();
        if (text) {
            addComment(todo.id, text);
            commentInput.value = '';
        }
    };
    
    addCommentBtn.addEventListener('click', submitComment);
    commentInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            submitComment();
        }
    });
    
    commentForm.appendChild(commentInput);
    commentForm.appendChild(addCommentBtn);
    
    commentsSection.appendChild(commentsList);
    commentsSection.appendChild(commentForm);
    
    // Add the comments section to the wrapper (not inside the todo item)
    todoWrapper.appendChild(commentsSection);
    
    return todoWrapper;
}

// Add or update a comment to a todo
function addComment(todoId, commentText) {
    if (!commentText.trim()) return;
    
    const todo = todos.find(todo => todo.id === todoId);
    if (todo) {
        // Add the new comment
        todo.comments = todo.comments || [];
        todo.comments.push({
            id: Date.now().toString(),
            text: commentText.trim(),
            createdAt: new Date()
        });
        
        saveData();
        renderAll();
    }
}

// Delete a comment from a todo
function deleteComment(todoId, commentId) {
    const todo = todos.find(todo => todo.id === todoId);
    if (todo && todo.comments) {
        todo.comments = todo.comments.filter(comment => comment.id !== commentId);
        saveData();
        renderAll();
    }
}

// Toggle the comments section for a todo
function toggleComments(todoId) {
    // Close any other open comments sections first
    document.querySelectorAll('.comments-section.show-comments').forEach(section => {
        if (section.id !== `comments-${todoId}`) {
            section.classList.remove('show-comments');
        }
    });
    
    const commentsSection = document.getElementById(`comments-${todoId}`);
    if (commentsSection) {
        commentsSection.classList.toggle('show-comments');
        
        // Focus the input if showing comments
        if (commentsSection.classList.contains('show-comments')) {
            const commentInput = document.getElementById(`comment-input-${todoId}`);
            if (commentInput) {
                commentInput.focus();
            }
            
            // Make sure the todo item is visible
            const todoItem = document.querySelector(`.todo-item[data-id="${todoId}"]`);
            if (todoItem) {
                todoItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }
}

function renderProjectHeader(project) {
    const header = document.createElement('div');
    header.className = 'project-header';
    const projectTodos = todos.filter(todo => !todo.completed && todo.project === project);
    // Check if we're in fullscreen mode
    const isFullscreen = document.getElementById('projectsContainer').classList.contains('fullscreen-project');
    
    let backButton = '';
    if (isFullscreen && !hiddenProjects.has(project)) {
        backButton = `
            <button class="project-back-btn" onclick="exitFullscreenMode()">
                <i class="fas fa-arrow-left"></i>
                <span>Back</span>
            </button>
        `;
    }
    
    // Add fullscreen button if not already in fullscreen mode
    let fullscreenButton = '';
    if (!isFullscreen) {
        fullscreenButton = `
            <button class="project-fullscreen-btn" onclick="filterByProject('${project}')" title="Fullscreen mode">
                <i class="fas fa-expand"></i>
            </button>
        `;
    }
    
    // Only show visibility toggle when not in fullscreen mode
    let visibilityToggle = '';
    if (!isFullscreen) {
        visibilityToggle = `
            <button class="project-visibility-toggle" onclick="toggleProjectVisibility('${project}')" title="Hide this project from view. You can show it again later.">
                <i class="fas fa-eye-slash"></i>
            </button>
        `;
    }
    
    header.innerHTML = `
        ${backButton}
        <h3 class="project-title">${project}</h3>
        <span class="project-counter">${projectTodos.length}</span>
        ${fullscreenButton}
        ${visibilityToggle}
        <div class="color-picker-container">
            <div class="color-picker" id="color-picker-${project}" style="background-color: ${projectColors[project] || getRandomColor()}" title="Change project color"></div>
        </div>
        <button class="project-remove-btn" onclick="removeProject('${project}')" title="Delete this project">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    setTimeout(() => {
        const pickr = Pickr.create({
            el: `#color-picker-${project}`,
            theme: 'classic',
            default: projectColors[project] || getRandomColor(),
            components: {
                preview: true,
                opacity: true,
                hue: true,
                interaction: {
                    hex: true,
                    rgba: true,
                    hsla: true,
                    hsva: true,
                    cmyk: true,
                    input: true,
                    clear: false,
                    save: true
                }
            }
        });
        
        pickr.on('save', (color) => {
            projectColors[project] = color.toHEXA().toString();
            saveData();
            renderAll();
        });
    }, 0);
    
    return header;
}

function removeProject(project) {
    showConfirmationDialog(
        'Delete Project', 
        `Are you sure you want to remove the project "${project}"?<br>All tasks in this project will also be deleted.`,
        () => {
            // Remove all todos associated with this project
            todos = todos.filter(todo => todo.project !== project);
            
            // Remove the project from the projects array
            const index = projects.indexOf(project);
            if (index > -1) {
                projects.splice(index, 1);
            }
            
            // Remove from hiddenProjects if it's there
            if (hiddenProjects.has(project)) {
                hiddenProjects.delete(project);
            }
            
            // Remove from projectColors
            if (projectColors[project]) {
                delete projectColors[project];
            }
            
            saveData();
            updateProjectSelect();
            renderAll();
        }
    );
}

function updateTodoPriorities(project) {
    const projectTodos = todos.filter(t => !t.completed && t.project === project);
    projectTodos.forEach((todo, index) => {
        todo.priority = index;
    });
    saveData();
}

/**
 * Update task position after drag and drop
 * This function is called by the drag-drop module when a task is dropped
 * @param {number} todoId - The ID of the dragged task
 * @param {string} newProject - The project the task was dropped into
 * @param {HTMLElement} dropTarget - The task element that was the drop target (if any)
 */
function updateTaskPosition(todoId, newProject, dropTarget) {
    console.log('Updating task position:', todoId, newProject, dropTarget ? dropTarget.dataset.id : 'end');
    
    // Ensure todoId is an integer
    todoId = parseInt(todoId);
    
    // Find the task that was dragged
    const draggedTask = todos.find(t => t.id === todoId);
    if (!draggedTask) {
        console.error('Dragged task not found:', todoId);
        return;
    }
    
    // Store original project and priority
    const originalProject = draggedTask.project;
    const originalPriority = draggedTask.priority;
    
    console.log('Original position:', originalProject, originalPriority);
    
    // Close any open comments section for this task
    const commentsSection = document.getElementById(`comments-${todoId}`);
    if (commentsSection && commentsSection.classList.contains('show-comments')) {
        commentsSection.classList.remove('show-comments');
    }
    
    // Determine the new priority
    let newPriority;
    
    if (dropTarget) {
        // If dropping before a specific task
        const targetId = parseInt(dropTarget.dataset.id);
        console.log('Target ID from dataset:', targetId);
        
        const targetTask = todos.find(t => t.id === targetId);
        if (targetTask) {
            newPriority = targetTask.priority;
            console.log('Drop target found, priority:', targetTask.priority);
        } else {
            // Fallback if target task not found
            console.error('Target task not found in data model:', targetId);
            // Get all tasks in the project to determine the fallback priority
            const projectTasks = todos.filter(t => !t.completed && t.project === newProject);
            newPriority = projectTasks.length > 0 ? projectTasks[0].priority : 0;
            console.log('Using fallback priority:', newPriority);
        }
    } else {
        // If dropping at the end of a project
        const projectTasks = todos.filter(t => 
            !t.completed && 
            t.project === newProject && 
            t.id !== todoId
        );
        newPriority = projectTasks.length;
        console.log('Dropping at end, new priority:', newPriority);
    }
    
    // Handle project change
    if (originalProject !== newProject) {
        console.log('Project changed from', originalProject, 'to', newProject);
        // Update the task's project
        draggedTask.project = newProject;
        
        // Adjust priorities in the original project
        todos.filter(t => 
            !t.completed && 
            t.project === originalProject && 
            t.priority > originalPriority
        ).forEach(t => {
            t.priority--;
            console.log('Decreasing priority of task in original project:', t.id, t.priority);
        });
        
        // Adjust priorities in the new project to make room for the new task
        todos.filter(t => 
            !t.completed && 
            t.project === newProject && 
            t.priority >= newPriority && 
            t.id !== todoId
        ).forEach(t => {
            t.priority++;
            console.log('Increasing priority of task in new project:', t.id, t.priority);
        });
    } else if (originalPriority < newPriority) {
        // Moving down in the same project
        console.log('Moving down in same project');
        // Adjust tasks between the original position and new position
        todos.filter(t => 
            !t.completed && 
            t.project === newProject && 
            t.priority > originalPriority && 
            t.priority <= newPriority && 
            t.id !== todoId
        ).forEach(t => {
            t.priority--;
            console.log('Decreasing priority of task:', t.id, t.priority);
        });
        
        // Adjust the new priority since we removed the task from above
        newPriority--;
        console.log('Adjusted new priority:', newPriority);
    } else if (originalPriority > newPriority) {
        // Moving up in the same project
        console.log('Moving up in same project');
        // Adjust tasks between the new position and original position
        todos.filter(t => 
            !t.completed && 
            t.project === newProject && 
            t.priority >= newPriority && 
            t.priority < originalPriority && 
            t.id !== todoId
        ).forEach(t => {
            t.priority++;
            console.log('Increasing priority of task:', t.id, t.priority);
        });
    }
    
    // Set the new priority for the dragged task
    draggedTask.priority = newPriority;
    console.log('Final priority for dragged task:', draggedTask.id, draggedTask.priority);
    
    // Recalculate priorities for all tasks in the project to ensure consistency
    const projectTasks = todos.filter(t => !t.completed && t.project === newProject);
    projectTasks.sort((a, b) => a.priority - b.priority);
    
    // Reassign priorities to ensure they are sequential and without gaps
    projectTasks.forEach((task, index) => {
        task.priority = index;
        console.log(`Reassigned priority for task ${task.id}: ${index}`);
    });
    
    // Save and render
    saveData();
    renderAll();
}

// Make functions available to the drag-drop module
window.updateTaskPosition = updateTaskPosition;
window.renderAll = renderAll;

// Add dark mode toggle functionality
function toggleDarkMode() {
    // Get the button
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    // Add clicked class for animation
    darkModeToggle.classList.add('clicked');
    setTimeout(() => darkModeToggle.classList.remove('clicked'), 500);
    
    // Toggle dark mode class on body
    document.body.classList.toggle('dark-mode');
    
    // Update icon if needed
    const moonIcon = darkModeToggle.querySelector('i');
    if (document.body.classList.contains('dark-mode')) {
        // We're in dark mode now
        moonIcon.classList.add('active');
    } else {
        // We're in light mode now
        moonIcon.classList.remove('active');
    }
    
    // Save preference to localStorage
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

function initDarkMode() {
    const darkModeEnabled = localStorage.getItem('darkMode') === 'true';
    if (darkModeEnabled) {
        document.body.classList.add('dark-mode');
        document.getElementById('darkModeToggle').innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    // Add event listener to the dark mode toggle button
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleDarkMode);
    }
}

// Tutorial functions
function initTutorial() {
    const tutorialKey = 'taskflow_tutorial_completed';
    const tutorialCompleted = localStorage.getItem(tutorialKey) === 'true';
    
    if (!tutorialCompleted) {
        showTutorial();
    }
    
    // Set up tutorial navigation
    const prevBtn = document.getElementById('tutorialPrev');
    const nextBtn = document.getElementById('tutorialNext');
    const finishBtn = document.getElementById('tutorialFinish');
    const skipBtn = document.getElementById('tutorialSkip');
    
    let currentStep = 1;
    const totalSteps = document.querySelectorAll('.tutorial-step').length;
    
    prevBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            navigateToStep(--currentStep);
        }
    });
    
    nextBtn.addEventListener('click', () => {
        if (currentStep < totalSteps) {
            navigateToStep(++currentStep);
        }
    });
    
    finishBtn.addEventListener('click', () => {
        closeTutorial();
        localStorage.setItem(tutorialKey, 'true');
    });
    
    skipBtn.addEventListener('click', () => {
        closeTutorial();
        localStorage.setItem(tutorialKey, 'true');
    });
    
    // Make dots clickable
    document.querySelectorAll('.tutorial-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            const step = parseInt(dot.getAttribute('data-step'));
            currentStep = step;
            navigateToStep(step);
        });
    });
    
    function navigateToStep(step) {
        // Update active step
        document.querySelectorAll('.tutorial-step').forEach(s => {
            s.classList.remove('active');
        });
        document.querySelector(`.tutorial-step[data-step="${step}"]`).classList.add('active');
        
        // Update dots
        document.querySelectorAll('.tutorial-dot').forEach(dot => {
            dot.classList.remove('active');
        });
        document.querySelector(`.tutorial-dot[data-step="${step}"]`).classList.add('active');
        
        // Update buttons
        prevBtn.disabled = step === 1;
        
        if (step === totalSteps) {
            nextBtn.style.display = 'none';
            finishBtn.style.display = 'block';
        } else {
            nextBtn.style.display = 'block';
            finishBtn.style.display = 'none';
        }
    }
}

function showTutorial() {
    document.getElementById('tutorialOverlay').style.display = 'flex';
}

function closeTutorial() {
    document.getElementById('tutorialOverlay').style.display = 'none';
}

// Export/Import functions - moved to backup-restore.js
// Keeping this comment as a reference to where the code was moved from

// Initialize the app when the DOM is loaded
let appInitialized = false;

function initApp() {
    if (appInitialized) return;
    
    // Initialize dark mode
    initDarkMode();
    
    // Initialize data storage notice (now in backup-restore.js)
    if (typeof initDataStorageNotice === 'function') {
        initDataStorageNotice();
    }
    
    // Load todos from localStorage
    loadData();
    
    // Initialize the project filter
    updateProjectFilter();
    
    // Update the project select dropdown
    updateProjectSelect();
    
    // Initialize the tutorial for first-time users
    initTutorial();
    
    // Set up event listeners
    setupEventListeners();
    
    // Mark as initialized
    appInitialized = true;
}

// Custom confirmation dialog that looks like the modal
function showConfirmationDialog(title, message, onConfirm) {
    // Remove any existing confirmation dialogs
    const existingDialog = document.getElementById('confirmDialog');
    if (existingDialog) {
        document.body.removeChild(existingDialog);
    }
    
    // Create the dialog container
    const dialog = document.createElement('div');
    dialog.id = 'confirmDialog';
    dialog.className = 'confirm-dialog';
    
    // Create dialog content
    const dialogContent = document.createElement('div');
    dialogContent.className = 'confirm-dialog-content';
    
    // Create close button
    const closeBtn = document.createElement('span');
    closeBtn.className = 'confirm-dialog-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => {
        closeConfirmDialog();
    });
    
    // Create header
    const header = document.createElement('div');
    header.className = 'confirm-dialog-header';
    header.innerHTML = `<h3>${title}</h3>`;
    
    // Create body
    const body = document.createElement('div');
    body.className = 'confirm-dialog-body';
    body.innerHTML = `<p>${message}</p>`;
    
    // Create footer with buttons
    const footer = document.createElement('div');
    footer.className = 'confirm-dialog-footer';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'confirm-dialog-btn confirm-cancel-btn';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => {
        closeConfirmDialog();
    });
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'confirm-dialog-btn confirm-delete-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => {
        closeConfirmDialog();
        if (typeof onConfirm === 'function') {
            onConfirm();
        }
    });
    
    // Assemble the dialog
    footer.appendChild(cancelBtn);
    footer.appendChild(deleteBtn);
    
    dialogContent.appendChild(closeBtn);
    dialogContent.appendChild(header);
    dialogContent.appendChild(body);
    dialogContent.appendChild(footer);
    
    dialog.appendChild(dialogContent);
    document.body.appendChild(dialog);
    
    // Display the dialog
    dialog.style.display = 'flex';
    
    // Focus on cancel button by default (safer option)
    cancelBtn.focus();
    
    // Close dialog when clicking outside
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            closeConfirmDialog();
        }
    });
    
    // Close dialog when pressing Escape
    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            closeConfirmDialog();
            document.removeEventListener('keydown', handleKeyDown);
        }
    };
    document.addEventListener('keydown', handleKeyDown);
    
    // Function to close the dialog
    function closeConfirmDialog() {
        dialog.style.display = 'none';
        document.body.removeChild(dialog);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initApp();
    renderAll();
    
    // Check if there's a hash in the URL to show a specific project
    if (window.location.hash) {
        const projectName = decodeURIComponent(window.location.hash.substring(1));
        filterByProject(projectName);
    }
    
    // Apply tooltips to all color pickers
    applyColorPickerTooltips();
    
    // Check for dark mode preference
    const darkModePreference = localStorage.getItem('darkMode');
    if (darkModePreference === 'true') {
        document.body.classList.add('dark-mode');
        document.getElementById('darkModeToggle').innerHTML = '<i class="fas fa-sun"></i>';
    }
});

// Function to apply tooltips to all color pickers
function applyColorPickerTooltips() {
    // Use a longer timeout to ensure all elements are fully rendered and initialized
    setTimeout(() => {
        // First, get all color pickers by class
        document.querySelectorAll('.color-picker').forEach(picker => {
            picker.setAttribute('title', 'Change project color');
        });
        
        // Specifically target the default projects by ID to ensure they get the tooltip
        const workColorPicker = document.getElementById('color-picker-Work');
        const personalColorPicker = document.getElementById('color-picker-Personal');
        
        if (workColorPicker) {
            workColorPicker.setAttribute('title', 'Change project color');
        }
        
        if (personalColorPicker) {
            personalColorPicker.setAttribute('title', 'Change project color');
        }
        
        // Log for debugging
        console.log('Applied tooltips to color pickers');
    }, 300); // Increased timeout to 300ms
}

// Setup event listeners
function setupEventListeners() {
    // Add event listener for Enter key on todoInput
    document.getElementById('todoInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTodo();
        }
    });
    
    // Add event listener for the Add button if it exists
    const addBtn = document.querySelector('.add-btn');
    if (addBtn) {
        // Remove the inline onclick handler if it exists
        addBtn.removeAttribute('onclick');
        addBtn.addEventListener('click', addTodo);
    }
    
    // Add event listener for the New Project button
    const addProjectBtn = document.querySelector('.add-project-btn');
    if (addProjectBtn) {
        addProjectBtn.addEventListener('click', openNewProjectModal);
    }
    
    // Export/Import buttons and minimize/expand buttons are now handled in backup-restore.js
    
    // Dark mode toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleDarkMode);
    }
    
    // Setup drag and drop for todo items
    window.dragDropModule.setupDragAndDrop();
}

function renderAll() {
    const projectsContainer = document.getElementById('projectsContainer');
    projectsContainer.innerHTML = '';
    
    // Remove any existing show hidden containers
    document.querySelectorAll('.show-hidden-container').forEach(container => container.remove());

    // Count visible projects
    const visibleProjects = projects.filter(project => !hiddenProjects.has(project));
    
    // Add the two-projects class if there are exactly two visible projects
    if (visibleProjects.length === 2) {
        projectsContainer.classList.add('two-projects');
    } else {
        projectsContainer.classList.remove('two-projects');
    }

    // Create columns for both visible and hidden projects
    projects.forEach(project => {
        if (!hiddenProjects.has(project)) {
            // Render visible project
            const projectTodos = todos.filter(todo => !todo.completed && todo.project === project)
                .sort((a, b) => a.priority - b.priority);
            
            const column = document.createElement('div');
            column.className = `project-column ${project.toLowerCase()}`;
            column.style.borderTop = `4px solid ${projectColors[project] || getRandomColor()}`;
            
            const header = renderProjectHeader(project);
            
            const todosList = document.createElement('div');
            todosList.className = 'project-todos';
            todosList.dataset.project = project;
            
            // Drag and drop event listeners will be added by the drag-drop module
            
            // Check if project has any todos
            if (projectTodos.length > 0) {
                projectTodos.forEach(todo => {
                    todosList.appendChild(renderTodoItem(todo));
                });
                
                // Add scrollable class if there are more than 7 tasks
                if (projectTodos.length > 7) {
                    todosList.classList.add('scrollable');
                }
            } else {
                // Render empty state
                todosList.appendChild(renderEmptyState(project));
            }
            
            // Create a content wrapper for better fullscreen layout
            const contentWrapper = document.createElement('div');
            contentWrapper.className = 'project-content';
            contentWrapper.appendChild(todosList);
            
            column.appendChild(header);
            column.appendChild(contentWrapper);
            projectsContainer.appendChild(column);
        } else {
            // Render placeholder for hidden project with show button
            const placeholder = document.createElement('div');
            placeholder.className = 'project-placeholder';
            
            const showButton = document.createElement('button');
            showButton.className = 'project-visibility-toggle show-hidden';
            showButton.innerHTML = `
                <i class="fas fa-eye"></i>
                <span>Show ${project}</span>
            `;
            showButton.onclick = () => {
                hiddenProjects.delete(project);
                saveData();
                renderAll();
            };
            
            placeholder.appendChild(showButton);
            projectsContainer.appendChild(placeholder);
        }
    });

    // Render empty state if no projects exist
    if (projects.length === 0) {
        const emptyProjectsState = document.createElement('div');
        emptyProjectsState.className = 'empty-state';
        emptyProjectsState.innerHTML = `
            <i class="fas fa-tasks"></i>
            <h3>No Projects Yet</h3>
            <p>Create your first project to get started organizing your tasks.</p>
            <button class="empty-state-action" onclick="openNewProjectModal()">+ Create Project</button>
        `;
        projectsContainer.appendChild(emptyProjectsState);
    }

    renderCompletedTasks();
    
    // Add tooltips to elements
    addTooltips();
    
    // Remove any duplicate backup & restore sections that might be present
    removeDuplicateBackupRestoreSections();
    
    // Re-initialize drag and drop listeners after rendering
    if (window.dragDropModule) {
        window.dragDropModule.addDragAndDropListeners();
    }
    
    // Apply tooltips to all color pickers after rendering
    setTimeout(() => {
        applyColorPickerTooltips();
    }, 100);
}

function renderCompletedTasks() {
    const completedContainer = document.getElementById('completedTasks');
    completedContainer.innerHTML = '';
    
    // Get the selected project filter
    const projectFilter = document.getElementById('completedProjectFilter').value;
    
    // Filter completed todos based on selected project
    let completedTodos = todos.filter(todo => todo.completed);
    
    // Apply project filter if not "all"
    if (projectFilter !== 'all') {
        completedTodos = completedTodos.filter(todo => todo.project === projectFilter);
    }
    
    // Sort by completion date (newest first)
    completedTodos = completedTodos.sort((a, b) => b.completedAt - a.completedAt);
    
    // Update completed counter
    document.getElementById('completedCounter').textContent = completedTodos.length;
    
    // Populate project filter dropdown
    populateCompletedProjectFilter();
    
    if (completedTodos.length > 0) {
        // Add scrollable class if there are more than 5 completed tasks
        if (completedTodos.length > 5) {
            completedContainer.classList.add('scrollable-completed');
        } else {
            completedContainer.classList.remove('scrollable-completed');
        }
        
        // Render all completed tasks
        completedTodos.forEach(todo => {
            completedContainer.appendChild(renderTodoItem(todo));
        });
    } else {
        // Render empty state for completed tasks
        const emptyCompletedState = document.createElement('div');
        emptyCompletedState.className = 'empty-state';
        emptyCompletedState.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <h3>No Completed Tasks</h3>
            <p>Tasks you complete will appear here.</p>
        `;
        completedContainer.appendChild(emptyCompletedState);
    }
}

function populateCompletedProjectFilter() {
    const filterSelect = document.getElementById('completedProjectFilter');
    const currentValue = filterSelect.value;
    
    // Clear existing options except the "All Projects" option
    while (filterSelect.options.length > 1) {
        filterSelect.remove(1);
    }
    
    // Add an option for each project
    projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project;
        option.textContent = project;
        filterSelect.appendChild(option);
    });
    
    // Restore the previously selected value if it exists
    if (currentValue && filterSelect.querySelector(`option[value="${currentValue}"]`)) {
        filterSelect.value = currentValue;
    }
}

// Event listeners for completed tasks section
document.addEventListener('DOMContentLoaded', function() {
    // Toggle completed tasks visibility
    document.getElementById('toggleCompletedBtn').addEventListener('click', toggleCompletedTasks);
    
    // Clear all completed tasks
    document.getElementById('clearCompletedBtn').addEventListener('click', clearCompletedTasks);
    
    // Filter completed tasks by project
    document.getElementById('completedProjectFilter').addEventListener('change', function() {
        renderCompletedTasks();
    });
});

function renderEmptyState(project) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = `
        <i class="fas fa-clipboard"></i>
        <h3>No Tasks Yet</h3>
        <p>Add a task to ${project} to get started.</p>
        <button class="empty-state-action" onclick="focusAddTaskInput('${project}')">+ Add Task</button>
    `;
    return emptyState;
}

function focusAddTaskInput(project) {
    const todoInput = document.getElementById('todoInput');
    const projectSelect = document.getElementById('projectSelect');
    
    // Set the project in the dropdown
    for (let i = 0; i < projectSelect.options.length; i++) {
        if (projectSelect.options[i].value === project) {
            projectSelect.selectedIndex = i;
            break;
        }
    }
    
    // Focus the input
    todoInput.focus();
}

function addTooltips() {
    // Add tooltips to project visibility toggle buttons
    document.querySelectorAll('.project-visibility-toggle').forEach(button => {
        button.setAttribute('title', 'Hide this project from view. You can show it again later.');
    });
    
    // Add tooltips to drag handles
    document.querySelectorAll('.drag-handle').forEach(handle => {
        handle.setAttribute('title', 'Drag to reorder or move to another project');
    });
    
    // Add tooltips to color pickers
    document.querySelectorAll('.color-picker-container .color-picker').forEach(picker => {
        picker.setAttribute('title', 'Change project color');
    });
    
    // Add tooltips to delete task buttons
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.setAttribute('title', 'Delete Task');
    });
    
    // Add tooltips to fullscreen buttons
    document.querySelectorAll('.project-fullscreen-btn').forEach(button => {
        button.setAttribute('title', 'View this project in fullscreen');
    });
    
    // Add tooltips to project remove buttons
    document.querySelectorAll('.project-remove-btn').forEach(button => {
        button.setAttribute('title', 'Delete this project');
    });
    
    // Add tooltip to dark mode toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.setAttribute('title', 'Toggle dark mode');
    }
}

function filterByProject(projectName) {
    if (projects.includes(projectName)) {
        // Show only this project
        projects.forEach(p => {
            if (p !== projectName) {
                hiddenProjects.add(p);
            } else {
                hiddenProjects.delete(p);
            }
        });
        
        // Add fullscreen class to the projects container
        document.getElementById('projectsContainer').classList.add('fullscreen-project');
        
        // Update URL hash for bookmarking/sharing
        window.location.hash = encodeURIComponent(projectName);
        
        updateProjectFilter();
        renderAll();
    }
}

// Function to exit fullscreen mode
function exitFullscreenMode() {
    // Clear all hidden projects
    hiddenProjects.clear();
    
    // Remove fullscreen class
    document.getElementById('projectsContainer').classList.remove('fullscreen-project');
    
    // Clear URL hash
    history.pushState("", document.title, window.location.pathname + window.location.search);
    
    saveData();
    renderAll();
}

// Update the project filter dropdown
function updateProjectFilter() {
    const filterSelect = document.getElementById('projectFilter');
    if (!filterSelect) return;
    
    // Clear existing options
    filterSelect.innerHTML = '';
    
    // Add "All Projects" option
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = 'All Projects';
    filterSelect.appendChild(allOption);
    
    // Add options for each project
    projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project;
        option.textContent = project;
        filterSelect.appendChild(option);
    });
    
    // Add event listener
    filterSelect.addEventListener('change', function() {
        const selectedProject = this.value;
        
        if (selectedProject === 'all') {
            // Show all projects
            projects.forEach(p => hiddenProjects.delete(p));
        } else {
            // Show only the selected project
            projects.forEach(p => {
                if (p !== selectedProject) {
                    hiddenProjects.add(p);
                } else {
                    hiddenProjects.delete(p);
                }
            });
        }
        
        saveData();
        renderAll();
    });
}

function clearCompletedTasks() {
    if (confirm('Are you sure you want to delete all completed tasks? This action cannot be undone.')) {
        // Filter out completed tasks
        todos = todos.filter(todo => !todo.completed);
        
        // Save and render
        saveData();
        renderAll();
        
        // Show notification
        showNotification('All completed tasks have been cleared', 'success');
    }
}

function renderCompletedTasks() {
    const completedContainer = document.getElementById('completedTasks');
    completedContainer.innerHTML = '';
    
    // Get the selected project filter
    const projectFilter = document.getElementById('completedProjectFilter').value;
    
    // Filter completed todos based on selected project
    let completedTodos = todos.filter(todo => todo.completed);
    
    // Apply project filter if not "all"
    if (projectFilter !== 'all') {
        completedTodos = completedTodos.filter(todo => todo.project === projectFilter);
    }
    
    // Sort by completion date (newest first)
    completedTodos = completedTodos.sort((a, b) => b.completedAt - a.completedAt);
    
    // Update completed counter
    document.getElementById('completedCounter').textContent = completedTodos.length;
    
    // Populate project filter dropdown
    populateCompletedProjectFilter();
    
    if (completedTodos.length > 0) {
        // Add scrollable class if there are more than 5 completed tasks
        if (completedTodos.length > 5) {
            completedContainer.classList.add('scrollable-completed');
        } else {
            completedContainer.classList.remove('scrollable-completed');
        }
        
        // Render all completed tasks
        completedTodos.forEach(todo => {
            completedContainer.appendChild(renderTodoItem(todo));
        });
    } else {
        // Render empty state for completed tasks
        const emptyCompletedState = document.createElement('div');
        emptyCompletedState.className = 'empty-state';
        emptyCompletedState.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <h3>No Completed Tasks</h3>
            <p>Tasks you complete will appear here.</p>
        `;
        completedContainer.appendChild(emptyCompletedState);
    }
}
