document.addEventListener('DOMContentLoaded', function () {
  // Theme toggle functionality
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const themeIcon = document.getElementById('theme-icon');
  const themeText = document.getElementById('theme-text');

  // Check if user has a theme preference in localStorage
  const currentTheme = localStorage.getItem('theme') || 'light';

  // Apply the theme on initial load
  applyTheme(currentTheme);

  // Add click event listener to toggle theme
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', function () {
      // Get the current theme
      const currentTheme = document.body.getAttribute('data-theme');

      // Toggle theme
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

      // Apply the new theme
      applyTheme(newTheme);

      // Save preference to localStorage
      localStorage.setItem('theme', newTheme);
    });
  }

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.body.setAttribute('data-theme', 'dark');
      if (themeIcon) themeIcon.textContent = '🌙';
      if (themeText) themeText.textContent = 'Dark Mode';
    } else {
      document.body.removeAttribute('data-theme');
      if (themeIcon) themeIcon.textContent = '☀️';
      if (themeText) themeText.textContent = 'Light Mode';
    }
  }
});
