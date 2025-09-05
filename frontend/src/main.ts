// Mock data for development
interface Task {
    id: number;
    title: string;
    completed: boolean;
    createdAt: Date;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    dueDate?: Date;
}

const mockTasks: Task[] = [
    {
        id: 1,
        title: "Review quarterly reports",
        completed: false,
        createdAt: new Date('2025-01-15'),
        description: "Review Q4 financial reports and prepare summary for board meeting",
        priority: 'high',
        dueDate: new Date('2025-01-20')
    },
    {
        id: 2,
        title: "Update project documentation",
        completed: true,
        createdAt: new Date('2025-01-14'),
        description: "Update API documentation with new endpoints",
        priority: 'medium'
    },
    {
        id: 3,
        title: "Schedule team meeting",
        completed: false,
        createdAt: new Date('2025-01-13'),
        priority: 'low'
    },
    {
        id: 4,
        title: "Fix authentication bug",
        completed: true,
        createdAt: new Date('2025-01-12'),
        description: "Resolve issue with OAuth token refresh",
        priority: 'high'
    },
    {
        id: 5,
        title: "Prepare presentation slides",
        completed: false,
        createdAt: new Date('2025-01-11'),
        description: "Create slides for client presentation next week",
        priority: 'medium',
        dueDate: new Date('2025-01-18')
    },
];

class TodoApp {
    private tasks: Task[] = [...mockTasks];
    private currentFilter: 'all' | 'pending' | 'completed' = 'all';
    private currentTaskId: number | null = null;
    private isAnimating: boolean = false;

    private newTaskInput: HTMLInputElement;
    private tasksContainer: HTMLElement;
    private allCountEl: HTMLElement;
    private pendingCountEl: HTMLElement;
    private completedCountEl: HTMLElement;
    private totalTasksEl: HTMLElement;
    private completionRateEl: HTMLElement;
    private sidebar: HTMLElement;
    private resizeHandle: HTMLElement;
    private modal: HTMLElement;
    private taskFilters: HTMLElement;

    // Lucide icon SVG paths
    private icons = {
        clipboardList: '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
        clock: '<circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>',
        checkCircle: '<path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/>',
        plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
        trash2: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1-1 1-2 2-2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
        x: '<path d="M18 6 6 18"/><path d="M6 6l12 12"/>',
        circle: '<circle cx="12" cy="12" r="10"/>',
        checkCircle2: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>'
    };

    constructor() {
        this.newTaskInput = document.querySelector('#new-task-input')!;
        this.tasksContainer = document.querySelector('#tasks-container')!;
        this.allCountEl = document.querySelector('#all-count')!;
        this.pendingCountEl = document.querySelector('#pending-count')!;
        this.completedCountEl = document.querySelector('#completed-count')!;
        this.totalTasksEl = document.querySelector('#total-tasks')!;
        this.completionRateEl = document.querySelector('#completion-rate')!;
        this.sidebar = document.querySelector('#sidebar')!;
        this.resizeHandle = document.querySelector('#resize-handle')!;
        this.modal = document.querySelector('#task-detail-modal')!;
        this.taskFilters = document.querySelector('.task-filters')!;

        this.setupEventListeners();
        this.setupResizing();
        this.setupIcons();
        this.updatePillIndicator();
        this.render();
    }

    private createIcon(iconKey: keyof typeof this.icons, size: number = 16): string {
        return `
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        ${this.icons[iconKey]}
      </svg>
    `;
    }

    private setupIcons(): void {
        // Setup navigation icons
        const allTasksIcon = document.querySelector('.nav-item[data-filter="all"] .nav-icon');
        const pendingIcon = document.querySelector('.nav-item[data-filter="pending"] .nav-icon');
        const completedIcon = document.querySelector('.nav-item[data-filter="completed"] .nav-icon');

        if (allTasksIcon) {
            allTasksIcon.innerHTML = this.createIcon('clipboardList');
        }
        if (pendingIcon) {
            pendingIcon.innerHTML = this.createIcon('clock');
        }
        if (completedIcon) {
            completedIcon.innerHTML = this.createIcon('checkCircle');
        }

        // Setup add task button icon
        const addTaskBtn = document.querySelector('#add-task-btn');
        if (addTaskBtn) {
            addTaskBtn.innerHTML = `${this.createIcon('plus')} Add Task`;
        }

        // Setup modal close button
        const modalClose = document.querySelector('.modal-close');
        if (modalClose) {
            modalClose.innerHTML = this.createIcon('x');
        }
    }

    private updatePillIndicator(): void {
        if (this.taskFilters) {
            this.taskFilters.setAttribute('data-active', this.currentFilter);
        }
    }

