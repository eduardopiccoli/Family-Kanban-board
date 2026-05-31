/**
 * 🎮 App Module - Controlador Principal
 * Gerencia navegação, modais, confetes e integração
 */

const App = {
    selectedChild: null,
    charts: {},

    /**
     * Inicializa a aplicação
     */
    init() {
        // Carrega configurações
        const settings = Storage.getSettings();
        if (settings.theme === 'dark') {
            document.body.setAttribute('data-theme', 'dark');
            document.getElementById('theme-toggle').textContent = '☀️';
        }
        this.soundEnabled = settings.sound !== false;
        document.getElementById('sound-toggle').textContent = this.soundEnabled ? '🔊' : '🔇';

        // Setup navegação
        this.setupNavigation();
        this.setupModals();
        this.setupForms();
        this.setupSettings();

        // Inicializa módulos
        Kanban.init();
        Rewards.init();
        this.renderChildren();

        // PWA
        this.setupPWA();
    },

    // === Navegação ===
    setupNavigation() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                this.switchView(view);
                
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    },

    switchView(viewName) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(`view-${viewName}`).classList.add('active');
        
        // Atualiza dashboard quando abre
        if (viewName === 'dashboard') {
            this.renderDashboard();
        }
        if (viewName === 'shop') {
            Rewards.render();
        }
    },

    // === Modais ===
    setupModals() {
        // Fechar modais
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                const modalId = btn.dataset.close;
                this.closeModal(modalId);
            });
        });

        // Fechar ao clicar fora
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.classList.remove('active');
                }
            });
        });

        // Botões de abrir
        document.getElementById('add-child-btn').addEventListener('click', () => {
            document.getElementById('form-child').reset();
            document.getElementById('child-id').value = '';
            document.getElementById('child-emoji').value = '👧';
            document.querySelectorAll('.emoji-opt').forEach(e => e.classList.remove('selected'));
            document.querySelector('.emoji-opt[data-emoji="👧"]').classList.add('selected');
            this.openModal('modal-child');
        });

        document.getElementById('add-task-btn').addEventListener('click', () => {
            document.getElementById('form-task').reset();
            document.getElementById('task-id').value = '';
            document.getElementById('task-points').value = '10';
            document.getElementById('task-status-group').style.display = 'none';
            this.populateChildSelect();
            this.openModal('modal-task');
        });

        // Encerrar sprint semanal
        document.getElementById('end-sprint-btn').addEventListener('click', () => {
            Kanban.endSprint();
        });

        document.getElementById('add-reward-btn').addEventListener('click', () => {
            document.getElementById('form-reward').reset();
            document.getElementById('reward-id').value = '';
            document.getElementById('reward-emoji').value = '🎁';
            this.openModal('modal-reward');
        });

        // Emoji picker
        document.querySelectorAll('.emoji-opt').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.emoji-opt').forEach(e => e.classList.remove('selected'));
                btn.classList.add('selected');
                document.getElementById('child-emoji').value = btn.dataset.emoji;
            });
        });
    },

    openModal(id) {
        document.getElementById(id).classList.add('active');
    },

    closeModal(id) {
        document.getElementById(id).classList.remove('active');
    },

    // === Formulários ===
    setupForms() {
        // Form Criança
        document.getElementById('form-child').addEventListener('submit', (e) => {
            e.preventDefault();
            const childId = document.getElementById('child-id').value;
            const name = document.getElementById('child-name').value.trim();
            const emoji = document.getElementById('child-emoji').value;
            const color = document.getElementById('child-color').value;

            if (!name) return;

            const children = Storage.getChildren();

            if (childId) {
                // Editar criança existente
                const index = children.findIndex(c => c.id === childId);
                if (index !== -1) {
                    children[index].name = name;
                    children[index].emoji = emoji;
                    children[index].color = color;
                    Storage.saveChildren(children);
                    this.showToast(`${emoji} ${name} foi atualizado(a)!`);
                }
            } else {
                // Nova criança
                children.push({
                    id: 'child_' + Date.now(),
                    name,
                    emoji,
                    color,
                    totalPoints: 0,
                    weeklyPoints: 0,
                    tasksCompleted: 0,
                    streak: 0,
                    medals: [],
                    categoryCount: {},
                    lastActivityDate: null
                });
                Storage.saveChildren(children);
                this.showToast(`${emoji} ${name} foi adicionado(a)!`);
            }

            this.closeModal('modal-child');
            this.renderChildren();
            Kanban.render();
            this.playSound('add');
        });

        // Form Tarefa
        document.getElementById('form-task').addEventListener('submit', (e) => {
            e.preventDefault();
            const taskId = document.getElementById('task-id').value;
            const taskData = {
                title: document.getElementById('task-title').value.trim(),
                description: document.getElementById('task-desc').value.trim(),
                childId: document.getElementById('task-child').value,
                points: parseInt(document.getElementById('task-points').value),
                category: document.getElementById('task-category').value
            };

            if (!taskData.title || !taskData.childId) return;

            if (taskId) {
                // Ao editar, inclui o status selecionado
                const newStatus = document.getElementById('task-status').value;
                taskData.status = newStatus;
                Kanban.editTask(taskId, taskData);
            } else {
                Kanban.addTask(taskData);
            }

            this.closeModal('modal-task');
        });

        // Form Recompensa
        document.getElementById('form-reward').addEventListener('submit', (e) => {
            e.preventDefault();
            const rewardId = document.getElementById('reward-id').value;
            const rewardData = {
                name: document.getElementById('reward-name').value.trim(),
                cost: parseInt(document.getElementById('reward-cost').value),
                emoji: document.getElementById('reward-emoji').value || '🎁'
            };

            if (!rewardData.name) return;

            if (rewardId) {
                Rewards.editReward(rewardId, rewardData);
            } else {
                Rewards.addReward(rewardData);
            }

            this.closeModal('modal-reward');
        });
    },

    // === Crianças ===
    renderChildren() {
        const children = Storage.getChildren();
        const list = document.getElementById('children-list');

        list.innerHTML = children.map(child => {
            const level = Achievements.getLevel(child.totalPoints || 0);
            const isActive = this.selectedChild === child.id;
            
            return `
                <div class="child-chip ${isActive ? 'active' : ''}" 
                     style="color: ${child.color}">
                    <span class="chip-emoji" onclick="App.selectChild('${child.id}')">${child.emoji}</span>
                    <span onclick="App.selectChild('${child.id}')">${child.name}</span>
                    <span class="chip-points" title="Pontos totais">⭐ ${child.totalPoints || 0}</span>
                    <span class="chip-weekly" title="Pontos esta semana">📅 ${child.weeklyPoints || 0}</span>
                    <span class="chip-level">Nv.${level.level}</span>
                    <span class="chip-actions">
                        <button class="chip-action-btn" onclick="event.stopPropagation(); App.openEditChild('${child.id}')" title="Editar">✏️</button>
                        <button class="chip-action-btn" onclick="event.stopPropagation(); App.deleteChild('${child.id}')" title="Remover">🗑️</button>
                    </span>
                </div>
            `;
        }).join('');

        // Atualiza select de tarefas
        this.populateChildSelect();
    },

    selectChild(childId) {
        if (this.selectedChild === childId) {
            this.selectedChild = null;
            Kanban.clearFilter();
        } else {
            this.selectedChild = childId;
            Kanban.filterByChild(childId);
        }
        this.renderChildren();
        Rewards.render();
    },

    populateChildSelect() {
        const children = Storage.getChildren();
        const select = document.getElementById('task-child');
        if (!select) return;
        
        select.innerHTML = '<option value="">Selecione...</option>' +
            children.map(c => `<option value="${c.id}">${c.emoji} ${c.name}</option>`).join('');
    },

    // === Edição de Crianças ===
    openEditChild(childId) {
        const children = Storage.getChildren();
        const child = children.find(c => c.id === childId);
        if (!child) return;

        document.getElementById('child-id').value = child.id;
        document.getElementById('child-name').value = child.name;
        document.getElementById('child-emoji').value = child.emoji;
        document.getElementById('child-color').value = child.color;

        // Marca o emoji correto
        document.querySelectorAll('.emoji-opt').forEach(e => e.classList.remove('selected'));
        const emojiBtn = document.querySelector(`.emoji-opt[data-emoji="${child.emoji}"]`);
        if (emojiBtn) emojiBtn.classList.add('selected');

        this.openModal('modal-child');
    },

    deleteChild(childId) {
        const children = Storage.getChildren();
        const child = children.find(c => c.id === childId);
        if (!child) return;

        if (!confirm(`Remover ${child.emoji} ${child.name}? As tarefas desta criança também serão removidas.`)) return;

        // Remove criança
        const updatedChildren = children.filter(c => c.id !== childId);
        Storage.saveChildren(updatedChildren);

        // Remove tarefas da criança
        const tasks = Storage.getTasks().filter(t => t.childId !== childId);
        Storage.saveTasks(tasks);

        // Limpa seleção se era a criança selecionada
        if (this.selectedChild === childId) {
            this.selectedChild = null;
            Kanban.clearFilter();
        }

        this.renderChildren();
        Kanban.render();
        this.playSound('delete');
        this.showToast(`${child.emoji} ${child.name} foi removido(a).`);
    },

    // === Edição ===
    openEditTask(taskId) {
        const tasks = Storage.getTasks();
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        document.getElementById('task-id').value = task.id;
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-desc').value = task.description || '';
        document.getElementById('task-points').value = task.points;
        document.getElementById('task-category').value = task.category;
        
        // Mostra seletor de status ao editar
        const statusGroup = document.getElementById('task-status-group');
        statusGroup.style.display = 'block';
        document.getElementById('task-status').value = task.status;

        this.populateChildSelect();
        document.getElementById('task-child').value = task.childId;
        
        this.openModal('modal-task');
    },

    openEditReward(rewardId) {
        const rewards = Storage.getRewards();
        const reward = rewards.find(r => r.id === rewardId);
        if (!reward) return;

        document.getElementById('reward-id').value = reward.id;
        document.getElementById('reward-name').value = reward.name;
        document.getElementById('reward-cost').value = reward.cost;
        document.getElementById('reward-emoji').value = reward.emoji;
        
        this.openModal('modal-reward');
    },

    // === Dashboard ===
    renderDashboard() {
        this.renderRanking();
        this.renderMedals();
        this.renderCharts();
    },

    renderRanking() {
        const children = Storage.getChildren();
        const sorted = [...children].sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
        const list = document.getElementById('ranking-list');

        const positionEmojis = ['🥇', '🥈', '🥉'];

        list.innerHTML = sorted.map((child, i) => {
            const level = Achievements.getLevel(child.totalPoints || 0);
            const progress = Achievements.getLevelProgress(child.totalPoints || 0);
            
            return `
                <div class="ranking-item" style="border-left: 4px solid ${child.color}">
                    <span class="ranking-position">${positionEmojis[i] || (i + 1)}</span>
                    <div class="ranking-info">
                        <div class="ranking-name">${child.emoji} ${child.name}</div>
                        <div class="ranking-details">
                            Nível ${level.level} - ${level.name} | 
                            ${child.tasksCompleted || 0} tarefas | 
                            🔥 ${child.streak || 0} dias
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                    </div>
                    <span class="ranking-points">⭐ ${child.totalPoints || 0}</span>
                </div>
            `;
        }).join('');

        if (sorted.length === 0) {
            list.innerHTML = '<p style="color:var(--text-secondary)">Adicione crianças para ver o ranking.</p>';
        }
    },

    renderMedals() {
        const children = Storage.getChildren();
        const list = document.getElementById('medals-list');
        
        // Mostra medalhas da criança selecionada ou de todas
        const targetChild = this.selectedChild 
            ? children.find(c => c.id === this.selectedChild) 
            : null;

        let html = '';
        
        if (targetChild) {
            html = `<h4 style="margin-bottom:12px">${targetChild.emoji} ${targetChild.name}</h4>`;
            html += '<div class="medals-grid">';
            html += Achievements.MEDALS.map(medal => {
                const earned = targetChild.medals && targetChild.medals.includes(medal.id);
                return `
                    <div class="medal-item ${earned ? 'earned' : 'locked'}" title="${medal.description}">
                        <span class="medal-icon">${medal.icon}</span>
                        <span class="medal-name">${medal.name}</span>
                    </div>
                `;
            }).join('');
            html += '</div>';
        } else {
            html = '<p style="color:var(--text-secondary);font-size:0.9rem;">Selecione uma criança para ver medalhas.</p>';
            html += '<div class="medals-grid">';
            html += Achievements.MEDALS.map(medal => `
                <div class="medal-item locked" title="${medal.description}">
                    <span class="medal-icon">${medal.icon}</span>
                    <span class="medal-name">${medal.name}</span>
                </div>
            `).join('');
            html += '</div>';
        }

        list.innerHTML = html;
    },

    renderCharts() {
        const history = Storage.getHistory();
        const children = Storage.getChildren();

        // Destrói charts anteriores
        Object.values(this.charts).forEach(chart => chart.destroy());
        this.charts = {};

        // Dados das últimas 4 semanas
        const weeks = this.getLastWeeks(4);

        // Chart: Tarefas por semana
        const tasksCtx = document.getElementById('chart-tasks');
        if (tasksCtx) {
            const tasksData = weeks.map(week => {
                return history.filter(h => 
                    h.type === 'validated' && 
                    new Date(h.date) >= week.start && 
                    new Date(h.date) <= week.end
                ).length;
            });

            this.charts.tasks = new Chart(tasksCtx, {
                type: 'bar',
                data: {
                    labels: weeks.map(w => w.label),
                    datasets: [{
                        label: 'Tarefas Validadas',
                        data: tasksData,
                        backgroundColor: 'rgba(108, 92, 231, 0.6)',
                        borderColor: '#6c5ce7',
                        borderWidth: 2,
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                }
            });
        }

        // Chart: Pontos por semana
        const pointsCtx = document.getElementById('chart-points');
        if (pointsCtx) {
            const pointsData = weeks.map(week => {
                return history.filter(h => 
                    h.type === 'validated' && 
                    new Date(h.date) >= week.start && 
                    new Date(h.date) <= week.end
                ).reduce((sum, h) => sum + (h.points || 0), 0);
            });

            this.charts.points = new Chart(pointsCtx, {
                type: 'line',
                data: {
                    labels: weeks.map(w => w.label),
                    datasets: [{
                        label: 'Pontos Ganhos',
                        data: pointsData,
                        borderColor: '#00cec9',
                        backgroundColor: 'rgba(0, 206, 201, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3,
                        pointRadius: 6,
                        pointBackgroundColor: '#00cec9'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } }
                }
            });
        }

        // Chart: Categorias
        const catCtx = document.getElementById('chart-categories');
        if (catCtx) {
            const categories = { casa: 0, estudos: 0, higiene: 0, exercicios: 0, 'boas-acoes': 0 };
            history.filter(h => h.type === 'validated').forEach(h => {
                if (h.category && categories.hasOwnProperty(h.category)) {
                    categories[h.category]++;
                }
            });

            const catLabels = {
                casa: '🏠 Casa',
                estudos: '📚 Estudos',
                higiene: '🦷 Higiene',
                exercicios: '🏃 Exercícios',
                'boas-acoes': '❤️ Boas ações'
            };

            this.charts.categories = new Chart(catCtx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(categories).map(k => catLabels[k]),
                    datasets: [{
                        data: Object.values(categories),
                        backgroundColor: [
                            '#6c5ce7', '#00cec9', '#fdcb6e', '#e17055', '#00b894'
                        ],
                        borderWidth: 3,
                        borderColor: 'var(--bg-card)'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });
        }
    },

    getLastWeeks(count) {
        const weeks = [];
        const now = new Date();
        
        for (let i = count - 1; i >= 0; i--) {
            const end = new Date(now);
            end.setDate(end.getDate() - (i * 7));
            end.setHours(23, 59, 59, 999);
            
            const start = new Date(end);
            start.setDate(start.getDate() - 6);
            start.setHours(0, 0, 0, 0);
            
            weeks.push({
                start,
                end,
                label: `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}`
            });
        }
        
        return weeks;
    },

    // === Configurações ===
    setupSettings() {
        // Tema
        document.getElementById('theme-toggle').addEventListener('click', () => {
            const isDark = document.body.getAttribute('data-theme') === 'dark';
            if (isDark) {
                document.body.removeAttribute('data-theme');
                document.getElementById('theme-toggle').textContent = '🌙';
            } else {
                document.body.setAttribute('data-theme', 'dark');
                document.getElementById('theme-toggle').textContent = '☀️';
            }
            const settings = Storage.getSettings();
            settings.theme = isDark ? 'light' : 'dark';
            Storage.saveSettings(settings);
        });

        // Som
        document.getElementById('sound-toggle').addEventListener('click', () => {
            this.soundEnabled = !this.soundEnabled;
            document.getElementById('sound-toggle').textContent = this.soundEnabled ? '🔊' : '🔇';
            const settings = Storage.getSettings();
            settings.sound = this.soundEnabled;
            Storage.saveSettings(settings);
        });

        // Export
        document.getElementById('export-btn').addEventListener('click', () => {
            const data = Storage.exportAll();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `kanban-kids-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            this.showToast('📤 Backup exportado com sucesso!');
        });

        // Import
        document.getElementById('import-btn').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });

        document.getElementById('import-file').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const success = Storage.importAll(event.target.result);
                if (success) {
                    this.showToast('📥 Backup importado com sucesso!');
                    this.renderChildren();
                    Kanban.render();
                    Rewards.render();
                } else {
                    this.showToast('❌ Erro ao importar backup', 'error');
                }
            };
            reader.readAsText(file);
            e.target.value = '';
        });

        // Reset
        document.getElementById('reset-btn').addEventListener('click', () => {
            if (confirm('⚠️ Tem certeza? Todos os dados serão apagados!')) {
                if (confirm('🚨 Esta ação é irreversível. Confirmar?')) {
                    Storage.resetAll();
                    this.selectedChild = null;
                    this.renderChildren();
                    Kanban.render();
                    Rewards.init();
                    this.showToast('🗑️ Dados resetados!');
                }
            }
        });

        // === Google Sheets Import ===
        document.getElementById('import-sheets-btn').addEventListener('click', () => {
            const type = document.getElementById('import-sheets-type').value;
            const rawData = document.getElementById('import-sheets-data').value.trim();

            if (!rawData) {
                this.showToast('❌ Cole os dados da planilha primeiro.', 'error');
                return;
            }

            const result = this.importFromSheets(type, rawData);
            if (result.success) {
                this.showToast(`✅ ${result.count} ${type === 'children' ? 'crianças' : type === 'tasks' ? 'tarefas' : 'recompensas'} importadas!`);
                document.getElementById('import-sheets-data').value = '';
                this.renderChildren();
                Kanban.render();
                Rewards.render();
            } else {
                this.showToast(`❌ Erro: ${result.error}`, 'error');
            }
        });

        // Download template CSV
        document.getElementById('download-template-btn').addEventListener('click', () => {
            const type = document.getElementById('import-sheets-type').value;
            const csv = this.getSheetTemplate(type);
            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `kanban-kids-template-${type}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            this.showToast('📥 Template baixado!');
        });

        // Mostrar/ocultar formato esperado
        document.getElementById('open-template-link').addEventListener('click', (e) => {
            e.preventDefault();
            const info = document.getElementById('sheets-template-info');
            if (info.style.display === 'none') {
                const type = document.getElementById('import-sheets-type').value;
                info.innerHTML = this.getTemplateInfoHtml(type);
                info.style.display = 'block';
            } else {
                info.style.display = 'none';
            }
        });

        // Atualiza info ao mudar tipo
        document.getElementById('import-sheets-type').addEventListener('change', () => {
            const info = document.getElementById('sheets-template-info');
            if (info.style.display !== 'none') {
                const type = document.getElementById('import-sheets-type').value;
                info.innerHTML = this.getTemplateInfoHtml(type);
            }
        });
    },

    // === Importação Google Sheets ===
    
    /**
     * Importa dados colados de uma planilha (TSV - tab separated)
     */
    importFromSheets(type, rawData) {
        try {
            // Detecta separador (tab ou ;)
            const separator = rawData.includes('\t') ? '\t' : ';';
            const lines = rawData.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            
            if (lines.length < 2) {
                return { success: false, error: 'Precisa ter cabeçalho + pelo menos 1 linha de dados.' };
            }

            // Primeira linha é o cabeçalho
            const headers = lines[0].split(separator).map(h => h.trim().toLowerCase());
            const rows = lines.slice(1).map(line => {
                const values = line.split(separator).map(v => v.trim());
                const obj = {};
                headers.forEach((h, i) => { obj[h] = values[i] || ''; });
                return obj;
            });

            switch (type) {
                case 'children':
                    return this.importChildrenFromRows(rows);
                case 'tasks':
                    return this.importTasksFromRows(rows);
                case 'rewards':
                    return this.importRewardsFromRows(rows);
                default:
                    return { success: false, error: 'Tipo inválido.' };
            }
        } catch (e) {
            return { success: false, error: e.message };
        }
    },

    importChildrenFromRows(rows) {
        const children = Storage.getChildren();
        let count = 0;

        for (const row of rows) {
            const name = row['nome'] || row['name'] || '';
            if (!name) continue;

            const emoji = row['emoji'] || row['avatar'] || '🧒';
            const color = row['cor'] || row['color'] || '#6c5ce7';

            // Verifica se já existe pelo nome
            const exists = children.find(c => c.name.toLowerCase() === name.toLowerCase());
            if (exists) continue;

            children.push({
                id: 'child_' + Date.now() + '_' + count,
                name,
                emoji,
                color: color.startsWith('#') ? color : '#6c5ce7',
                totalPoints: parseInt(row['pontos'] || row['points'] || '0') || 0,
                weeklyPoints: 0,
                tasksCompleted: 0,
                streak: 0,
                medals: [],
                categoryCount: {},
                lastActivityDate: null
            });
            count++;
        }

        Storage.saveChildren(children);
        return { success: true, count };
    },

    importTasksFromRows(rows) {
        const tasks = Storage.getTasks();
        const children = Storage.getChildren();
        let count = 0;
        let skippedNoChild = 0;

        // Se não tem criança cadastrada, não pode importar tarefas
        if (children.length === 0) {
            return { success: false, error: 'Cadastre pelo menos uma criança antes de importar tarefas.' };
        }

        // Criança padrão (primeira cadastrada) para quando o responsável não é informado
        const defaultChild = children[0];

        for (const row of rows) {
            const title = row['titulo'] || row['título'] || row['title'] || row['tarefa'] || '';
            if (!title) continue;

            const childName = row['responsavel'] || row['responsável'] || row['crianca'] || row['criança'] || row['child'] || '';
            let child = null;

            if (childName) {
                child = children.find(c => c.name.toLowerCase() === childName.toLowerCase());
            }
            
            // Se não encontrou pelo nome, usa a criança padrão
            if (!child) {
                child = defaultChild;
            }

            const category = this.normalizeCategory(row['categoria'] || row['category'] || 'casa');
            const points = parseInt(row['pontos'] || row['points'] || '10') || 10;
            const description = row['descricao'] || row['descrição'] || row['description'] || '';
            const status = this.normalizeStatus(row['status'] || 'todo');

            tasks.push({
                id: 'task_' + Date.now() + '_' + count,
                title,
                description,
                childId: child.id,
                points,
                category,
                status,
                createdAt: new Date().toISOString()
            });
            count++;
        }

        Storage.saveTasks(tasks);
        return { success: true, count };
    },

    importRewardsFromRows(rows) {
        const rewards = Storage.getRewards();
        let count = 0;

        for (const row of rows) {
            const name = row['nome'] || row['name'] || row['recompensa'] || '';
            if (!name) continue;

            const cost = parseInt(row['custo'] || row['pontos'] || row['cost'] || row['points'] || '50') || 50;
            const emoji = row['emoji'] || row['icone'] || row['ícone'] || '🎁';

            // Verifica se já existe pelo nome
            const exists = rewards.find(r => r.name.toLowerCase() === name.toLowerCase());
            if (exists) continue;

            rewards.push({
                id: 'reward_' + Date.now() + '_' + count,
                name,
                cost,
                emoji
            });
            count++;
        }

        Storage.saveRewards(rewards);
        return { success: true, count };
    },

    normalizeCategory(cat) {
        const map = {
            'casa': 'casa', 'home': 'casa', '🏠': 'casa',
            'estudos': 'estudos', 'estudo': 'estudos', 'study': 'estudos', '📚': 'estudos',
            'higiene': 'higiene', 'hygiene': 'higiene', '🦷': 'higiene',
            'exercicios': 'exercicios', 'exercício': 'exercicios', 'exercícios': 'exercicios', 'exercise': 'exercicios', '🏃': 'exercicios',
            'boas-acoes': 'boas-acoes', 'boas acoes': 'boas-acoes', 'boas ações': 'boas-acoes', 'boas-ações': 'boas-acoes', '❤️': 'boas-acoes'
        };
        return map[cat.toLowerCase()] || 'casa';
    },

    normalizeStatus(status) {
        const map = {
            'a fazer': 'todo', 'todo': 'todo', 'pendente': 'todo', '📋': 'todo',
            'fazendo': 'doing', 'doing': 'doing', 'em andamento': 'doing', '🚀': 'doing',
            'concluido': 'done', 'concluído': 'done', 'done': 'done', 'feito': 'done', '✅': 'done',
            'validado': 'validated', 'validated': 'validated', '🏆': 'validated'
        };
        return map[status.toLowerCase()] || 'todo';
    },

    /**
     * Gera template CSV para download
     */
    getSheetTemplate(type) {
        switch (type) {
            case 'children':
                return 'Nome;Emoji;Cor;Pontos\nSofia;👧;#e84393;0\nJoão;👦;#0984e3;0\nAyla;👧;#6c5ce7;0';
            case 'tasks':
                return [
                    'Título;Descrição;Responsável;Pontos;Categoria;Status',
                    // 🏠 Casa
                    'Arrumar a cama;Deixar travesseiro e lençol organizados;;10;Casa;A Fazer',
                    'Guardar brinquedos;Colocar tudo no lugar antes de dormir;;10;Casa;A Fazer',
                    'Arrumar o quarto;Organizar roupas, mesa e chão;;15;Casa;A Fazer',
                    'Colocar roupa suja no cesto;Após trocar de roupa;;5;Casa;A Fazer',
                    'Ajudar a pôr a mesa;Pratos, talheres e copos;;10;Casa;A Fazer',
                    'Ajudar a tirar a mesa;Levar pratos para a pia;;10;Casa;A Fazer',
                    'Guardar compras;Ajudar a organizar as compras do mercado;;15;Casa;A Fazer',
                    'Regar as plantas;Cuidar das plantas da casa;;10;Casa;A Fazer',
                    'Dobrar roupas;Ajudar a dobrar roupas limpas;;15;Casa;A Fazer',
                    'Varrer o quarto;Manter o quarto limpo;;15;Casa;A Fazer',
                    // 📚 Estudos
                    'Fazer lição de casa;Completar todas as atividades do dia;;15;Estudos;A Fazer',
                    'Ler 20 minutos;Qualquer livro ou gibi;;15;Estudos;A Fazer',
                    'Praticar tabuada;Treinar multiplicação por 10 minutos;;10;Estudos;A Fazer',
                    'Estudar para prova;Revisar matéria com antecedência;;20;Estudos;A Fazer',
                    'Organizar mochila;Conferir materiais para o dia seguinte;;5;Estudos;A Fazer',
                    'Praticar inglês;15 minutos de app ou exercício;;15;Estudos;A Fazer',
                    'Fazer atividade extra;Exercícios além da lição;;20;Estudos;A Fazer',
                    'Ler em voz alta;Praticar leitura por 10 minutos;;10;Estudos;A Fazer',
                    // 🦷 Higiene
                    'Escovar os dentes (manhã);Logo após acordar;;5;Higiene;A Fazer',
                    'Escovar os dentes (noite);Antes de dormir;;5;Higiene;A Fazer',
                    'Tomar banho sozinho(a);Lavar cabelo e corpo direitinho;;10;Higiene;A Fazer',
                    'Lavar as mãos;Antes das refeições e ao chegar em casa;;5;Higiene;A Fazer',
                    'Pentear o cabelo;Manter cabelo arrumado;;5;Higiene;A Fazer',
                    'Cortar as unhas;Manter unhas curtas e limpas;;10;Higiene;A Fazer',
                    'Usar fio dental;Pelo menos uma vez ao dia;;5;Higiene;A Fazer',
                    // 🏃 Exercícios
                    'Brincar ao ar livre;30 minutos de atividade física;;15;Exercícios;A Fazer',
                    'Andar de bicicleta;Pedalar por 20 minutos;;15;Exercícios;A Fazer',
                    'Fazer alongamento;5 minutos ao acordar;;10;Exercícios;A Fazer',
                    'Pular corda;50 pulos sem parar;;10;Exercícios;A Fazer',
                    'Jogar bola;20 minutos de futebol ou outro esporte;;15;Exercícios;A Fazer',
                    'Dançar;Uma música inteira dançando;;10;Exercícios;A Fazer',
                    'Nadar;Aula ou prática de natação;;20;Exercícios;A Fazer',
                    // ❤️ Boas ações
                    'Ajudar um irmão;Auxiliar com tarefa ou brincadeira;;15;Boas Ações;A Fazer',
                    'Dizer obrigado;Agradecer pelo menos 3 vezes no dia;;5;Boas Ações;A Fazer',
                    'Compartilhar brinquedo;Emprestar algo para alguém;;10;Boas Ações;A Fazer',
                    'Fazer um elogio;Dizer algo gentil para alguém;;5;Boas Ações;A Fazer',
                    'Ajudar vizinho ou colega;Fazer algo gentil por outra pessoa;;15;Boas Ações;A Fazer',
                    'Cuidar do pet;Dar comida, água ou brincar com o animal;;10;Boas Ações;A Fazer',
                    'Pedir desculpas;Reconhecer um erro e pedir perdão;;10;Boas Ações;A Fazer',
                    'Abraçar alguém da família;Demonstrar carinho espontaneamente;;5;Boas Ações;A Fazer',
                    'Doar brinquedo ou roupa;Separar algo para doação;;20;Boas Ações;A Fazer'
                ].join('\n');
            case 'rewards':
                return 'Nome;Custo;Emoji\nEscolher sobremesa;50;🍰\nEscolher filme da noite;100;🎬\nSorvete;150;🍦\nPasseio especial;300;🎡\nBrinquedo pequeno;500;🧸\nDormir mais tarde (30min);80;🌙\nTempo extra de tela (30min);120;📱\nPedir delivery;200;🍕\nEscolher passeio do fim de semana;250;🗺️\nFesta do pijama;400;🎉';
            default:
                return '';
        }
    },

    /**
     * Gera HTML com informações do formato esperado
     */
    getTemplateInfoHtml(type) {
        switch (type) {
            case 'children':
                return `
                    <strong>📋 Formato para Crianças:</strong>
                    <table>
                        <tr><th>Nome</th><th>Emoji</th><th>Cor</th><th>Pontos</th></tr>
                        <tr><td>Sofia</td><td>👧</td><td>#e84393</td><td>0</td></tr>
                        <tr><td>João</td><td>👦</td><td>#0984e3</td><td>0</td></tr>
                    </table>
                    <p style="margin-top:8px;"><strong>Colunas aceitas:</strong> Nome, Emoji/Avatar, Cor/Color, Pontos/Points</p>
                `;
            case 'tasks':
                return `
                    <strong>📋 Formato para Tarefas:</strong>
                    <table>
                        <tr><th>Título</th><th>Descrição</th><th>Responsável</th><th>Pontos</th><th>Categoria</th><th>Status</th></tr>
                        <tr><td>Arrumar a cama</td><td>Deixar organizado</td><td>Sofia</td><td>10</td><td>Casa</td><td>A Fazer</td></tr>
                        <tr><td>Escovar dentes</td><td>Manhã e noite</td><td></td><td>5</td><td>Higiene</td><td>A Fazer</td></tr>
                    </table>
                    <p style="margin-top:8px;"><strong>Categorias:</strong> Casa, Estudos, Higiene, Exercícios, Boas Ações</p>
                    <p><strong>Status:</strong> A Fazer, Fazendo, Concluído, Validado</p>
                    <p><strong>💡 Dica:</strong> O campo Responsável é opcional. Se vazio, a tarefa será atribuída à primeira criança cadastrada. Você pode editar depois.</p>
                    <p><strong>📥 Use "Baixar Template"</strong> para obter uma lista pronta com +35 tarefas comuns do dia a dia familiar.</p>
                `;
            case 'rewards':
                return `
                    <strong>📋 Formato para Recompensas:</strong>
                    <table>
                        <tr><th>Nome</th><th>Custo</th><th>Emoji</th></tr>
                        <tr><td>Escolher sobremesa</td><td>50</td><td>🍰</td></tr>
                        <tr><td>Sorvete</td><td>150</td><td>🍦</td></tr>
                    </table>
                    <p style="margin-top:8px;"><strong>Colunas aceitas:</strong> Nome/Recompensa, Custo/Pontos, Emoji/Ícone</p>
                `;
            default:
                return '';
        }
    },

    // === PWA ===
    setupPWA() {
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            document.getElementById('install-btn').style.display = 'block';
        });

        document.getElementById('install-btn').addEventListener('click', () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((result) => {
                    if (result.outcome === 'accepted') {
                        this.showToast('📱 App instalado!');
                    }
                    deferredPrompt = null;
                    document.getElementById('install-btn').style.display = 'none';
                });
            }
        });

        // Registra Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js').catch(() => {
                // Service worker não disponível (dev mode)
            });
        }
    },

    // === Sons ===
    playSound(type) {
        if (!this.soundEnabled) return;
        
        // Usa Web Audio API para sons simples
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            const sounds = {
                add: { freq: 523, duration: 0.1, type: 'sine' },
                move: { freq: 440, duration: 0.08, type: 'sine' },
                validate: { freq: 659, duration: 0.15, type: 'sine' },
                levelup: { freq: 880, duration: 0.3, type: 'square' },
                medal: { freq: 784, duration: 0.25, type: 'sine' },
                reward: { freq: 698, duration: 0.2, type: 'triangle' },
                error: { freq: 220, duration: 0.2, type: 'sawtooth' },
                delete: { freq: 330, duration: 0.1, type: 'sine' }
            };
            
            const sound = sounds[type] || sounds.add;
            oscillator.type = sound.type;
            oscillator.frequency.setValueAtTime(sound.freq, ctx.currentTime);
            gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + sound.duration);
            
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + sound.duration);
        } catch (e) {
            // Audio não suportado
        }
    },

    // === Confetti ===
    showConfetti() {
        const canvas = document.getElementById('confetti-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];
        const colors = ['#6c5ce7', '#00cec9', '#fdcb6e', '#e17055', '#00b894', '#fd79a8', '#a29bfe'];

        for (let i = 0; i < 150; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                size: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                speedY: Math.random() * 3 + 2,
                speedX: Math.random() * 4 - 2,
                rotation: Math.random() * 360,
                rotationSpeed: Math.random() * 10 - 5
            });
        }

        let frame = 0;
        const maxFrames = 120;

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            particles.forEach(p => {
                p.y += p.speedY;
                p.x += p.speedX;
                p.rotation += p.rotationSpeed;
                
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation * Math.PI / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
                ctx.restore();
            });

            frame++;
            if (frame < maxFrames) {
                requestAnimationFrame(animate);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }

        animate();
    },

    // === Toast ===
    showToast(message, type = 'success') {
        // Remove toast anterior
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span>${message}</span>`;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// === Inicialização ===
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
