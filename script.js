document.addEventListener('DOMContentLoaded', () => {
    const exerciseForm = document.getElementById('exercise-form');
    const exerciseList = document.getElementById('exercise-list');
    const toggleViewButton = document.getElementById('toggle-view');
    const toggleBackButton = document.getElementById('toggle-back');
    const flipContainer = document.querySelector('.flip-container');
    const dayCheckboxes = document.querySelectorAll('.days-list input[type="checkbox"]');

    // Carregar dados salvos
    loadExercises();
    loadDayStates();

    // Adicionar exercício
    exerciseForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Pegar valores do formulário
        const exercicio = document.getElementById('exercicio').value;
        const repeticoes = document.getElementById('exercise-reps').value;
        const series = document.getElementById('exercise-sets').value;
        const peso = document.getElementById('exercise-weight').value;

        // Validar se todos os campos estão preenchidos
        if (!exercicio || !repeticoes || !series || !peso) {
            alert('Por favor, preencha todos os campos!');
            return;
        }

        // Criar novo exercício
        const newExercise = {
            exercicio,
            repeticoes,
            series,
            peso,
            id: Date.now(), // Identificador único para cada exercício
            date: new Date().toISOString()
        };

        // Adicionar à lista visual
        addExerciseToList(newExercise);

        // Salvar no localStorage
        saveExercise(newExercise);

        // Limpar formulário
        exerciseForm.reset();
    });

    // Alternar para a vista de dias
    toggleViewButton.addEventListener('click', () => {
        flipContainer.classList.add('flipped');
    });

    // Voltar para a vista de exercícios
    toggleBackButton.addEventListener('click', () => {
        flipContainer.classList.remove('flipped');
    });

    // Salvar estado dos checkboxes
    dayCheckboxes.forEach((checkbox, index) => {
        checkbox.addEventListener('change', () => {
            saveDayState(index, checkbox.checked);
        });
    });

    // Inicializar timer de descanso
    addRestTimer();

    const sounds = {
        click: new Audio('click.mp3'),
        complete: new Audio('complete.mp3'),
        success: new Audio('success.mp3')
    };

    // Pré-carregar sons
    Object.values(sounds).forEach(sound => {
        sound.load();
        sound.volume = 0.5;
    });

    function playSound(soundName) {
        if (sounds[soundName]) {
            sounds[soundName].currentTime = 0;
            sounds[soundName].play().catch(() => {});
        }
    }

    function saveExercise(exercise) {
        const exercises = JSON.parse(localStorage.getItem('exercises')) || [];
        exercises.push(exercise);
        localStorage.setItem('exercises', JSON.stringify(exercises));
        
        // Verificar e atualizar recordes
        updatePersonalRecords(exercise);
        updateDayState();
    }

    function loadExercises() {
        const exercises = JSON.parse(localStorage.getItem('exercises')) || [];
        exercises.forEach(exercise => addExerciseToList(exercise));
    }

    function addExerciseToList(exercise) {
        const li = document.createElement('li');
        li.className = 'added';
        li.dataset.id = exercise.id;
        
        const date = new Date().toLocaleDateString('pt-BR');
        const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        li.innerHTML = `
            <div class="exercise-info">
                <div class="exercise-header">
                    <span class="exercise-date">${date} - ${time}</span>
                    <span class="exercise-name">${exercise.exercicio}</span>
                </div>
                <div class="exercise-details">
                    <div class="sets-tracker">
                        ${generateSetsButtons(exercise.series)}
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill"></div>
                    </div>
                    <span class="detail-item">
                        <i class="fas fa-redo"></i> ${exercise.repeticoes} reps
                    </span>
                    <span class="detail-item">
                        <i class="fas fa-dumbbell"></i> ${exercise.peso}kg
                    </span>
                </div>
            </div>
            <div class="exercise-actions">
                <button class="edit-btn" title="Editar">✎</button>
                <button class="delete-btn" title="Excluir">×</button>
            </div>
        `;

        const setsButtons = li.querySelectorAll('.set-btn');
        const progressFill = li.querySelector('.progress-fill');
        let completedSets = 0;

        setsButtons.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                playSound('click');
                btn.classList.toggle('completed');
                vibrate(); // Vibrar ao completar série
                
                if (btn.classList.contains('completed')) {
                    completedSets++;
                    showSetCompletionEffect(btn);
                } else {
                    completedSets--;
                }

                // Atualizar barra de progresso com efeito de brilho
                const progress = (completedSets / exercise.series) * 100;
                progressFill.style.width = `${progress}%`;
                progressFill.classList.add('glow');
                setTimeout(() => progressFill.classList.remove('glow'), 500);

                if (completedSets === parseInt(exercise.series)) {
                    playSound('success');
                    showExerciseCompletionEffect(li);
                    vibrate([100, 50, 100]); // Vibração especial ao completar
                }
            });
        });

        // Adicionar eventos aos botões
        const editBtn = li.querySelector('.edit-btn');
        editBtn.addEventListener('click', () => editExercise(exercise));
        
        const deleteBtn = li.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => deleteExercise(exercise.id));

        exerciseList.insertBefore(li, exerciseList.firstChild);
    }

    function generateSetsButtons(numSets) {
        let buttons = '';
        for (let i = 0; i < numSets; i++) {
            buttons += `<button class="set-btn" data-set="${i + 1}">${i + 1}</button>`;
        }
        return buttons;
    }

    function showSetCompletionEffect(button) {
        const effect = document.createElement('div');
        effect.className = 'completion-effect';
        button.appendChild(effect);
        
        setTimeout(() => effect.remove(), 1000);
    }

    function showExerciseCompletionEffect(element) {
        element.classList.add('exercise-completed');
        
        const confetti = document.createElement('div');
        confetti.className = 'confetti-container';
        element.appendChild(confetti);
        
        // Criar confetes
        for (let i = 0; i < 30; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.setProperty('--delay', `${Math.random() * 1}s`);
            piece.style.setProperty('--rotation', `${Math.random() * 360}deg`);
            confetti.appendChild(piece);
        }
        
        setTimeout(() => confetti.remove(), 3000);
    }

    function editExercise(exercise) {
        const modal = document.createElement('div');
        modal.className = 'edit-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Editar ${exercise.exercicio}</h3>
                <div class="edit-form">
                    <label>Séries:
                        <input type="number" id="edit-series" value="${exercise.series}">
                    </label>
                    <label>Repetições:
                        <input type="number" id="edit-reps" value="${exercise.repeticoes}">
                    </label>
                    <label>Peso (kg):
                        <input type="number" id="edit-weight" value="${exercise.peso}">
                    </label>
                </div>
                <div class="modal-actions">
                    <button class="save-btn">Salvar</button>
                    <button class="cancel-btn">Cancelar</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.save-btn').addEventListener('click', () => {
            const newSeries = document.getElementById('edit-series').value;
            const newReps = document.getElementById('edit-reps').value;
            const newWeight = document.getElementById('edit-weight').value;

            if (newSeries && newReps && newWeight) {
                exercise.series = newSeries;
                exercise.repeticoes = newReps;
                exercise.peso = newWeight;
                updateExerciseInStorage(exercise);
                loadExercises();
                modal.remove();
            }
        });

        modal.querySelector('.cancel-btn').addEventListener('click', () => {
            modal.remove();
        });
    }

    function updateExerciseInStorage(updatedExercise) {
        const exercises = JSON.parse(localStorage.getItem('exercises')) || [];
        const index = exercises.findIndex(ex => ex.id === updatedExercise.id);
        if (index !== -1) {
            exercises[index] = updatedExercise;
            localStorage.setItem('exercises', JSON.stringify(exercises));
        }
    }

    function deleteExercise(id) {
        showConfirmModal(id);
    }

    function showConfirmModal(exerciseId) {
        const modal = document.createElement('div');
        modal.className = 'confirm-modal';
        modal.innerHTML = `
            <div class="confirm-content">
                <div class="confirm-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>Confirmar Exclusão</h3>
                <p>Tem certeza que deseja excluir este exercício?</p>
                <div class="confirm-buttons">
                    <button class="confirm-btn">Confirmar</button>
                    <button class="cancel-btn">Cancelar</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Adicionar animação de entrada
        setTimeout(() => modal.classList.add('show'), 10);

        // Configurar botões
        modal.querySelector('.confirm-btn').addEventListener('click', () => {
            const element = document.querySelector(`li[data-id="${exerciseId}"]`);
            if (element) {
                modal.classList.remove('show');
                
                // Adicionar efeito de shake antes de remover
                element.classList.add('shake');
                
                setTimeout(() => {
                    element.classList.remove('shake');
                    element.classList.add('removing');
                    
                    element.addEventListener('animationend', () => {
                        if (element.classList.contains('removing')) {
                            element.remove();
                            
                            // Remover do localStorage
                            const exercises = JSON.parse(localStorage.getItem('exercises')) || [];
                            const filteredExercises = exercises.filter(exercise => exercise.id !== exerciseId);
                            localStorage.setItem('exercises', JSON.stringify(filteredExercises));
                        }
                    });
                }, 300);

                // Remover modal após animação
                setTimeout(() => modal.remove(), 300);
            }
        });

        modal.querySelector('.cancel-btn').addEventListener('click', () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        });
    }

    function saveDayState(index, state) {
        const dayStates = JSON.parse(localStorage.getItem('dayStates')) || [];
        dayStates[index] = state;
        localStorage.setItem('dayStates', JSON.stringify(dayStates));
    }

    function loadDayStates() {
        const dayStates = JSON.parse(localStorage.getItem('dayStates')) || [];
        dayCheckboxes.forEach((checkbox, index) => {
            checkbox.checked = dayStates[index] || false;
        });
    }

    // Adicionar função de timer
    function addRestTimer() {
        const timerContainer = document.createElement('div');
        timerContainer.className = 'rest-timer';
        timerContainer.innerHTML = `
            <div class="timer-display">00:00</div>
            <div class="timer-controls">
                <button class="timer-btn" data-time="30">30s</button>
                <button class="timer-btn" data-time="60">1min</button>
                <button class="timer-btn" data-time="90">1:30</button>
                <button class="timer-btn" data-time="120">2min</button>
            </div>
        `;

        let timer;
        let timeLeft = 0;

        timerContainer.querySelectorAll('.timer-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                clearInterval(timer);
                timeLeft = parseInt(btn.dataset.time);
                startTimer();
            });
        });

        function startTimer() {
            const display = timerContainer.querySelector('.timer-display');
            display.classList.add('active');
            
            timer = setInterval(() => {
                if (timeLeft <= 0) {
                    clearInterval(timer);
                    display.textContent = '00:00';
                    display.classList.remove('active');
                    new Audio('notification.mp3').play().catch(err => console.log('Áudio não disponível'));
                    return;
                }
                
                const minutes = Math.floor(timeLeft / 60);
                const seconds = timeLeft % 60;
                display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                timeLeft--;
            }, 1000);
        }

        // Inserir o timer após o formulário
        const exerciseForm = document.getElementById('exercise-form');
        exerciseForm.parentNode.insertBefore(timerContainer, exerciseForm.nextSibling);
    }

    // Adicionar função de recordes pessoais
    function updatePersonalRecords(exercise) {
        const records = JSON.parse(localStorage.getItem('personalRecords')) || {};
        const currentRecord = records[exercise.exercicio];
        
        // Verificar se é um novo recorde
        if (!currentRecord || parseFloat(exercise.peso) > parseFloat(currentRecord.peso)) {
            records[exercise.exercicio] = {
                peso: exercise.peso,
                data: new Date().toLocaleDateString('pt-BR'),
                series: exercise.series,
                repeticoes: exercise.repeticoes
            };
            
            localStorage.setItem('personalRecords', JSON.stringify(records));
            showRecordNotification(exercise.exercicio, exercise.peso);
        }
    }

    function showRecordNotification(exercicio, peso) {
        // Criar elemento de notificação
        const notification = document.createElement('div');
        notification.className = 'record-notification';
        notification.innerHTML = `
            <div class="record-content">
                <span class="record-icon">🏆</span>
                <p>Novo recorde em ${exercicio}: ${peso}kg!</p>
            </div>
        `;
        
        // Adicionar ao corpo do documento
        document.body.appendChild(notification);
        
        // Animar a notificação
        setTimeout(() => {
            notification.classList.add('show');
            
            // Remover após 3 segundos
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }, 100);
    }

    function vibrate(duration = 50) {
        if ('vibrate' in navigator) {
            navigator.vibrate(duration);
        }
    }

    function addTouchGestures(element) {
        let touchStartX = 0;
        let touchEndX = 0;

        element.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
        });

        element.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        });

        function handleSwipe() {
            const swipeDistance = touchEndX - touchStartX;
            if (Math.abs(swipeDistance) > 100) {
                if (swipeDistance > 0) {
                    // Swipe direita
                    element.classList.add('swipe-right');
                    setTimeout(() => element.classList.remove('swipe-right'), 300);
                } else {
                    // Swipe esquerda para deletar
                    showConfirmModal(element.dataset.id);
                }
            }
        }
    }

    // Adicionar aos exercícios
    const exerciseItems = document.querySelectorAll('#exercise-list li');
    exerciseItems.forEach(item => addTouchGestures(item));

    function updateDayState() {
        const today = new Date().toLocaleDateString('pt-BR');
        const dayStates = JSON.parse(localStorage.getItem('dayStates')) || [];
        const exercises = JSON.parse(localStorage.getItem('exercises')) || [];
        
        // Contar exercícios de hoje
        const todayExercises = exercises.filter(ex => {
            const exerciseDate = new Date(ex.date).toLocaleDateString('pt-BR');
            return exerciseDate === today;
        }).length;

        // Atualizar estado do dia
        const todayState = dayStates.find(state => state.date === today);
        if (todayExercises > 0 && !todayState) {
            dayStates.push({
                date: today,
                exercises: todayExercises
            });
            localStorage.setItem('dayStates', JSON.stringify(dayStates));
        } else if (todayState) {
            todayState.exercises = todayExercises;
            localStorage.setItem('dayStates', JSON.stringify(dayStates));
        }

        // Criar ou atualizar o indicador visual
        const dayIndicator = document.createElement('div');
        dayIndicator.className = 'day-indicator';
        
        dayIndicator.innerHTML = `
            <div class="day-status ${todayExercises > 0 ? 'completed' : ''}">
                <div class="day-icon">
                    ${todayExercises > 0 ? '✓' : '○'}
                </div>
                <div class="day-info">
                    <span class="day-label">Hoje</span>
                    <span class="day-exercises">${todayExercises > 0 ? `${todayExercises} exercício${todayExercises > 1 ? 's' : ''}` : 'Nenhum exercício'}</span>
                </div>
            </div>
            <div class="streak-info">
                <div class="streak-count">
                    <span class="streak-number">${calculateStreak()}</span>
                    <span class="streak-label">dias seguidos</span>
                </div>
                <div class="streak-flame">🔥</div>
            </div>
        `;

        // Substituir ou adicionar o indicador
        const existingIndicator = document.querySelector('.day-indicator');
        if (existingIndicator) {
            existingIndicator.replaceWith(dayIndicator);
        } else {
            const exerciseLog = document.querySelector('#exercise-log');
            if (exerciseLog.firstChild) {
                exerciseLog.insertBefore(dayIndicator, exerciseLog.firstChild);
            } else {
                exerciseLog.appendChild(dayIndicator);
            }
        }

        // Adicionar animação se tiver exercícios hoje
        if (todayExercises > 0) {
            dayIndicator.querySelector('.day-status').classList.add('pulse-animation');
        }
    }

    function calculateStreak() {
        const dayStates = JSON.parse(localStorage.getItem('dayStates')) || [];
        let streak = 0;
        const today = new Date();
        
        // Ordenar estados por data
        dayStates.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        for (let i = 0; i < dayStates.length; i++) {
            const currentDate = new Date(dayStates[i].date);
            const expectedDate = new Date(today);
            expectedDate.setDate(today.getDate() - i);
            
            if (currentDate.toLocaleDateString('pt-BR') === expectedDate.toLocaleDateString('pt-BR')) {
                streak++;
            } else {
                break;
            }
        }
        
        return streak;
    }

    // Chamar updateDayState quando necessário
    document.addEventListener('DOMContentLoaded', updateDayState);

    // Adicionar interatividade ao logo
    const logo = document.querySelector('.logo-academia');
    if (logo) {
        // Adicionar efeito de pulso ocasional
        setInterval(() => {
            if (Math.random() > 0.7) { // 30% de chance de pulsar
                logo.classList.add('pulse');
                setTimeout(() => {
                    logo.classList.remove('pulse');
                }, 500);
            }
        }, 5000);

        // Adicionar efeito de clique
        logo.addEventListener('click', () => {
            logo.style.animation = 'none';
            logo.offsetHeight; // Trigger reflow
            logo.style.animation = 'shake 0.5s ease-in-out';
            
            // Adicionar efeito de brilho temporário
            logo.style.filter = 'drop-shadow(0 0 10px rgba(255, 165, 0, 0.8))';
            setTimeout(() => {
                logo.style.filter = '';
            }, 500);
        });
    }

    //Marca d'agua
    
    const watermark = document.createElement('div');
    watermark.className = 'watermark';
    watermark.innerHTML = `
        <span class="watermark-text">Feito pelo mano</span>
        <span class="watermark-name">Fefe</span>
    `;
    document.body.appendChild(watermark);
});
