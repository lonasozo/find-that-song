document.addEventListener('DOMContentLoaded', function () {
  console.log('Generate playlist form script loaded');

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

  // Track initialization attempts
  let initAttempts = 0;
  const MAX_INIT_ATTEMPTS = 5;

  // Function to initialize audio features with retry logic
  function initializeAudioFeatures() {
    console.log('Initializing audio features... (Attempt ' + (initAttempts + 1) + ')');

    // Check if any elements exist first
    let elementsFound = false;
    for (const feature of audioFeatures) {
      if (document.getElementById(`enable_${feature.name}`)) {
        elementsFound = true;
        break;
      }
    }

    // If no elements are found at all, schedule a retry
    if (!elementsFound) {
      console.log('No audio feature elements found, scheduling retry');
      if (initAttempts < MAX_INIT_ATTEMPTS) {
        initAttempts++;
        // Use exponential backoff for retries
        const delay = Math.min(1000 * Math.pow(1.5, initAttempts), 10000);
        console.log(`Will retry in ${delay}ms`);
        setTimeout(initializeAudioFeatures, delay);
        return;
      } else {
        console.warn('Maximum initialization attempts reached. Elements may not exist.');
      }
    }

    // Reset counter if at least some elements were found
    if (elementsFound) {
      initAttempts = 0;
    }

    // Individual features setup
    let featuresInitialized = 0;

    // Set up feature toggles
    audioFeatures.forEach(feature => {
      const checkbox = document.getElementById(`enable_${feature.name}`);
      const slider = document.getElementById(`target_${feature.name}`);
      const valueDisplay = document.getElementById(`${feature.name}-value`);

      if (checkbox && slider) {
        featuresInitialized++;

        // Set initial value display format
        if (valueDisplay) {
          valueDisplay.textContent = feature.isPercentage ? `${slider.value}%` : slider.value;
        }

        // Remove existing event listeners by cloning and replacing
        const newCheckbox = checkbox.cloneNode(true);
        checkbox.parentNode.replaceChild(newCheckbox, checkbox);

        const newSlider = slider.cloneNode(true);
        slider.parentNode.replaceChild(newSlider, slider);

        // Add fresh event listener to checkbox
        newCheckbox.addEventListener('change', function () {
          console.log(`Checkbox for ${feature.name} changed: ${this.checked}`);

          // Enable/disable slider based on checkbox
          newSlider.disabled = !this.checked;

          // If disabled, remove the name attribute so it won't be submitted
          if (!this.checked) {
            newSlider.removeAttribute('name');
          } else {
            newSlider.setAttribute('name', `target_${feature.name}`);
            // Set a random value when enabled
            const randomValue = getRandomValue(feature.min, feature.max);
            newSlider.value = randomValue;
            if (valueDisplay) {
              valueDisplay.textContent = feature.isPercentage ? `${randomValue}%` : randomValue;
            }
          }
        });

        // Add fresh event listener for slider input
        newSlider.addEventListener('input', function () {
          if (valueDisplay) {
            valueDisplay.textContent = feature.isPercentage ? `${this.value}%` : this.value;
          }
        });
      } else {
        console.log(`Could not find elements for feature: ${feature.name}`);
      }
    });

    // If some features were initialized but not all, schedule a retry for the rest
    if (featuresInitialized > 0 && featuresInitialized < audioFeatures.length && initAttempts < MAX_INIT_ATTEMPTS) {
      console.log(`Partially initialized: ${featuresInitialized}/${audioFeatures.length} features. Scheduling a retry.`);
      initAttempts++;
      setTimeout(initializeAudioFeatures, 1000);
      return;
    }

    // Re-connect randomize button
    const randomizeBtn = document.getElementById('randomize-features');
    if (randomizeBtn) {
      // Remove existing listeners
      const newRandomizeBtn = randomizeBtn.cloneNode(true);
      randomizeBtn.parentNode.replaceChild(newRandomizeBtn, randomizeBtn);

      // Add fresh listener
      newRandomizeBtn.addEventListener('click', function () {
        console.log('Randomize button clicked');
        setRandomSliderValues();
      });
    }

    console.log(`Audio features initialization complete. Successfully initialized: ${featuresInitialized}/${audioFeatures.length} features.`);
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

  // INITIALIZATION STRATEGY

  // Run initialization immediately if we're on the correct page
  if (window.location.href.includes('generate-playlist')) {
    console.log('On generate-playlist page, initializing immediately');

    // First attempt
    initializeAudioFeatures();

    // Backup initialization to ensure all elements are properly initialized
    setTimeout(function () {
      // Reset attempts counter for the delayed initialization
      initAttempts = 0;
      initializeAudioFeatures();
    }, 1000);
  }

  // Run initialization when clicking menu links
  document.addEventListener('click', function (e) {
    let target = e.target;

    // Navigate up the DOM to find any anchor tags (for when clicking on child elements of links)
    while (target && target !== document) {
      if (target.tagName === 'A' && target.href && target.href.includes('generate-playlist')) {
        console.log('Generate playlist link clicked');

        // Reset attempts counter for the new page
        initAttempts = 0;

        // Schedule initializations after navigation
        setTimeout(function () {
          initializeAudioFeatures();
        }, 500);

        break;
      }
      target = target.parentNode;
    }
  });

  // Listen for history changes (back/forward navigation)
  window.addEventListener('popstate', function () {
    console.log('Navigation state changed (popstate)');

    if (window.location.href.includes('generate-playlist')) {
      console.log('On generate-playlist page after navigation');

      // Reset attempts counter for the new page
      initAttempts = 0;

      setTimeout(function () {
        initializeAudioFeatures();
      }, 500);
    }
  });

  // Setup a MutationObserver to detect when content is loaded
  const contentObserver = new MutationObserver(function (mutations) {
    // Only proceed if we're on the correct page
    if (!window.location.href.includes('generate-playlist')) return;

    // Look for our audio features section being added to the DOM
    let featuresAdded = false;
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE &&
            (node.classList?.contains('audio-features-section') ||
              node.querySelector?.('.audio-features-section'))) {
            featuresAdded = true;
            break;
          }
        }
      }
      if (featuresAdded) break;
    }

    if (featuresAdded) {
      console.log('Audio features section detected in DOM, initializing');
      // Reset attempts counter for this initialization
      initAttempts = 0;
      // Wait a moment for all elements to be fully rendered
      setTimeout(initializeAudioFeatures, 300);
    }
  });

  // Start observing content container or the entire body if container not found
  const contentContainer = document.getElementById('content-container') || document.body;
  contentObserver.observe(contentContainer, { childList: true, subtree: true });

  // Periodic check as a fallback
  const periodicCheckInterval = setInterval(function () {
    if (!window.location.href.includes('generate-playlist')) {
      return;
    }

    // Check if we have uninitialized features
    const anyFeatureCheckbox = document.getElementById('enable_energy');
    if (anyFeatureCheckbox && !anyFeatureCheckbox.hasAttribute('data-initialized')) {
      console.log('Periodic check found uninitialized features, initializing');
      // Reset attempts counter for this initialization
      initAttempts = 0;
      initializeAudioFeatures();

      // Mark features as initialized to avoid unnecessary reinitializations
      audioFeatures.forEach(feature => {
        const checkbox = document.getElementById(`enable_${feature.name}`);
        if (checkbox) {
          checkbox.setAttribute('data-initialized', 'true');
        }
      });
    }
  }, 3000);

  // Clean up interval when navigating away
  window.addEventListener('beforeunload', function () {
    clearInterval(periodicCheckInterval);
  });
});
