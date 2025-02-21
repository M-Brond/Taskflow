let todos = [];
let projects = ['Work', 'Personal']; // Default projects
let showCompleted = true;
let hiddenProjects = new Set(); // Track hidden projects

// Load data from localStorage
function loadData() {
    const savedTodos = localStorage.getItem('todos');
    const savedProjects = localStorage.getItem('projects');
    const savedHiddenProjects = localStorage.getItem('hiddenProjects');
    
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

    updateProjectSelect();
    renderAll();
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('todos', JSON.stringify(todos));
    localStorage.setItem('projects', JSON.stringify(projects));
    localStorage.setItem('hiddenProjects', JSON.stringify(Array.from(hiddenProjects)));
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

function addNewProject() {
    const projectName = prompt('Enter project name:');
    if (projectName && !projects.includes(projectName)) {
        projects.push(projectName);
        saveData();
        updateProjectSelect();
        renderAll();
    }
}

function updateProjectSelect() {
    const select = document.getElementById('projectSelect');
    select.innerHTML = '<option value="">Select Project</option>';
    projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project;
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
    
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
        return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
        return 'just now';
    }
}

function renderAll() {
    const projectsContainer = document.getElementById('projectsContainer');
    projectsContainer.innerHTML = '';

    // Always render Work project first
    const sortedProjects = ['Work', ...projects.filter(p => p !== 'Work')];

    sortedProjects.forEach(project => {
        if (hiddenProjects.has(project)) return;

        const projectTodos = todos.filter(todo => !todo.completed && todo.project === project);
        const column = document.createElement('div');
        column.className = `project-column ${project.toLowerCase()}`;
        column.innerHTML = `
            <div class="project-header">
                <div class="project-title-section">
                    <h3 class="project-title">${project}</h3>
                    <span class="project-counter ${project.toLowerCase()}">${projectTodos.length}</span>
                </div>
                ${project !== 'Work' ? `
                    <button class="project-visibility-toggle" onclick="toggleProjectVisibility('${project}')">
                        <span>${hiddenProjects.has(project) ? 'Show' : 'Hide'}</span>
                        <i class="fas fa-eye${hiddenProjects.has(project) ? '-slash' : ''}"></i>
                    </button>
                ` : ''}
            </div>
            <div class="project-todos" data-project="${project}">
                ${projectTodos.map(todo => renderTodoItem(todo)).join('')}
            </div>
        `;
        projectsContainer.appendChild(column);
    });

    // Add button to show hidden projects
    const hiddenProjectsCount = hiddenProjects.size;
    if (hiddenProjectsCount > 0) {
        const showHiddenContainer = document.createElement('div');
        showHiddenContainer.className = 'show-hidden-container';
        
        const showHiddenButton = document.createElement('button');
        showHiddenButton.className = 'project-visibility-toggle show-hidden';
        showHiddenButton.innerHTML = `
            <span>Show ${hiddenProjectsCount} hidden project${hiddenProjectsCount > 1 ? 's' : ''}</span>
            <i class="fas fa-eye"></i>
        `;
        showHiddenButton.onclick = () => {
            hiddenProjects.clear();
            saveData();
            renderAll();
        };
        
        showHiddenContainer.appendChild(showHiddenButton);
        projectsContainer.after(showHiddenContainer);
    }

    // Render completed tasks
    const completedTasks = todos.filter(todo => todo.completed)
        .sort((a, b) => b.completedAt - a.completedAt);
    
    document.getElementById('completedCounter').textContent = completedTasks.length;
    const completedContainer = document.getElementById('completedTasks');
    completedContainer.innerHTML = completedTasks.map(todo => renderTodoItem(todo)).join('');

    // Add drag and drop listeners
    addDragAndDropListeners();
}

function renderTodoItem(todo) {
    return `
        <div class="todo-item ${todo.project.toLowerCase()}" draggable="${!todo.completed}" data-id="${todo.id}">
            <input type="checkbox" 
                   class="todo-checkbox" 
                   ${todo.completed ? 'checked' : ''}
                   onchange="toggleTodo(${todo.id})">
            <span class="todo-text ${todo.completed ? 'completed' : ''}">${todo.text}</span>
            <span class="project-tag ${todo.project.toLowerCase()}">${todo.project}</span>
            ${todo.completed ? `<span class="completion-date">${formatDate(todo.completedAt)}</span>` : ''}
            <button class="delete-btn" onclick="deleteTodo(${todo.id})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
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

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', loadData);
