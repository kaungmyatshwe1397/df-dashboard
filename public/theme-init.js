// Apply the saved appearance before hydration so the page does not flash the default theme.
(function () {
  var theme = "dark";
  try {
    if (localStorage.getItem("dc-fms-theme") === "light") theme = "light";
  } catch {
    // Blocked browser storage keeps the same default as ThemeProvider.
  }
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle("dark", theme === "dark");
})();
