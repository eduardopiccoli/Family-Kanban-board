/**
 * 🏅 Achievements Module
 * Sistema de medalhas e conquistas
 */

const Achievements = {
    // Definição de todas as medalhas
    MEDALS: [
        {
            id: 'first_task',
            name: 'Primeira Tarefa',
            icon: '🥉',
            description: 'Completou a primeira tarefa',
            check: (child) => child.tasksCompleted >= 1
        },
        {
            id: 'ten_tasks',
            name: '10 Tarefas',
            icon: '🥈',
            description: 'Completou 10 tarefas',
            check: (child) => child.tasksCompleted >= 10
        },
        {
            id: 'fifty_tasks',
            name: '50 Tarefas',
            icon: '🥇',
            description: 'Completou 50 tarefas',
            check: (child) => child.tasksCompleted >= 50
        },
        {
            id: 'seven_days',
            name: '7 Dias Seguidos',
            icon: '⭐',
            description: '7 dias consecutivos com tarefas',
            check: (child) => child.streak >= 7
        },
        {
            id: 'thirty_days',
            name: '30 Dias Seguidos',
            icon: '🔥',
            description: '30 dias consecutivos com tarefas',
            check: (child) => child.streak >= 30
        },
        {
            id: 'study_master',
            name: 'Mestre dos Estudos',
            icon: '📚',
            description: '20 tarefas de estudos concluídas',
            check: (child) => (child.categoryCount?.estudos || 0) >= 20
        },
        {
            id: 'home_hero',
            name: 'Herói da Casa',
            icon: '🏠',
            description: '20 tarefas de casa concluídas',
            check: (child) => (child.categoryCount?.casa || 0) >= 20
        }
    ],

    // Níveis do sistema
    LEVELS: [
        { level: 1, minPoints: 0, name: 'Iniciante' },
        { level: 2, minPoints: 100, name: 'Aprendiz' },
        { level: 3, minPoints: 250, name: 'Explorador' },
        { level: 4, minPoints: 500, name: 'Aventureiro' },
        { level: 5, minPoints: 1000, name: 'Mestre' }
    ],

    /**
     * Calcula o nível baseado nos pontos totais
     */
    getLevel(totalPoints) {
        let currentLevel = this.LEVELS[0];
        for (const level of this.LEVELS) {
            if (totalPoints >= level.minPoints) {
                currentLevel = level;
            }
        }
        return currentLevel;
    },

    /**
     * Calcula progresso para o próximo nível
     */
    getLevelProgress(totalPoints) {
        const currentLevel = this.getLevel(totalPoints);
        const currentIndex = this.LEVELS.indexOf(currentLevel);
        
        if (currentIndex >= this.LEVELS.length - 1) {
            return 100; // Nível máximo
        }
        
        const nextLevel = this.LEVELS[currentIndex + 1];
        const pointsInLevel = totalPoints - currentLevel.minPoints;
        const pointsNeeded = nextLevel.minPoints - currentLevel.minPoints;
        
        return Math.min(100, Math.round((pointsInLevel / pointsNeeded) * 100));
    },

    /**
     * Verifica medalhas conquistadas por uma criança
     */
    checkMedals(child) {
        const earned = [];
        const newMedals = [];
        
        for (const medal of this.MEDALS) {
            if (medal.check(child)) {
                earned.push(medal.id);
                // Verifica se é uma medalha nova
                if (!child.medals || !child.medals.includes(medal.id)) {
                    newMedals.push(medal);
                }
            }
        }
        
        return { earned, newMedals };
    },

    /**
     * Atualiza streak (dias consecutivos)
     */
    updateStreak(child) {
        const today = new Date().toDateString();
        const lastActivity = child.lastActivityDate;
        
        if (!lastActivity) {
            child.streak = 1;
        } else {
            const lastDate = new Date(lastActivity);
            const todayDate = new Date(today);
            const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                child.streak = (child.streak || 0) + 1;
            } else if (diffDays > 1) {
                child.streak = 1;
            }
            // Se diffDays === 0, mantém o streak atual
        }
        
        child.lastActivityDate = today;
        return child;
    },

    /**
     * Calcula pontos da semana
     */
    getWeeklyPoints(childId, history) {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        return history
            .filter(h => h.childId === childId && h.type === 'validated' && new Date(h.date) >= weekAgo)
            .reduce((sum, h) => sum + (h.points || 0), 0);
    }
};