    private setupEventListeners(): void {
        // Add task button
        document.querySelector('#add-task-btn')?.addEventListener('click', () => {
            this.addTask();
        });

        // Add task on Enter key
        this.newTaskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTask();
            }
        });

        // Navigation filter buttons
        document.querySelectorAll('.nav-item[data-filter]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = ((e.target as HTMLElement).closest('.nav-item') as HTMLElement)?.dataset.filter as typeof this.currentFilter;
                if (filter && filter !== this.currentFilter && !this.isAnimating) {
                    this.setFilterWithAnimation(filter);
                }
            });
        });

        // Top filter buttons (pills)
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = (e.target as HTMLElement).dataset.filter as typeof this.currentFilter;
                if (filter && filter !== this.currentFilter && !this.isAnimating) {
                    this.setFilterWithAnimation(filter);
                }
            });
        });

        // Task container event delegation
        this.tasksContainer.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;

            // Handle checkbox clicks
            if (target.classList.contains('task-checkbox') || target.closest('.task-checkbox')) {
                e.stopPropagation();
                const taskItem = target.closest('.task-item') as HTMLElement;
                const taskId = parseInt(taskItem.dataset.taskId!);
                this.toggleTask(taskId);
                return;
            }

            // Handle delete button clicks
            if (target.classList.contains('task-action-btn') || target.closest('.task-action-btn')) {
                e.stopPropagation();
                const taskItem = target.closest('.task-item') as HTMLElement;
                const taskId = parseInt(taskItem.dataset.taskId!);
                this.deleteTask(taskId);
                return;
            }

            // Handle task item clicks (open modal)
            const taskItem = target.closest('.task-item') as HTMLElement;
            if (taskItem) {
                const taskId = parseInt(taskItem.dataset.taskId!);
                this.openTaskDetail(taskId);
            }
        });

        // Modal event listeners
        this.modal.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;

            if (target.classList.contains('modal-overlay')) {
                this.closeTaskDetail();
            }

            if (target.classList.contains('modal-close') || target.closest('.modal-close')) {
                this.closeTaskDetail();
            }
        });

        // Save button
        document.querySelector('[data-action="save-task"]')?.addEventListener('click', () => {
            this.saveTaskDetails();
        });

        // Cancel button  
        document.querySelector('[data-action="close-modal"]')?.addEventListener('click', () => {
            this.closeTaskDetail();
        });

        // Keyboard navigation for accessibility
        this.tasksContainer.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const target = e.target as HTMLElement;
                if (target.classList.contains('task-checkbox')) {
                    e.preventDefault();
                    const taskItem = target.closest('.task-item') as HTMLElement;
                    const taskId = parseInt(taskItem.dataset.taskId!);
                    this.toggleTask(taskId);
                }
            }
        });

        // Modal keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('open')) {
                this.closeTaskDetail();
            }
        });
    }

    private setupResizing(): void {
        if (!this.resizeHandle) return;

        let isResizing = false;
        let startX = 0;
        let startWidth = 0;

        this.resizeHandle.addEventListener('mousedown', (e: MouseEvent) => {
            isResizing = true;
            startX = e.clientX;
            startWidth = parseInt(document.defaultView!.getComputedStyle(this.sidebar).width, 10);
            document.documentElement.style.cursor = 'col-resize';
            document.documentElement.style.userSelect = 'none';

            e.preventDefault();
        });

        document.addEventListener('mousemove', (e: MouseEvent) => {
            if (!isResizing) return;

            const width = startWidth + e.clientX - startX;
            if (width > 200 && width < 600) {
                this.sidebar.style.width = width + 'px';
            }
        });

        document.addEventListener('mouseup', () => {
            isResizing = false;
            document.documentElement.style.cursor = '';
            document.documentElement.style.userSelect = '';
        });
    }

    private addTask(): void {
        const title = this.newTaskInput.value.trim();
        if (!title) return;

        const newTask: Task = {
            id: Math.max(...this.tasks.map(t => t.id), 0) + 1,
            title,
            completed: false,
            createdAt: new Date(),
            priority: 'medium'
        };

        this.tasks.unshift(newTask);
        this.newTaskInput.value = '';
        this.renderWithAnimation('add');

        this.announceToScreenReader(`Task "${title}" added`);
    }

    private toggleTask(id: number): void {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.render();

            const status = task.completed ? 'completed' : 'pending';
            this.announceToScreenReader(`Task "${task.title}" marked as ${status}`);
        }
    }

    private deleteTask(id: number): void {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            // Animate the task out
            const taskElement = document.querySelector(`[data-task-id="${id}"]`) as HTMLElement;
            if (taskElement) {
                taskElement.classList.add('fade-out');
                setTimeout(() => {
                    this.tasks = this.tasks.filter(t => t.id !== id);
                    this.render();
                }, 150);
            } else {
                this.tasks = this.tasks.filter(t => t.id !== id);
                this.render();
            }

            this.announceToScreenReader(`Task "${task.title}" deleted`);
        }
    }

    private setFilterWithAnimation(filter: typeof this.currentFilter): void {
        if (this.isAnimating) return;

        this.isAnimating = true;
        this.tasksContainer.classList.add('filter-changing');

        // Add fade-out animation to current tasks
        const currentTasks = this.tasksContainer.querySelectorAll('.task-item');
        currentTasks.forEach((task, index) => {
            setTimeout(() => {
                (task as HTMLElement).classList.add('fade-out');
            }, index * 20);
        });

        // Update filter and render new tasks after animation
        setTimeout(() => {
            this.currentFilter = filter;
            this.updateFilterButtons();
            this.updatePillIndicator(); // Update the pill indicator
            this.renderWithAnimation('filter');

            setTimeout(() => {
                this.isAnimating = false;
                this.tasksContainer.classList.remove('filter-changing');
            }, 300);
        }, 150);
    }

    private updateFilterButtons(): void {
        // Update navigation active states
        document.querySelectorAll('.nav-item[data-filter]').forEach(btn => {
            const htmlBtn = btn as HTMLElement;
            htmlBtn.classList.toggle('active', htmlBtn.dataset.filter === this.currentFilter);
            htmlBtn.setAttribute('aria-current', htmlBtn.dataset.filter === this.currentFilter ? 'page' : 'false');
        });

        // Update filter button states (pills)
        document.querySelectorAll('.filter-btn').forEach(btn => {
            const htmlBtn = btn as HTMLElement;
            htmlBtn.classList.toggle('active', htmlBtn.dataset.filter === this.currentFilter);
            htmlBtn.setAttribute('aria-selected', (htmlBtn.dataset.filter === this.currentFilter).toString());
        });
    }

    private renderWithAnimation(animationType: 'filter' | 'add' = 'filter'): void {
        const filteredTasks = this.getFilteredTasks();

        if (filteredTasks.length === 0) {
            let emptyMessage = 'No tasks found';
            if (this.currentFilter === 'pending') emptyMessage = 'No pending tasks';
            if (this.currentFilter === 'completed') emptyMessage = 'No completed tasks';

            this.tasksContainer.innerHTML = `
        <div class="empty-state">
          <h3>${emptyMessage}</h3>
          <p>Start by adding a new task above</p>
        </div>
      `;
            this.tasksContainer.setAttribute('role', 'status');
        } else {
            this.tasksContainer.innerHTML = filteredTasks
                .map(task => this.createTaskElement(task))
                .join('');
            this.tasksContainer.setAttribute('role', 'list');

            // Add entrance animations
            const newTasks = this.tasksContainer.querySelectorAll('.task-item');
            newTasks.forEach((task, index) => {
                const taskElement = task as HTMLElement;

                if (animationType === 'add' && index === 0) {
                    // Special animation for newly added tasks
                    taskElement.classList.add('slide-in');
                } else {
                    // Staggered fade-in for filter changes
                    taskElement.classList.add('fade-in');
                    setTimeout(() => {
                        taskElement.classList.remove('fade-in');
                    }, 50 + index * 30);
                }
            });
        }

        this.updateStats();
    }

    private openTaskDetail(id: number): void {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        this.currentTaskId = id;

        if (!this.modal) return;

        // Populate modal with task data
        const titleInput = document.querySelector('#detail-task-title') as HTMLInputElement;
        const descInput = document.querySelector('#detail-task-description') as HTMLTextAreaElement;
        const prioritySelect = document.querySelector('#detail-task-priority') as HTMLSelectElement;
        const dueDateInput = document.querySelector('#detail-task-due-date') as HTMLInputElement;

        if (titleInput) titleInput.value = task.title;
        if (descInput) descInput.value = task.description || '';
        if (prioritySelect) prioritySelect.value = task.priority || 'medium';
        if (dueDateInput) dueDateInput.value = task.dueDate ? task.dueDate.toISOString().split('T')[0] : '';

        // Update meta information
        const createdEl = document.querySelector('#detail-created-date');
        const statusEl = document.querySelector('#detail-status');
        if (createdEl) createdEl.textContent = this.formatDate(task.createdAt);
        if (statusEl) statusEl.textContent = task.completed ? 'Completed' : 'Pending';

        // Show modal
        this.modal.classList.add('open');
        this.modal.setAttribute('aria-hidden', 'false');

        setTimeout(() => {
            if (titleInput) titleInput.focus();
        }, 100);
    }

    private closeTaskDetail(): void {
        this.currentTaskId = null;
        this.modal.classList.remove('open');
        this.modal.setAttribute('aria-hidden', 'true');
    }

    private saveTaskDetails(): void {
        if (this.currentTaskId === null) return;

        const task = this.tasks.find(t => t.id === this.currentTaskId);
        if (!task) return;

        // Get form values
        const title = (document.querySelector('#detail-task-title') as HTMLInputElement).value.trim();
        const description = (document.querySelector('#detail-task-description') as HTMLTextAreaElement).value.trim();
        const priority = (document.querySelector('#detail-task-priority') as HTMLSelectElement).value as Task['priority'];
        const dueDateStr = (document.querySelector('#detail-task-due-date') as HTMLInputElement).value;

        if (!title) {
            alert('Task title is required');
            return;
        }

        // Update task
        task.title = title;
        task.description = description || undefined;
        task.priority = priority;
        task.dueDate = dueDateStr ? new Date(dueDateStr) : undefined;

        this.render();
        this.closeTaskDetail();

        this.announceToScreenReader(`Task "${title}" updated`);
    }

    // private setFilter(filter: typeof this.currentFilter): void {
    //     this.currentFilter = filter;
    //     this.updateFilterButtons();
    //     this.updatePillIndicator();
    //     this.render();
    // }

    private getFilteredTasks(): Task[] {
        switch (this.currentFilter) {
            case 'pending':
                return this.tasks.filter(t => !t.completed);
            case 'completed':
                return this.tasks.filter(t => t.completed);
            default:
                return this.tasks;
        }
    }

    private formatDate(date: Date): string {
        const now = new Date();
        const diffTime = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;

        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short'
        });
    }

    private getPriorityColor(priority?: string): string {
        switch (priority) {
            case 'high': return 'var(--danger-color)';
            case 'medium': return 'var(--warning-color)';
            case 'low': return 'var(--success-color)';
            default: return 'var(--text-muted)';
        }
    }

    private createTaskElement(task: Task): string {
        const priorityColor = this.getPriorityColor(task.priority);
        const dueDateText = task.dueDate ? ` • Due ${this.formatDate(task.dueDate)}` : '';

        const checkboxIcon = task.completed ?
            this.createIcon('checkCircle2', 20) :
            this.createIcon('circle', 20);

        const deleteIcon = this.createIcon('trash2', 16);

        return `
      <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}" role="listitem" tabindex="0">
        <button 
          class="task-checkbox ${task.completed ? 'checked' : ''}" 
          data-action="toggle"
          aria-label="${task.completed ? 'Mark as pending' : 'Mark as completed'}"
          tabindex="0"
        >
          ${checkboxIcon}
        </button>
        <div class="task-content">
          <p class="task-title">${this.escapeHtml(task.title)}</p>
          <div class="task-meta">
            <span style="color: ${priorityColor}">●</span>
            ${task.priority || 'medium'} priority • Created ${this.formatDate(task.createdAt)}${dueDateText}
          </div>
        </div>
        <div class="task-actions">
          <button 
            class="task-action-btn danger" 
            data-action="delete"
            aria-label="Delete task: ${this.escapeHtml(task.title)}"
          >
            ${deleteIcon}
          </button>
        </div>
      </div>
    `;
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    private updateStats(): void {
        const completedCount = this.tasks.filter(t => t.completed).length;
        const pendingCount = this.tasks.filter(t => !t.completed).length;
        const totalCount = this.tasks.length;
        const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

        // Update sidebar counts
        this.allCountEl.textContent = totalCount.toString();
        this.pendingCountEl.textContent = pendingCount.toString();
        this.completedCountEl.textContent = completedCount.toString();

        // Update stats
        this.totalTasksEl.textContent = totalCount.toString();
        this.completionRateEl.textContent = `${completionRate}%`;
    }

    private announceToScreenReader(message: string): void {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'visually-hidden';
        announcement.textContent = message;

        document.body.appendChild(announcement);

        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    private render(): void {
        const filteredTasks = this.getFilteredTasks();

        if (filteredTasks.length === 0) {
            let emptyMessage = 'No tasks found';
            if (this.currentFilter === 'pending') emptyMessage = 'No pending tasks';
            if (this.currentFilter === 'completed') emptyMessage = 'No completed tasks';

            this.tasksContainer.innerHTML = `
        <div class="empty-state">
          <h3>${emptyMessage}</h3>
          <p>Start by adding a new task above</p>
        </div>
      `;
            this.tasksContainer.setAttribute('role', 'status');
        } else {
            this.tasksContainer.innerHTML = filteredTasks
                .map(task => this.createTaskElement(task))
                .join('');
            this.tasksContainer.setAttribute('role', 'list');
        }

        this.updateStats();
    }
}

// Initialize the app when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
    console.log('What Todo Next - Application loaded');
});