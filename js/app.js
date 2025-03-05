let todos = [];
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

    if (savedHiddenProjects) {
        hiddenProjects = new Set(JSON.parse(savedHiddenProjects));
    }

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

function deleteTodo(id) {
    todos = todos.filter(todo => todo.id !== id);
    saveData();
    renderAll();
}

function toggleCompletedTasks() {
    showCompleted = !showCompleted;
    const completedTasks = document.getElementById('completedTasks');
    const toggle = document.getElementById('completedToggle');
    completedTasks.style.maxHeight = showCompleted ? completedTasks.scrollHeight + 'px' : '0';
    toggle.textContent = showCompleted ? '▼' : '▶';
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
    
    // Create date display with subtle styling
    const todoDate = document.createElement('small');
    todoDate.className = 'todo-date';
    todoDate.textContent = todo.completed 
        ? `Completed ${formatDate(todo.completedAt)}` 
        : formatDate(todo.createdAt);
    
    // Add elements to todo content
    todoContent.appendChild(checkbox);
    todoContent.appendChild(todoText);
    
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
        deleteTodo(todo.id);
    });
    
    // Add buttons to actions
    todoActions.appendChild(commentsBtn);
    todoActions.appendChild(deleteBtn);
    
    // Add content and actions to todo item
    todoContent.appendChild(todoDate); // Move date to the end of content
    todoItem.appendChild(todoContent);
    todoItem.appendChild(todoActions);
    
    // Create comments section
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
    
    todoItem.appendChild(commentsSection);
    
    return todoItem;
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
    const commentsSection = document.getElementById(`comments-${todoId}`);
    if (commentsSection) {
        commentsSection.classList.toggle('show-comments');
        
        // Focus the input if showing comments
        if (commentsSection.classList.contains('show-comments')) {
            const commentInput = document.getElementById(`comment-input-${todoId}`);
            if (commentInput) {
                commentInput.focus();
            }
        }
    }
}

