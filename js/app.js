let todos = [];
let projects = ['Work', 'Personal']; // Default projects
let showCompleted = true;
let hiddenProjects = new Set(); // Track hidden projects
let projectColors = {};
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
            completedAt: todo.completedAt ? new Date(todo.completedAt) : null
        }));
    }
    
    if (savedProjects) {
        projects = JSON.parse(savedProjects);
    }

    if (savedHiddenProjects) {
        hiddenProjects = new Set(JSON.parse(savedHiddenProjects));
    }

    if (savedProjectColors) {
        projectColors = JSON.parse(savedProjectColors);
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
        newProjectPickr.destroyAndRemove();
        newProjectPickr = null;
    }
    
    // Create a new color picker instance
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
    
    if (text && project) {
        const projectTodos = todos.filter(t => !t.completed && t.project === project);
        todos.push({
            id: Date.now(),
            text: text,
            project: project,
            completed: false,
            completedAt: null,
            priority: projectTodos.length
        });
        
        input.value = '';
        projectSelect.value = project; // Keep the project selected
        saveData();
        renderAll();
    } else if (!text) {
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
        todo.completed = !todo.completed;
        todo.completedAt = todo.completed ? new Date() : null;
        saveData();
        renderAll();
    }
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
    const todoDiv = document.createElement('div');
    todoDiv.className = `todo-item ${todo.completed ? 'completed' : ''}`;
    todoDiv.draggable = !todo.completed;
    todoDiv.dataset.id = todo.id;
    
    // Ensure project has a color
    if (!projectColors[todo.project]) {
        projectColors[todo.project] = getRandomColor();
        saveData();
    }
    
    // Apply project color to the todo item
    const projectColor = projectColors[todo.project];
    todoDiv.style.borderLeft = `4px solid ${projectColor}`;
    
    todoDiv.innerHTML = `
        <input type="checkbox" 
               class="todo-checkbox" 
               ${todo.completed ? 'checked' : ''}
               onchange="toggleTodo(${todo.id})">
        <span class="todo-text ${todo.completed ? 'completed' : ''}">${todo.text}</span>
        <span class="project-tag ${todo.project.toLowerCase()}" style="background-color: ${projectColor}">${todo.project}</span>
        ${todo.completed ? `<span class="completion-date">${formatDate(todo.completedAt)}</span>` : ''}
        <button class="delete-btn" onclick="deleteTodo(${todo.id})">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    if (!todo.completed) {
        todoDiv.addEventListener('dragstart', handleDragStart);
        todoDiv.addEventListener('dragend', handleDragEnd);
    }
    
    return todoDiv;
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

function renderAll() {
    const projectsContainer = document.getElementById('projectsContainer');
    projectsContainer.innerHTML = '';

    // Remove any existing show hidden containers
    document.querySelectorAll('.show-hidden-container').forEach(container => container.remove());

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
            
            const todoContainer = document.createElement('div');
            todoContainer.className = 'project-todos';
            todoContainer.dataset.project = project;
            
            // Add drag and drop event listeners to the container
            todoContainer.addEventListener('dragover', handleDragOver);
            todoContainer.addEventListener('dragenter', handleDragEnter);
            todoContainer.addEventListener('dragleave', handleDragLeave);
            todoContainer.addEventListener('drop', handleDrop);
            
            projectTodos.forEach(todo => {
                todoContainer.appendChild(renderTodoItem(todo));
            });
            
            column.appendChild(header);
            column.appendChild(todoContainer);
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

    // Render completed tasks
    const completedContainer = document.getElementById('completedTasks');
    completedContainer.innerHTML = '';
    
    const completedTodos = todos.filter(todo => todo.completed)
        .sort((a, b) => b.completedAt - a.completedAt);
    
    completedTodos.forEach(todo => {
        completedContainer.appendChild(renderTodoItem(todo));
    });
    
    document.getElementById('completedCounter').textContent = completedTodos.length;
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
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

// Initialize dark mode
function initDarkMode() {
    const darkModeEnabled = localStorage.getItem('darkMode') === 'true';
    if (darkModeEnabled) {
        document.body.classList.add('dark-mode');
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initDarkMode();
    
    // Add event listener for dark mode toggle
    document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);
    
    // Add event listener for New Project button
    document.querySelector('.add-project-btn').addEventListener('click', openNewProjectModal);
    
    // Add event listener for Enter key on project name input
    document.getElementById('newProjectName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            createNewProject();
        }
    });
    
    // Add event listener for ESC key to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeNewProjectModal();
        }
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('newProjectModal');
        if (e.target === modal) {
            closeNewProjectModal();
        }
    });
    
    addDragAndDropListeners();
});
