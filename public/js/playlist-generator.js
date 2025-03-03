/**
 * Playlist Generator JavaScript
 * Handles form submission and UI interactions for the playlist generator
 */

document.addEventListener('DOMContentLoaded', function () {
  // Get references to form elements
  const playlistForm = document.getElementById('playlist-form');
  const genreSelect = document.getElementById('genres');
  const loadingSpinner = document.getElementById('loading-spinner');

  // Add a timestamp field to the form to ensure different results each time
  addHiddenTimestamp();

  // Add hidden seed_type field with default value "genres"
  addHiddenSeedTypeField();

  // Limit genre selections to 5
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

  // Handle form submission
  if (playlistForm) {
    playlistForm.addEventListener('submit', function (event) {
      // Validate form fields
      const playlistName = document.getElementById('playlist_name');
      const trackCount = document.getElementById('track_count');

      // Only validate fields that exist
      let isValid = true;

      if (playlistName && !playlistName.value.trim()) {
        isValid = false;
        // Highlight field or show error
        playlistName.classList.add('error');
      }

      if (trackCount) {
        const count = parseInt(trackCount.value);
        if (isNaN(count) || count < 5 || count > 50) {
          isValid = false;
          // Highlight field or show error
          trackCount.classList.add('error');
        }
      }

      if (!isValid) {
        event.preventDefault();
        return false;
      }

      // Update the timestamp for varied results
      updateHiddenTimestamp();

      // Show loading spinner if it exists
      if (loadingSpinner) {
        loadingSpinner.style.display = 'block';
      }

      // Form is valid, submit normally
      return true;
    });
  }

  // Clear error highlighting when inputs change
  document.querySelectorAll('.form-control').forEach(input => {
    input.addEventListener('input', function () {
      this.classList.remove('error');
    });
  });

  /**
   * Add a hidden timestamp field to the form to ensure varied results
   */
  function addHiddenTimestamp() {
    const form = document.getElementById('playlist-form');
    if (form) {
      let timestampField = document.getElementById('request-timestamp');

      if (!timestampField) {
        timestampField = document.createElement('input');
        timestampField.type = 'hidden';
        timestampField.id = 'request-timestamp';
        timestampField.name = 'timestamp';
        timestampField.value = Date.now();
        form.appendChild(timestampField);
      }
    }
  }

  /**
   * Add a hidden seed_type field with value "genres"
   */
  function addHiddenSeedTypeField() {
    const form = document.getElementById('playlist-form');
    if (form) {
      let seedTypeField = document.getElementById('hidden-seed-type');

      if (!seedTypeField) {
        seedTypeField = document.createElement('input');
        seedTypeField.type = 'hidden';
        seedTypeField.id = 'hidden-seed-type';
        seedTypeField.name = 'seed_type';
        seedTypeField.value = 'genres';
        form.appendChild(seedTypeField);
      }
    }
  }

  /**
   * Update the hidden timestamp field
   */
  function updateHiddenTimestamp() {
    const timestampField = document.getElementById('request-timestamp');
    if (timestampField) {
      timestampField.value = Date.now();
    }
  }
});

// Add CSS for error highlighting
document.head.insertAdjacentHTML('beforeend', `
<style>
.form-control.error {
    border-color: #e74c3c;
    box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.25);
}
.spinner {
    width: 40px;
    height: 40px;
    margin: 0 auto;
    border: 4px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    border-left-color: #1DB954;
    animation: spin 1s linear infinite;
}
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
</style>
`);
