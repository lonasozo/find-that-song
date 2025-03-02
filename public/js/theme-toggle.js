document.addEventListener('DOMContentLoaded', function () {
  // Check for saved theme preference or use system preference
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  // Apply theme based on saved preference or system preference
  if (savedTheme === 'light' || (!savedTheme && !prefersDark)) {
    document.documentElement.classList.add('light-theme');
    document.getElementById('theme-toggle').checked = true;
  }

  // Listen for toggle changes
  document.getElementById('theme-toggle').addEventListener('change', function (e) {
    if (e.target.checked) {
      // Light theme
      document.documentElement.classList.add('light-theme');
      document.documentElement.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    } else {
      // Dark theme
      document.documentElement.classList.add('dark-theme');
      document.documentElement.classList.remove('light-theme');
      localStorage.setItem('theme', 'dark');
    }
  });
});
