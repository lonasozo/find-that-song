document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('playlist-form');
  const resultDiv = document.getElementById('result');
  const loadingSpinner = document.getElementById('loading-spinner');

  if (form) {
    // Set up the generation type toggle
    const typeSelect = document.getElementById('type');
    if (typeSelect) {
      typeSelect.addEventListener('change', function () {
        toggleFormFields(this.value);
      });

      // Initialize form based on current selection
      toggleFormFields(typeSelect.value);
    }

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      // Show loading indicator
      if (loadingSpinner) loadingSpinner.style.display = 'block';
      if (resultDiv) resultDiv.innerHTML = '';

      // Validate form
      const nameField = document.getElementById('name');
      const typeField = document.getElementById('type');

      if (!nameField.value.trim()) {
        nameField.value = `Find That Song - ${new Date().toLocaleDateString()}`;
      }

      // Gather form data
      const formData = new FormData(form);
      const formValues = Object.fromEntries(formData.entries());

      // Handle genre selection when type is 'genres'
      if (formValues.type === 'genres') {
        const genresSelect = document.getElementById('genres');
        const selectedGenres = Array.from(genresSelect.selectedOptions).map(option => option.value);

        if (selectedGenres.length === 0) {
          alert('Please select at least one genre');
          if (loadingSpinner) loadingSpinner.style.display = 'none';
          return;
        }

        formValues.genres = selectedGenres;
      }

      console.log('Submitting form with values:', formValues);

      try {
        const response = await fetch('/create-playlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formValues)
        });

        const data = await response.json();

        if (data.success) {
          // Show success message
          resultDiv.innerHTML = `
            <div class="success-message">
              <h3>Playlist Created!</h3>
              <p>Your playlist "${data.playlist.name}" has been created with ${data.playlist.track_count} tracks.</p>
              <a href="${data.playlist.external_url}" target="_blank" class="spotify-link">
                Open in Spotify
              </a>
            </div>
          `;
        } else {
          // Show error message
          resultDiv.innerHTML = `
            <div class="error-message">
              <h3>Error</h3>
              <p>${data.error || 'Something went wrong creating your playlist.'}</p>
              <button type="button" class="retry-btn" onclick="location.reload()">Try Again</button>
            </div>
          `;
        }
      } catch (error) {
        console.error('Error:', error);
        resultDiv.innerHTML = `
          <div class="error-message">
            <h3>Error</h3>
            <p>There was a problem communicating with the server. Please try again.</p>
            <button type="button" class="retry-btn" onclick="location.reload()">Try Again</button>
          </div>
        `;
      } finally {
        // Hide loading indicator
        if (loadingSpinner) loadingSpinner.style.display = 'none';
      }
    });
  }
});

// Function to toggle form fields based on generation type
function toggleFormFields(generationType) {
  const genresContainer = document.querySelector('.genres-container');

  if (genresContainer) {
    genresContainer.style.display = generationType === 'genres' ? 'block' : 'none';
  }
}
