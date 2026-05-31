/**
 * 🎁 Rewards Module
 * Gerencia a loja de recompensas
 */

const Rewards = {
    // Recompensas padrão
    DEFAULT_REWARDS: [
        { id: 'r1', name: 'Escolher sobremesa', cost: 50, emoji: '🍰' },
        { id: 'r2', name: 'Escolher filme da noite', cost: 100, emoji: '🎬' },
        { id: 'r3', name: 'Sorvete', cost: 150, emoji: '🍦' },
        { id: 'r4', name: 'Passeio especial', cost: 300, emoji: '🎡' },
        { id: 'r5', name: 'Brinquedo pequeno', cost: 500, emoji: '🧸' }
    ],

    /**
     * Inicializa a loja
     */
    init() {
        // Se não há recompensas, carrega as padrão
        const rewards = Storage.getRewards();
        if (rewards.length === 0) {
            Storage.saveRewards(this.DEFAULT_REWARDS);
        }
        this.render();
    },

    /**
     * Adiciona uma recompensa
     */
    addReward(rewardData) {
        const rewards = Storage.getRewards();
        const reward = {
            id: 'reward_' + Date.now(),
            ...rewardData
        };
        rewards.push(reward);
        Storage.saveRewards(rewards);
        App.playSound('add');
        this.render();
    },

    /**
     * Edita uma recompensa
     */
    editReward(rewardId, rewardData) {
        const rewards = Storage.getRewards();
        const index = rewards.findIndex(r => r.id === rewardId);
        if (index !== -1) {
            rewards[index] = { ...rewards[index], ...rewardData };
            Storage.saveRewards(rewards);
            this.render();
        }
    },

    /**
     * Remove uma recompensa
     */
    deleteReward(rewardId) {
        if (!confirm('Remover esta recompensa?')) return;
        const rewards = Storage.getRewards().filter(r => r.id !== rewardId);
        Storage.saveRewards(rewards);
        this.render();
    },

    /**
     * Resgata uma recompensa para uma criança
     */
    redeem(rewardId, childId) {
        const rewards = Storage.getRewards();
        const reward = rewards.find(r => r.id === rewardId);
        if (!reward) return;

        const children = Storage.getChildren();
        const childIndex = children.findIndex(c => c.id === childId);
        if (childIndex === -1) return;

        const child = children[childIndex];
        
        // Verifica se tem pontos suficientes
        if ((child.totalPoints || 0) < reward.cost) {
            App.showToast('❌ Pontos insuficientes!', 'error');
            App.playSound('error');
            return;
        }

        // Debita pontos
        child.totalPoints -= reward.cost;
        children[childIndex] = child;
        Storage.saveChildren(children);

        // Registra resgate
        const redeems = Storage.getRedeems();
        redeems.push({
            id: 'redeem_' + Date.now(),
            rewardId: reward.id,
            rewardName: reward.name,
            rewardEmoji: reward.emoji,
            childId: child.id,
            childName: child.name,
            cost: reward.cost,
            date: new Date().toISOString()
        });
        Storage.saveRedeems(redeems);

        // Registra no histórico
        Storage.addHistoryEntry({
            type: 'redeem',
            childId: child.id,
            rewardName: reward.name,
            cost: reward.cost
        });

        App.showToast(`🎁 ${child.name} resgatou: ${reward.name}!`);
        App.playSound('reward');
        App.showConfetti();
        
        // Atualiza UI
        App.renderChildren();
        this.render();
    },

    /**
     * Renderiza a loja
     */
    render() {
        const rewards = Storage.getRewards();
        const children = Storage.getChildren();
        const selectedChild = App.selectedChild;
        const grid = document.getElementById('shop-grid');

        grid.innerHTML = rewards.map(reward => {
            let canRedeem = false;
            let childPoints = 0;
            
            if (selectedChild) {
                const child = children.find(c => c.id === selectedChild);
                if (child) {
                    childPoints = child.totalPoints || 0;
                    canRedeem = childPoints >= reward.cost;
                }
            }

            return `
                <div class="reward-card animate-bounce">
                    <span class="reward-emoji">${reward.emoji}</span>
                    <div class="reward-name">${reward.name}</div>
                    <div class="reward-cost">⭐ ${reward.cost} pontos</div>
                    ${selectedChild ? `
                        <button class="redeem-btn" 
                                ${!canRedeem ? 'disabled' : ''}
                                onclick="Rewards.redeem('${reward.id}', '${selectedChild}')">
                            ${canRedeem ? '🎉 Resgatar' : '🔒 Pontos insuficientes'}
                        </button>
                    ` : '<p style="font-size:0.8rem;color:var(--text-secondary)">Selecione uma criança</p>'}
                    <div class="reward-actions">
                        <button onclick="App.openEditReward('${reward.id}')" title="Editar">✏️</button>
                        <button onclick="Rewards.deleteReward('${reward.id}')" title="Remover">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');

        // Renderiza histórico de resgates
        this.renderHistory();
    },

    /**
     * Renderiza histórico de resgates
     */
    renderHistory() {
        const redeems = Storage.getRedeems();
        const list = document.getElementById('redeem-history-list');

        if (redeems.length === 0) {
            list.innerHTML = '<p style="color:var(--text-secondary);font-size:0.9rem;">Nenhum resgate ainda.</p>';
            return;
        }

        // Mostra os últimos 20 resgates
        const recent = redeems.slice(-20).reverse();
        
        list.innerHTML = recent.map(r => {
            const date = new Date(r.date).toLocaleDateString('pt-BR');
            return `
                <div class="redeem-item">
                    <div class="redeem-info">
                        <span>${r.rewardEmoji}</span>
                        <span><strong>${r.childName}</strong> resgatou ${r.rewardName}</span>
                    </div>
                    <div>
                        <span class="redeem-date">${date}</span>
                        <span style="color:var(--danger);font-weight:700;">-${r.cost}pts</span>
                    </div>
                </div>
            `;
        }).join('');
    }
};
