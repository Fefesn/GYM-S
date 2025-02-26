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
            id: Date.now() // Identificador único para cada exercício
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

    function saveExercise(exercise) {
        const exercises = JSON.parse(localStorage.getItem('exercises')) || [];
        exercises.push(exercise);
        localStorage.setItem('exercises', JSON.stringify(exercises));
    }

    function loadExercises() {
        const exercises = JSON.parse(localStorage.getItem('exercises')) || [];
        exercises.forEach(exercise => addExerciseToList(exercise));
    }

    function addExerciseToList(exercise) {
        const li = document.createElement('li');
        li.className = 'added';
        li.dataset.id = exercise.id;
        li.innerHTML = `
            ${exercise.exercicio} - ${exercise.series} séries x ${exercise.repeticoes} reps - ${exercise.peso}kg
            <button class="delete-btn"> x </button>
        `;

        // Adicionar evento de clique diretamente no botão
        const deleteBtn = li.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => deleteExercise(exercise.id));

        exerciseList.appendChild(li);
    }

    function deleteExercise(id) {
        // Remover do DOM
        const element = document.querySelector(`li[data-id="${id}"]`);
        if (element) element.remove();

        // Remover do localStorage
        const exercises = JSON.parse(localStorage.getItem('exercises')) || [];
        const filteredExercises = exercises.filter(exercise => exercise.id !== id);
        localStorage.setItem('exercises', JSON.stringify(filteredExercises));
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
});
