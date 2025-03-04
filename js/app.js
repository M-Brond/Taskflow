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
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

function initDarkMode() {
    const darkModeEnabled = localStorage.getItem('darkMode') === 'true';
    if (darkModeEnabled) {
        document.body.classList.add('dark-mode');
    }
}

function initDataStorageNotice() {
    const noticeKey = 'taskflow_notice_dismissed';
    const noticeDismissed = localStorage.getItem(noticeKey) === 'true';
    const notice = document.getElementById('dataStorageNotice');
    
    if (!noticeDismissed) {
        notice.style.display = 'block';
    } else {
        notice.style.display = 'none';
    }
    
    document.getElementById('closeNoticeBtn').addEventListener('click', function() {
        notice.classList.add('hiding');
        setTimeout(() => {
            notice.style.display = 'none';
            notice.classList.remove('hiding');
        }, 300);
        localStorage.setItem(noticeKey, 'true');
    });
    
    // Add event listener for export/import button
    document.getElementById('exportImportBtn').addEventListener('click', function() {
        openExportImportModal();
    });
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

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    initDarkMode();
    initDataStorageNotice();
    
    // Add event listener for the add project button
    document.querySelector('.add-project-btn').addEventListener('click', openNewProjectModal);
    
    // Add event listeners for export/import
    document.getElementById('exportDataBtn').addEventListener('click', exportData);
    document.getElementById('importDataBtn').addEventListener('click', importData);
    document.getElementById('importFileInput').addEventListener('change', handleFileImport);
    
    // Show tutorial if it's the first visit
    initTutorial();
    
    // Add event listener for dark mode toggle
    document.getElementById('darkModeToggle').addEventListener('click', function() {
        toggleDarkMode();
    });
    
    // Set up input event listeners
    document.getElementById('todoInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTodo();
        }
    });
    
    document.getElementById('newProjectName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            createNewProject();
        }
    });
    
    // Close modal with escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeNewProjectModal();
            closeExportImportModal();
        }
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        const newProjectModal = document.getElementById('newProjectModal');
        const exportImportModal = document.getElementById('exportImportModal');
        
        if (e.target === newProjectModal) {
            closeNewProjectModal();
        }
        
        if (e.target === exportImportModal) {
            closeExportImportModal();
        }
    });
    
    // Add drag and drop functionality
    addDragAndDropListeners();
    
    // Add tooltips
    addTooltips();
    
    // Check if there's a hash in the URL for deep linking
    const hash = window.location.hash;
    if (hash && hash.startsWith('#project-')) {
        const projectName = decodeURIComponent(hash.substring(9));
        if (projects.includes(projectName)) {
            // Scroll to the project
            setTimeout(() => {
                const projectEl = document.getElementById(`project-${projectName}`);
                if (projectEl) {
                    projectEl.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);
        }
    }
});
