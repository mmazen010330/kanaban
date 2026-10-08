(function () {
  const btn1 = document.getElementById('btn1') as HTMLButtonElement | null;
  const modaloverlay = document.getElementById('modal-overlay');
  const closemodalbtn = document.getElementById('close-modal-btn') as HTMLButtonElement | null;
  const cancelbtn = document.getElementById('cancel-btn') as HTMLButtonElement | null;
  const submitbtn = document.getElementById('submit-btn') as HTMLButtonElement | null;
  const submitBtnText = document.getElementById('submit-btn-text');
  const modalTitle = document.getElementById('modal-title');

  const tasktitle = document.getElementById('task-title') as HTMLInputElement | null;
  const taskpriority = document.getElementById('task-priority') as HTMLSelectElement | HTMLInputElement | null;
  const taskdate = document.getElementById('task-due-date') as HTMLInputElement | null;
  const taskdescription = document.getElementById('task-description') as HTMLTextAreaElement | HTMLInputElement | null;
  
  const dateError = document.getElementById('date-error');
  const titleError = document.getElementById('title-error');

  const columnsContainer = document.getElementById('columns-container');
  const tasksTodoContainer = document.getElementById('tasks-todo');
  const tasksInProgressContainer = document.getElementById('tasks-in-progress');
  const tasksCompletedContainer = document.getElementById('tasks-completed');

  const todoCountElement = document.getElementById('todo-count');
  const inProgressCountElement = document.getElementById('in-progress-count');
  const completedCountElement = document.getElementById('completed-count');

  const STORAGE_KEY = 'kanban_tasks_data';

  function showToast(message: string) {
    const existingToast = document.getElementById('custom-toast-alert');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.id = 'custom-toast-alert';
    toast.className =
      'fixed top-4 right-4 z-50 bg-emerald-500 text-white font-medium text-sm px-5 py-3 rounded-lg shadow-lg transition-all duration-300 transform translate-y-0 opacity-100 flex items-center gap-2 pointer-events-none';
    toast.innerHTML = `<span>${message}</span>`;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('opacity-0', '-translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  function getLocalDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const todayStr = getLocalDateString();
  if (taskdate) {
    taskdate.min = todayStr;
  }

  interface Task {
    id: string;
    title: string;
    priority: string;
    date: string;
    description: string;
    status: 'todo' | 'in-progress' | 'completed';
    createdAt: number;
  }

  let productlist: Task[] = [];
  let editingTaskId: string | null = null;

  function saveToLocalStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(productlist));
  }

  function loadFromLocalStorage() {
    const storedTasks = localStorage.getItem(STORAGE_KEY);
    if (storedTasks) {
      try {
        productlist = JSON.parse(storedTasks);
      } catch (error) {
        console.error('Error parsing tasks from LocalStorage:', error);
        productlist = [];
      }
    }
  }

  btn1?.addEventListener('click', () => {
    resetForm();
    modaloverlay?.classList.remove('hidden');
  });

  const closeModal = () => {
    modaloverlay?.classList.add('hidden');
    resetForm();
  };

  closemodalbtn?.addEventListener('click', closeModal);
  cancelbtn?.addEventListener('click', closeModal);

  // إغلاق الفورم عند النقر في أي مكان خارج محتوى الفورم
  modaloverlay?.addEventListener('click', (e) => {
    if (e.target === modaloverlay) {
      closeModal();
    }
  });

  function resetForm() {
    editingTaskId = null;
    if (tasktitle) tasktitle.value = '';
    if (taskdescription) taskdescription.value = '';
    if (taskdate) taskdate.value = '';
    if (taskpriority) taskpriority.value = 'medium';
    if (submitBtnText) submitBtnText.textContent = 'Add Task';
    if (modalTitle) modalTitle.textContent = 'Create New Task';
    
    dateError?.classList.add('hidden');
    titleError?.classList.add('hidden');
  }

  function getTimeAgo(createdAt: number): string {
    const diffInSeconds = Math.floor((Date.now() - createdAt) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  }

  function formatDueDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function getDueDateBadge(dateStr: string): string {
    if (!dateStr) return '';
    
    const currentToday = getLocalDateString();

    if (dateStr <= currentToday) {
      return `
        <span class="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide flex items-center gap-1">
          <i class="fa-solid fa-triangle-exclamation"></i> OVERDUE
        </span>`;
    } else {
      return `
        <span class="bg-amber-100 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide flex items-center gap-1">
          DUE SOON
        </span>`;
    }
  }

  function getPriorityBadge(priority: string): string {
    const p = priority.toLowerCase();
    switch (p) {
      case 'high':
        return `
          <span class="bg-red-100 text-red-600 text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-wide">
            <span class="w-2 h-2 rounded-full bg-red-500"></span>
            HIGH PRIORITY
          </span>`;
      case 'medium':
        return `
          <span class="bg-amber-100 text-amber-600 text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-wide">
            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
            MEDIUM
          </span>`;
      case 'low':
      default:
        return `
          <span class="bg-slate-100 text-slate-600 text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-wide">
            <span class="w-2 h-2 rounded-full bg-slate-400"></span>
            LOW
          </span>`;
    }
  }

  function getPriorityTextColor(priority: string): string {
    const p = priority.toLowerCase();
    switch (p) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-amber-600';
      case 'low':
      default:
        return 'text-slate-500';
    }
  }

  function createCardHTML(task: Task, index: number): string {
    const formattedDate = formatDueDate(task.date);
    const dateBadge = getDueDateBadge(task.date);
    const timeAgo = getTimeAgo(task.createdAt);
    const priorityBadge = getPriorityBadge(task.priority);
    const dateTextColor = getPriorityTextColor(task.priority);

    return `
      <div class="group bg-white rounded-2xl p-4 shadow-xs border border-slate-100 hover:shadow-md transition-all duration-200">
        
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-slate-300"></span>
            <span class="text-xs font-semibold text-slate-400">#00${index + 1}</span>
          </div>
          <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button class="edit-btn text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 w-7 h-7 rounded-lg flex items-center justify-center transition-colors" data-task-id="${task.id}" title="Edit task">
              <i class="fa-solid fa-pen text-xs pointer-events-none"></i>
            </button>
            <button class="delete-btn text-slate-400 hover:text-red-500 hover:bg-red-50 w-7 h-7 rounded-lg flex items-center justify-center transition-colors" data-task-id="${task.id}" title="Delete task">
              <i class="fa-solid fa-trash-can text-xs pointer-events-none"></i>
            </button>
          </div>
        </div>

        <h3 class="font-bold text-slate-800 text-base mb-1">${task.title}</h3>
        <p class="text-slate-400 text-sm mb-3 line-clamp-2">${task.description}</p>

        <div class="flex flex-wrap items-center gap-2 mb-3">
          ${priorityBadge}
          ${dateBadge}
        </div>

        <div class="flex items-center gap-3 text-xs font-medium mb-4">
          <div class="flex items-center gap-1.5 ${dateTextColor}">
            <i class="fa-regular fa-calendar"></i>
            <span>${formattedDate}</span>
          </div>
          <div class="flex items-center gap-1.5 text-slate-400">
            <i class="fa-regular fa-clock"></i>
            <span>${timeAgo}</span>
          </div>
        </div>
        
        <div class="flex flex-wrap gap-2">
          ${
            task.status !== 'todo'
              ? `<button class="status-btn text-xs px-3 py-1.5 rounded-lg font-bold transition-all duration-200 flex items-center gap-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200" data-task-id="${task.id}" data-status="todo">
                  <i class="fa-solid fa-rotate-left pointer-events-none"></i> <span class="pointer-events-none">To Do</span>
                 </button>`
              : ''
          }
          ${
            task.status !== 'in-progress'
              ? `<button class="status-btn text-xs px-3 py-1.5 rounded-lg font-bold transition-all duration-200 flex items-center gap-1.5 bg-amber-100/70 text-amber-700 hover:bg-amber-200" data-task-id="${task.id}" data-status="in-progress">
                  <i class="fa-solid fa-play text-xs pointer-events-none"></i> <span class="pointer-events-none">Start</span>
                 </button>`
              : ''
          }
          ${
            task.status !== 'completed'
              ? `<button class="status-btn text-xs px-3 py-1.5 rounded-lg font-bold transition-all duration-200 flex items-center gap-1.5 bg-emerald-100/70 text-emerald-700 hover:bg-emerald-200" data-task-id="${task.id}" data-status="completed">
                  <i class="fa-solid fa-check text-xs pointer-events-none"></i> <span class="pointer-events-none">Complete</span>
                 </button>`
              : ''
          }
        </div>
      </div>
    `;
  }

  function display() {
    let todoHTML = '';
    let inProgressHTML = '';
    let completedHTML = '';

    let todoCount = 0;
    let inProgressCount = 0;
    let completedCount = 0;

    productlist.forEach((task, i) => {
      const cardHTML = createCardHTML(task, i);
      if (task.status === 'todo') {
        todoHTML += cardHTML;
        todoCount++;
      } else if (task.status === 'in-progress') {
        inProgressHTML += cardHTML;
        inProgressCount++;
      } else if (task.status === 'completed') {
        completedHTML += cardHTML;
        completedCount++;
      }
    });

    const emptyState = `
      <div class="flex flex-col items-center justify-center py-12 text-slate-400">
        <i class="fa-regular fa-folder-open text-4xl mb-3 opacity-50"></i>
        <p class="text-sm">No tasks yet</p>
      </div>`;

    if (tasksTodoContainer) tasksTodoContainer.innerHTML = todoHTML || emptyState;
    if (tasksInProgressContainer) tasksInProgressContainer.innerHTML = inProgressHTML || emptyState;
    if (tasksCompletedContainer) tasksCompletedContainer.innerHTML = completedHTML || emptyState;

    if (todoCountElement) todoCountElement.textContent = `${todoCount} task${todoCount !== 1 ? 's' : ''}`;
    if (inProgressCountElement) inProgressCountElement.textContent = `${inProgressCount} task${inProgressCount !== 1 ? 's' : ''}`;
    if (completedCountElement) completedCountElement.textContent = `${completedCount} task${completedCount !== 1 ? 's' : ''}`;
  }

  function saveTask() {
    if (!tasktitle || !taskpriority || !taskdate || !taskdescription) return;

    let hasError = false;

    if (tasktitle.value.trim().length < 3) {
      titleError?.classList.remove('hidden');
      hasError = true;
    } else {
      titleError?.classList.add('hidden');
    }

    const currentToday = getLocalDateString();
    if (taskdate.value < currentToday) {
      dateError?.classList.remove('hidden');
      hasError = true;
    } else {
      dateError?.classList.add('hidden');
    }

    if (hasError) return;

    if (editingTaskId) {
      const taskIndex = productlist.findIndex((t) => t.id === editingTaskId);
      if (taskIndex !== -1) {
        productlist[taskIndex].title = tasktitle.value;
        productlist[taskIndex].priority = taskpriority.value;
        productlist[taskIndex].date = taskdate.value;
        productlist[taskIndex].description = taskdescription.value;

        showToast('Task updated successfully!');
      }
    } else {
      const newTask: Task = {
        id: Date.now().toString(),
        title: tasktitle.value,
        priority: taskpriority.value,
        date: taskdate.value,
        description: taskdescription.value,
        status: 'todo',
        createdAt: Date.now()
      };
      productlist.push(newTask);

      showToast('Task added successfully!');
    }

    saveToLocalStorage();
    display();
    closeModal();
  }

  tasktitle?.addEventListener('input', () => {
    if (tasktitle.value.trim().length >= 3) {
      titleError?.classList.add('hidden');
    }
  });

  columnsContainer?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    const statusBtn = target.closest('.status-btn') as HTMLButtonElement | null;
    if (statusBtn) {
      const taskId = statusBtn.getAttribute('data-task-id');
      const newStatus = statusBtn.getAttribute('data-status') as Task['status'];
      const task = productlist.find((t) => t.id === taskId);

      if (task && newStatus) {
        task.status = newStatus;
        saveToLocalStorage();
        display();
        showToast('Task status updated!');
      }
      return;
    }

    const deleteBtn = target.closest('.delete-btn') as HTMLButtonElement | null;
    if (deleteBtn) {
      const taskId = deleteBtn.getAttribute('data-task-id');
      productlist = productlist.filter((t) => t.id !== taskId);
      saveToLocalStorage();
      display();
      showToast('Task deleted successfully!');
      return;
    }

    const editBtn = target.closest('.edit-btn') as HTMLButtonElement | null;
    if (editBtn) {
      const taskId = editBtn.getAttribute('data-task-id');
      const task = productlist.find((t) => t.id === taskId);

      if (task && tasktitle && taskpriority && taskdate && taskdescription) {
        editingTaskId = task.id;
        tasktitle.value = task.title;
        taskpriority.value = task.priority;
        taskdate.value = task.date;
        taskdescription.value = task.description;

        if (submitBtnText) submitBtnText.textContent = 'Update Task';
        if (modalTitle) modalTitle.textContent = 'Edit Task';

        modaloverlay?.classList.remove('hidden');
      }
    }
  });

  submitbtn?.addEventListener('click', function (e) {
    e.preventDefault();
    saveTask();
  });

  loadFromLocalStorage();
  display();
})();