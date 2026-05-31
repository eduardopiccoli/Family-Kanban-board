/**
 * 💾 Storage Module
 * Gerencia persistência de dados no localStorage
 */

const Storage = {
    KEYS: {
        CHILDREN: 'kanban_kids_children',
        TASKS: 'kanban_kids_tasks',
        REWARDS: 'kanban_kids_rewards',
        REDEEMS: 'kanban_kids_redeems',
        SETTINGS: 'kanban_kids_settings',
        HISTORY: 'kanban_kids_history'
    },

    /**
     * Salva dados no localStorage
     */
    save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error('Erro ao salvar:', e);
        }
    },

    /**
     * Carrega dados do localStorage
     */
    load(key, defaultValue = []) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error('Erro ao carregar:', e);
            return defaultValue;
        }
    },

    // === Children ===
    getChildren() {
        return this.load(this.KEYS.CHILDREN, []);
    },

    saveChildren(children) {
        this.save(this.KEYS.CHILDREN, children);
    },

    // === Tasks ===
    getTasks() {
        return this.load(this.KEYS.TASKS, []);
    },

    saveTasks(tasks) {
        this.save(this.KEYS.TASKS, tasks);
    },

    // === Rewards ===
    getRewards() {
        return this.load(this.KEYS.REWARDS, []);
    },

    saveRewards(rewards) {
        this.save(this.KEYS.REWARDS, rewards);
    },

    // === Redeems ===
    getRedeems() {
        return this.load(this.KEYS.REDEEMS, []);
    },

    saveRedeems(redeems) {
        this.save(this.KEYS.REDEEMS, redeems);
    },

    // === Settings ===
    getSettings() {
        return this.load(this.KEYS.SETTINGS, {
            theme: 'light',
            sound: true
        });
    },

    saveSettings(settings) {
        this.save(this.KEYS.SETTINGS, settings);
    },

    // === History (para estatísticas) ===
    getHistory() {
        return this.load(this.KEYS.HISTORY, []);
    },

    saveHistory(history) {
        this.save(this.KEYS.HISTORY, history);
    },

    addHistoryEntry(entry) {
        const history = this.getHistory();
        history.push({ ...entry, date: new Date().toISOString() });
        this.saveHistory(history);
    },

    // === Export/Import ===
    exportAll() {
        const data = {
            version: '1.0.0',
            exportDate: new Date().toISOString(),
            children: this.getChildren(),
            tasks: this.getTasks(),
            rewards: this.getRewards(),
            redeems: this.getRedeems(),
            settings: this.getSettings(),
            history: this.getHistory()
        };
        return JSON.stringify(data, null, 2);
    },

    importAll(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (!data.version) throw new Error('Formato inválido');
            
            if (data.children) this.saveChildren(data.children);
            if (data.tasks) this.saveTasks(data.tasks);
            if (data.rewards) this.saveRewards(data.rewards);
            if (data.redeems) this.saveRedeems(data.redeems);
            if (data.settings) this.saveSettings(data.settings);
            if (data.history) this.saveHistory(data.history);
            
            return true;
        } catch (e) {
            console.error('Erro ao importar:', e);
            return false;
        }
    },

    // === Reset ===
    resetAll() {
        Object.values(this.KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    }
};
