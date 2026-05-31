/**
 * 📋 Kanban Module
 * Gerencia o quadro Kanban com drag and drop
 */

const Kanban = {
    currentFilter: null, // Filtro por criança

    /**
     * Inicializa o quadro Kanban
     */
    init() {
        this.setupDragAndDrop();
        this.render();
    },

    /**
     * Configura drag and drop nas colunas
     */
    setupDragAndDrop() {
        const columns = document.querySelectorAll('.column-tasks');
        
        columns.forEach(column => {
            column.addEventListener('dragover', (e) => {
                e.preventDefault();
                column.closest('.kanban-column').classList.add('drag-over');
            });

            column.addEventListener('dragleave', (e) => {
                column.closest('.kanban-column').classList.remove('drag-over');
            });

            column.addEventListener('drop', (e) => {
                e.preventDefault();
                column.closest('.kanban-column').classList.remove('drag-over');
                
                const taskId = e.dataTransfer.getData('text/plain');
                const newStatus = column.closest('.kanban-column').dataset.status;
                
                this.moveTask(taskId, newStatus);
            });
        });
    },

    /**
     * Move uma tarefa para novo status
     */
    moveTask(taskId, newStatus) {
        const tasks = Storage.getTasks();
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        
        if (taskIndex === -1) return;
        
        const task = tasks[taskIndex];
        const oldStatus = task.status;
        
        // Não permite mover de "validated" para outro status
        if (oldStatus === 'validated') return;
        
        // Não permite mover diretamente para "validated" (precisa do botão)
        if (newStatus === 'validated') return;
        
        task.status = newStatus;
        tasks[taskIndex] = task;
        Storage.saveTasks(tasks);
        
        // Registra no histórico
        Storage.addHistoryEntry({
            type: 'moved',
            taskId: task.id,
            childId: task.childId,
            from: oldStatus,
            to: newStatus
        });
        
        // Som de movimento
        App.playSound('move');
        
        this.render();
    },

    /**
     * Valida uma tarefa (pais)
     */
    validateTask(taskId) {
        const tasks = Storage.getTasks();
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        
        if (taskIndex === -1) return;
        
        const task = tasks[taskIndex];
        task.status = 'validated';
        task.validatedAt = new Date().toISOString();
        tasks[taskIndex] = task;
        Storage.saveTasks(tasks);
        
        // Adiciona pontos à criança
        const children = Storage.getChildren();
        const childIndex = children.findIndex(c => c.id === task.childId);
        
        if (childIndex !== -1) {
            const child = children[childIndex];
            child.totalPoints = (child.totalPoints || 0) + task.points;
            child.weeklyPoints = (child.weeklyPoints || 0) + task.points;
            child.tasksCompleted = (child.tasksCompleted || 0) + 1;
            
            // Atualiza contagem por categoria
            if (!child.categoryCount) child.categoryCount = {};
            child.categoryCount[task.category] = (child.categoryCount[task.category] || 0) + 1;
            
            // Atualiza streak
            Achievements.updateStreak(child);
            
            // Verifica nível anterior
            const oldLevel = Achievements.getLevel(child.totalPoints - task.points);
            const newLevel = Achievements.getLevel(child.totalPoints);
            
            // Verifica medalhas
            const { earned, newMedals } = Achievements.checkMedals(child);
            child.medals = earned;
            
            children[childIndex] = child;
            Storage.saveChildren(children);
            
            // Registra no histórico
            Storage.addHistoryEntry({
                type: 'validated',
                taskId: task.id,
                childId: task.childId,
                points: task.points,
                category: task.category
            });
            
            // Efeitos visuais
            if (newLevel.level > oldLevel.level) {
                App.showConfetti();
                App.showToast(`🎉 ${child.name} subiu para Nível ${newLevel.level} - ${newLevel.name}!`);
                App.playSound('levelup');
            } else if (newMedals.length > 0) {
                App.showConfetti();
                newMedals.forEach(medal => {
                    App.showToast(`${medal.icon} ${child.name} ganhou: ${medal.name}!`);
                });
                App.playSound('medal');
            } else {
                App.showToast(`✅ +${task.points} pontos para ${child.name}!`);
                App.playSound('validate');
            }
            
            // Atualiza a barra de crianças
            App.renderChildren();
        }
        
        this.render();
    },

    /**
     * Adiciona uma nova tarefa
     */
    addTask(taskData) {
        const tasks = Storage.getTasks();
        const task = {
            id: 'task_' + Date.now(),
            ...taskData,
            status: 'todo',
            createdAt: new Date().toISOString()
        };
        tasks.push(task);
        Storage.saveTasks(tasks);
        App.playSound('add');
        this.render();
    },

    /**
     * Edita uma tarefa existente
     */
    editTask(taskId, taskData) {
        const tasks = Storage.getTasks();
        const index = tasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
            tasks[index] = { ...tasks[index], ...taskData };
            Storage.saveTasks(tasks);
            this.render();
        }
    },

    /**
     * Remove uma tarefa
     */
    deleteTask(taskId) {
        if (!confirm('Remover esta tarefa?')) return;
        const tasks = Storage.getTasks().filter(t => t.id !== taskId);
        Storage.saveTasks(tasks);
        App.playSound('delete');
        this.render();
    },

    /**
     * Renderiza o quadro Kanban
     */
    render() {
        const tasks = Storage.getTasks();
        const children = Storage.getChildren();
        const statuses = ['todo', 'doing', 'done', 'validated'];
        
        const categoryIcons = {
            'casa': '🏠',
            'estudos': '📚',
            'higiene': '🦷',
            'exercicios': '🏃',
            'boas-acoes': '❤️'
        };

        statuses.forEach(status => {
            const column = document.getElementById(`col-${status}`);
            const count = document.getElementById(`count-${status}`);
            
            let filteredTasks = tasks.filter(t => t.status === status);
            
            // Aplica filtro por criança
            if (this.currentFilter) {
                filteredTasks = filteredTasks.filter(t => t.childId === this.currentFilter);
            }
            
            count.textContent = filteredTasks.length;
            
            column.innerHTML = filteredTasks.map(task => {
                const child = children.find(c => c.id === task.childId);
                const childEmoji = child ? child.emoji : '👤';
                const childColor = child ? child.color : '#6c5ce7';
                const catIcon = categoryIcons[task.category] || '📋';
                
                let actionsHtml = '';
                if (status === 'done') {
                    actionsHtml = `
                        <button class="validate-btn" onclick="Kanban.validateTask('${task.id}')" title="Validar tarefa">
                            ✓ Validar
                        </button>
                    `;
                } else if (status !== 'validated') {
                    actionsHtml = `
                        <button onclick="App.openEditTask('${task.id}')" title="Editar">✏️</button>
                        <button onclick="Kanban.deleteTask('${task.id}')" title="Remover">🗑️</button>
                    `;
                }
                
                return `
                    <div class="task-card" draggable="${status !== 'validated'}" 
                         data-task-id="${task.id}"
                         style="border-left-color: ${childColor}"
                         ondragstart="event.dataTransfer.setData('text/plain', '${task.id}'); this.classList.add('dragging')"
                         ondragend="this.classList.remove('dragging')">
                        <span class="task-category">${catIcon} ${task.category}</span>
                        <div class="task-title">${task.title}</div>
                        ${task.description ? `<div class="task-desc">${task.description}</div>` : ''}
                        <div class="task-footer">
                            <span class="task-points">⭐ ${task.points} pts</span>
                            <span class="task-child-badge" title="${child ? child.name : ''}">${childEmoji}</span>
                            <div class="task-actions">${actionsHtml}</div>
                        </div>
                    </div>
                `;
            }).join('');
        });
    },

    /**
     * Filtra tarefas por criança
     */
    filterByChild(childId) {
        this.currentFilter = childId;
        this.render();
    },

    /**
     * Remove filtro
     */
    clearFilter() {
        this.currentFilter = null;
        this.render();
    }
};
