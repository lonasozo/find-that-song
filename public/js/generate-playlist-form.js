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

  // Random value generator function
  function getRandomValue(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // List of all available audio features
  const audioFeatures = [
    { name: 'energy', min: 0, max: 100, isPercentage: true },
    { name: 'popularity', min: 0, max: 100, isPercentage: true },
    { name: 'acousticness', min: 0, max: 100, isPercentage: true },
    { name: 'danceability', min: 0, max: 100, isPercentage: true },
    { name: 'instrumentalness', min: 0, max: 100, isPercentage: true },
    { name: 'liveness', min: 0, max: 100, isPercentage: true },
    { name: 'valence', min: 0, max: 100, isPercentage: true },
    { name: 'tempo', min: 60, max: 200, isPercentage: false }
  ];

  // Function to initialize audio features
  function initializeAudioFeatures() {
    // Set up feature toggles
    audioFeatures.forEach(feature => {
      const checkbox = document.getElementById(`enable_${feature.name}`);
      const slider = document.getElementById(`target_${feature.name}`);
      const valueDisplay = document.getElementById(`${feature.name}-value`);

      if (checkbox && slider) {
        // Set initial value display format
        if (valueDisplay) {
          valueDisplay.textContent = feature.isPercentage ? `${slider.value}%` : slider.value;
        }

        // Add event listener to checkbox
        checkbox.addEventListener('change', function () {
          // Enable/disable slider based on checkbox
          slider.disabled = !this.checked;

          // If disabled, remove the name attribute so it won't be submitted
          if (!this.checked) {
            slider.removeAttribute('name');
          } else {
            slider.setAttribute('name', `target_${feature.name}`);
            // Set a random value when enabled
            const randomValue = getRandomValue(feature.min, feature.max);
            slider.value = randomValue;
            if (valueDisplay) {
              valueDisplay.textContent = feature.isPercentage ? `${randomValue}%` : randomValue;
            }
          }
        });

        // Add event listener for slider input
        slider.addEventListener('input', function () {
          if (valueDisplay) {
            valueDisplay.textContent = feature.isPercentage ? `${this.value}%` : this.value;
          }
        });
      }
    });
  }

  // Randomize only enabled features
  function setRandomSliderValues() {
    audioFeatures.forEach(feature => {
      const checkbox = document.getElementById(`enable_${feature.name}`);
      const slider = document.getElementById(`target_${feature.name}`);
      const valueDisplay = document.getElementById(`${feature.name}-value`);

      // Only randomize if the feature is enabled
      if (checkbox && checkbox.checked && slider && valueDisplay) {
        const randomValue = getRandomValue(feature.min, feature.max);
        slider.value = randomValue;
        valueDisplay.textContent = feature.isPercentage ? `${randomValue}%` : randomValue;
      }
    });
  }

  // Connect randomize button
  const randomizeBtn = document.getElementById('randomize-features');
  if (randomizeBtn) {
    randomizeBtn.addEventListener('click', setRandomSliderValues);
  }

  // Handle form submission - ensure only enabled feature values are submitted
  const playlistForm = document.getElementById('playlist-form');
  if (playlistForm) {
    playlistForm.addEventListener('submit', function (e) {
      // No need for extra submission handling - we already remove name attributes 
      // from disabled sliders, which prevents them from being submitted
    });
  }

  // Initialize features on page load
  initializeAudioFeatures();

  // Listen for clicks on the "Generate playlist" menu item
  const generatePlaylistMenuItem = document.querySelector('a[href*="generate-playlist"]');
  if (generatePlaylistMenuItem) {
    generatePlaylistMenuItem.addEventListener('click', function () {
      // Schedule initialization to occur after the page content is updated
      setTimeout(initializeAudioFeatures, 100);
    });
  }

  // Check for URL changes indicating we're on the generate-playlist page
  function checkUrlAndInitialize() {
    if (window.location.href.includes('generate-playlist')) {
      initializeAudioFeatures();
    }
  }

  // Use MutationObserver to detect URL changes if this is a single-page app
  const observer = new MutationObserver(function (mutations) {
    if (window.location.href.includes('generate-playlist')) {
      initializeAudioFeatures();
    }
  });

  // Start observing URL changes
  observer.observe(document.body, { childList: true, subtree: true });

  // Also check when the window history changes
  window.addEventListener('popstate', checkUrlAndInitialize);
});