function renderProjectHeader(project) {
    const header = document.createElement('div');
    header.className = 'project-header';
    const projectTodos = todos.filter(todo => !todo.completed && todo.project === project);
    
    header.innerHTML = `
        <h3 class="project-title">${project}</h3>
        <span class="project-counter">${projectTodos.length}</span>
        <button class="project-visibility-toggle" onclick="toggleProjectVisibility('${project}')">
            <i class="fas fa-eye-slash"></i>
        </button>
        <div class="color-picker-container">
            <div class="color-picker" id="color-picker-${project}" style="background-color: ${projectColors[project] || getRandomColor()}"></div>
        </div>
        <button class="project-remove-btn" onclick="removeProject('${project}')">
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
    if (confirm(`Are you sure you want to remove the project "${project}"?\nAll tasks in this project will also be deleted.`)) {
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
}

function updateTodoPriorities(project) {
    const projectTodos = todos.filter(t => !t.completed && t.project === project);
    projectTodos.forEach((todo, index) => {
        todo.priority = index;
    });
    saveData();
}

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

let draggedItem = null;
let originalContainer = null;

function handleDragStart(e) {
    draggedItem = e.target;
    originalContainer = e.target.closest('.project-todos');
    e.target.classList.add('dragging');
    
    // Set drag effect
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ''); // Required for Firefox
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    draggedItem = null;
    originalContainer = null;
    document.querySelectorAll('.project-todos').forEach(container => {
        container.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    e.preventDefault();
    const container = e.target.closest('.project-todos');
    if (container) {
        container.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    const container = e.target.closest('.project-todos');
    if (container) {
        container.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    const container = e.target.closest('.project-todos');
    if (!container || !draggedItem) return;

    const newProject = container.dataset.project;
    const todoId = parseInt(draggedItem.dataset.id);
    const todo = todos.find(t => t.id === todoId);
    
    if (!todo) return;

    // Get the drop target position
    const dropTarget = e.target.closest('.todo-item');
    const items = Array.from(container.querySelectorAll('.todo-item:not(.completed)'));
    
    // Remove the dragged item from its current position
    const projectTodos = todos.filter(t => !t.completed && t.project === todo.project);
    projectTodos.splice(todo.priority, 1);
    
    // Update project if changed
    todo.project = newProject;
    
    if (dropTarget) {
        // Get the index where to insert the dragged item
        const dropTodo = todos.find(t => t.id === parseInt(dropTarget.dataset.id));
        const dropIndex = dropTodo.priority;
        
        // Update priorities for all todos in the project
        const targetProjectTodos = todos.filter(t => !t.completed && t.project === newProject);
        targetProjectTodos.forEach(t => {
            if (t.priority >= dropIndex) {
                t.priority++;
            }
        });
        
        // Set the new priority for the dragged item
        todo.priority = dropIndex;
    } else {
        // If dropped at the end of the list
        const targetProjectTodos = todos.filter(t => !t.completed && t.project === newProject);
        todo.priority = targetProjectTodos.length;
    }
    
    saveData();
    renderAll();
}

// Add styles for drag and drop
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
    }
    
    // Add event listener to the dark mode toggle button
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleDarkMode);
    }
}

// Global variables for data storage notice
let minimizeNoticeHandler, expandNoticeHandler;
let dataStorageNoticeInitialized = false;

function initDataStorageNotice() {
    // Prevent multiple initializations
    if (dataStorageNoticeInitialized) return;
    
    const minimizedKey = 'taskflow_notice_minimized';
    const noticeMinimized = localStorage.getItem(minimizedKey) === 'true';
    
    const notice = document.getElementById('dataStorageNotice');
    const minimizedNotice = document.getElementById('minimizedNotice');
    const minimizeBtn = document.getElementById('minimizeNoticeBtn');
    const expandBtn = document.getElementById('expandNoticeBtn');
    
    if (!notice || !minimizedNotice) return;
    
    // Initial state based on localStorage
    if (noticeMinimized) {
        notice.style.display = 'none';
        minimizedNotice.style.display = 'block';
    } else {
        notice.style.display = 'block';
        minimizedNotice.style.display = 'none';
    }
    
    // Clear any existing event listeners
    if (minimizeBtn) {
        if (minimizeNoticeHandler) {
            minimizeBtn.removeEventListener('click', minimizeNoticeHandler);
        }
        
        minimizeNoticeHandler = function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Prevent multiple clicks
            if (notice.classList.contains('hiding')) return;
            
            // Add visual feedback
            this.classList.add('active');
            setTimeout(() => this.classList.remove('active'), 200);
            
            // Get the position of the minimized button for animation
            const minimizedRect = minimizedNotice.getBoundingClientRect();
            const noticeRect = notice.getBoundingClientRect();
            
            // Calculate the distance to animate
            const distanceX = (minimizedRect.left - noticeRect.left) || -100;
            const distanceY = (minimizedRect.top - noticeRect.top) || 0;
            
            // Apply custom animation
            notice.style.transition = 'opacity 0.3s, transform 0.3s';
            notice.style.transformOrigin = 'bottom left';
            notice.style.transform = `translate(${distanceX}px, ${distanceY}px) scale(0.2)`;
            notice.style.opacity = '0';
            
            setTimeout(() => {
                notice.style.display = 'none';
                notice.style.transform = '';
                notice.style.opacity = '';
                
                minimizedNotice.style.display = 'block';
                minimizedNotice.classList.add('showing');
                setTimeout(() => minimizedNotice.classList.remove('showing'), 300);
            }, 300);
            localStorage.setItem(minimizedKey, 'true');
        };
        
        minimizeBtn.addEventListener('click', minimizeNoticeHandler);
    }
    
    if (expandBtn) {
        if (expandNoticeHandler) {
            expandBtn.removeEventListener('click', expandNoticeHandler);
        }
        
        expandNoticeHandler = function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Prevent multiple clicks
            if (minimizedNotice.classList.contains('hiding')) return;
            
            // Add visual feedback
            this.classList.add('active');
            setTimeout(() => this.classList.remove('active'), 200);
            
            // Get the position of the elements for animation
            const minimizedRect = minimizedNotice.getBoundingClientRect();
            
            // Set a flag to prevent multiple clicks
            let isExpanding = true;
            
            // Apply custom animation
            minimizedNotice.style.transition = 'opacity 0.3s, transform 0.3s';
            minimizedNotice.style.transformOrigin = 'center';
            minimizedNotice.style.transform = 'scale(0.8)';
            minimizedNotice.style.opacity = '0';
            
            setTimeout(() => {
                minimizedNotice.style.display = 'none';
                minimizedNotice.style.transform = '';
                minimizedNotice.style.opacity = '';
                
                // Only show the notice if we're still in the expanding state
                if (isExpanding) {
                    notice.style.display = 'block';
                    notice.style.opacity = '0';
                    notice.style.transform = 'translateX(-20px) scale(0.9)';
                    
                    // Force a reflow to ensure the animation works
                    notice.offsetHeight;
                    
                    notice.style.transition = 'opacity 0.3s, transform 0.3s';
                    notice.style.opacity = '1';
                    notice.style.transform = 'translateX(0) scale(1)';
                    
                    setTimeout(() => {
                        notice.style.transition = '';
                    }, 300);
                    
                    isExpanding = false;
                }
            }, 300);
            localStorage.removeItem(minimizedKey);
        };
        
        expandBtn.addEventListener('click', expandNoticeHandler);
    }
    
    // Add event listener for export/import button
    const exportImportBtn = document.getElementById('exportImportBtn');
    if (exportImportBtn) {
        // Remove any existing listeners
        const newExportImportBtn = exportImportBtn.cloneNode(true);
        exportImportBtn.parentNode.replaceChild(newExportImportBtn, exportImportBtn);
        
        // Add fresh listener
        newExportImportBtn.addEventListener('click', function() {
            openExportImportModal();
            
            // Setup the export/import buttons in the modal
            const exportDataBtn = document.getElementById('exportDataBtn');
            if (exportDataBtn) {
                // Remove any existing listeners
                const newExportDataBtn = exportDataBtn.cloneNode(true);
                exportDataBtn.parentNode.replaceChild(newExportDataBtn, exportDataBtn);
                
                // Add fresh listener
                newExportDataBtn.addEventListener('click', exportData);
            }
            
            const importDataBtn = document.getElementById('importDataBtn');
            if (importDataBtn) {
                // Remove any existing listeners
                const newImportDataBtn = importDataBtn.cloneNode(true);
                importDataBtn.parentNode.replaceChild(newImportDataBtn, importDataBtn);
                
                // Add fresh listener
                newImportDataBtn.addEventListener('click', importData);
            }
            
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
        });
    }
    
    // Mark as initialized
    dataStorageNoticeInitialized = true;
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

// Export/Import functions
function openExportImportModal() {
    const modal = document.getElementById('exportImportModal');
    modal.style.display = 'flex';
    
    // Clear any previous import status
    document.getElementById('importStatus').textContent = '';
    document.getElementById('importStatus').className = 'import-status';
}

function closeExportImportModal() {
    const modal = document.getElementById('exportImportModal');
    modal.style.display = 'none';
}

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
    
    // Clean up
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
}

function importData() {
    const fileInput = document.getElementById('importFileInput');
    fileInput.click();
}

function handleFileImport(event) {
    const file = event.target.files[0];
    const statusEl = document.getElementById('importStatus');
    
    if (!file) {
        return;
    }
    
    // Check if it's a JSON file
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        statusEl.textContent = 'Error: Please select a valid JSON file.';
        statusEl.className = 'import-status error';
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Validate the imported data
            if (!importedData.todos || !importedData.projects || !importedData.projectColors) {
                throw new Error('Invalid backup file format.');
            }
            
            // Import the data
            todos = importedData.todos.map(todo => ({
                ...todo,
                completedAt: todo.completedAt ? new Date(todo.completedAt) : null
            }));
            
            projects = importedData.projects;
            
            if (importedData.hiddenProjects) {
                hiddenProjects = new Set(importedData.hiddenProjects);
            }
            
            projectColors = importedData.projectColors;
            
            // Save to localStorage and refresh UI
            saveData();
            updateProjectSelect();
            renderAll();
            
            // Show success message
            statusEl.textContent = 'Tasks imported successfully!';
            statusEl.className = 'import-status success';
            
            // Reset file input
            event.target.value = '';
            
        } catch (error) {
            console.error('Import error:', error);
            statusEl.textContent = `Error: ${error.message || 'Failed to import data.'}`;
            statusEl.className = 'import-status error';
        }
    };
    
    reader.onerror = function() {
        statusEl.textContent = 'Error: Failed to read the file.';
        statusEl.className = 'import-status error';
    };
    
    reader.readAsText(file);
}

// Initialize the app when the DOM is loaded
let appInitialized = false;

function initApp() {
    if (appInitialized) return;
    
    // Initialize dark mode
    initDarkMode();
    
    // Initialize data storage notice
    initDataStorageNotice();
    
    // Load todos from localStorage
    loadData();
    
    // Initialize the project filter
    updateProjectFilter();
    
    // Update the project select dropdown
    updateProjectSelect();
    
    // Set up event listeners
    setupEventListeners();
    
    // Mark as initialized
    appInitialized = true;
}

document.addEventListener('DOMContentLoaded', function() {
    initApp();
    renderAll();
    
    // Check if there's a hash in the URL to show a specific project
    if (window.location.hash) {
        const projectName = decodeURIComponent(window.location.hash.substring(1));
        filterByProject(projectName);
    }
});

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
    
    // Export/Import buttons
    const exportDataBtn = document.getElementById('exportDataBtn');
    if (exportDataBtn) {
        // Remove any existing listeners
        const newExportDataBtn = exportDataBtn.cloneNode(true);
        exportDataBtn.parentNode.replaceChild(newExportDataBtn, exportDataBtn);
        
        // Add fresh listener
        newExportDataBtn.addEventListener('click', exportData);
    }
    
    const importDataBtn = document.getElementById('importDataBtn');
    if (importDataBtn) {
        // Remove any existing listeners
        const newImportDataBtn = importDataBtn.cloneNode(true);
        importDataBtn.parentNode.replaceChild(newImportDataBtn, importDataBtn);
        
        // Add fresh listener
        newImportDataBtn.addEventListener('click', importData);
    }
    
    const importFileInput = document.getElementById('importFileInput');
    if (importFileInput) {
        // Remove any existing listeners
        const newImportFileInput = importFileInput.cloneNode(true);
        importFileInput.parentNode.replaceChild(newImportFileInput, importFileInput);
        
        // Add fresh listener
        newImportFileInput.addEventListener('change', handleFileImport);
    }
    
    // Other event listeners...
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
            
            // Add drag and drop event listeners to the container
            todosList.addEventListener('dragover', handleDragOver);
            todosList.addEventListener('dragenter', handleDragEnter);
            todosList.addEventListener('dragleave', handleDragLeave);
            todosList.addEventListener('drop', handleDrop);
            
            // Check if project has any todos
            if (projectTodos.length > 0) {
                projectTodos.forEach(todo => {
                    todosList.appendChild(renderTodoItem(todo));
                });
            } else {
                // Render empty state
                todosList.appendChild(renderEmptyState(project));
            }
            
            column.appendChild(header);
            column.appendChild(todosList);
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

    // Render completed tasks
    const completedContainer = document.getElementById('completedTasks');
    completedContainer.innerHTML = '';
    
    const completedTodos = todos.filter(todo => todo.completed)
        .sort((a, b) => b.completedAt - a.completedAt);
    
    if (completedTodos.length > 0) {
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
    
    document.getElementById('completedCounter').textContent = completedTodos.length;
    
    // Add tooltips to elements
    addTooltips();
}

// Render empty state for a project
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

// Focus the add task input and select the project
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

// Add tooltips to elements
function addTooltips() {
    // Add tooltip to project visibility toggle
    document.querySelectorAll('.project-visibility-toggle').forEach(button => {
        if (!button.querySelector('.tooltip')) {
            const tooltipSpan = document.createElement('span');
            tooltipSpan.className = 'tooltip';
            tooltipSpan.innerHTML = `
                <span class="tooltip-text">Hide this project from view. You can show it again later.</span>
            `;
            button.appendChild(tooltipSpan);
        }
    });
    
    // Add tooltip to drag handle
    document.querySelectorAll('.drag-handle').forEach(handle => {
        if (!handle.querySelector('.tooltip')) {
            const tooltipSpan = document.createElement('span');
            tooltipSpan.className = 'tooltip';
            tooltipSpan.innerHTML = `
                <span class="tooltip-text">Drag to reorder or move to another project</span>
            `;
            handle.appendChild(tooltipSpan);
        }
    });
    
    // Add tooltip to dark mode toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle && !darkModeToggle.querySelector('.tooltip')) {
        const tooltipSpan = document.createElement('span');
        tooltipSpan.className = 'tooltip';
        tooltipSpan.innerHTML = `
                <span class="tooltip-text">Toggle dark mode</span>
        `;
        darkModeToggle.appendChild(tooltipSpan);
    }
}

// Filter to show only a specific project
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
        updateProjectFilter();
        renderAll();
    }
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
