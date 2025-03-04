document.addEventListener('DOMContentLoaded', function () {
  // Enhanced genre selector functionality
  const genreSelect = document.getElementById('genres');

  // Function to limit genre selections to 5
  if (genreSelect) {
    genreSelect.addEventListener('change', function () {
      const selectedOptions = Array.from(this.selectedOptions);
      if (selectedOptions.length > 5) {
        alert('You can select a maximum of 5 genres.');
        // Deselect the last option
        selectedOptions[selectedOptions.length - 1].selected = false;
      }
    });
  }

  // Funzione per generare un numero casuale tra min e max inclusi
  function getRandomValue(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Imposta valori casuali per gli slider al caricamento della pagina
  function setRandomSliderValues() {
    const sliders = [
      { slider: 'target_energy', value: getRandomValue(0, 100) },
      { slider: 'target_popularity', value: getRandomValue(0, 100) },
      { slider: 'target_acousticness', value: getRandomValue(0, 100) }
    ];

    sliders.forEach(({ slider, value }) => {
      const sliderElement = document.getElementById(slider);
      const valueDisplay = document.getElementById(slider.replace('target_', '') + '-value');

      sliderElement.value = value;
      valueDisplay.textContent = `${value}%`;
    });
  }

  // Esegui l'impostazione dei valori casuali al caricamento
  setRandomSliderValues();

  // Set up slider value displays
  function setupSlider(sliderId, valueId) {
    const slider = document.getElementById(sliderId);
    const valueDisplay = document.getElementById(valueId);

    // Aggiungiamo l'event listener per l'evento 'input'
    slider.addEventListener('input', function () {
      valueDisplay.textContent = `${this.value}%`;
    });
  }

  // Chiamiamo la funzione setupSlider per ogni slider
  setupSlider('target_energy', 'energy-value');
  setupSlider('target_popularity', 'popularity-value');
  setupSlider('target_acousticness', 'acousticness-value');

  // Collegamento del pulsante randomize
  const randomizeBtn = document.getElementById('randomize-features');
  if (randomizeBtn) {
    randomizeBtn.addEventListener('click', setRandomSliderValues);
  }

  // Set up slider value displays - correzione per aggiornare i valori
  const sliders = document.querySelectorAll('input[type="range"]');
  sliders.forEach(slider => {
    const valueId = slider.id.replace('target_', '') + '-value';
    const valueDisplay = document.getElementById(valueId);

    if (valueDisplay) {
      // Aggiungiamo eventi sia per input (durante il trascinamento) che per change (al rilascio)
      slider.addEventListener('input', function () {
        valueDisplay.textContent = `${this.value}%`;
      });

      slider.addEventListener('change', function () {
        valueDisplay.textContent = `${this.value}%`;
      });
    }
  });
});
