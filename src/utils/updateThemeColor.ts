export function updateThemeColor(theme: 'dark' | 'light'): void {
  const themeColor = theme === 'dark' ? '#217BE5' : '#18181b';
  let meta = document.querySelector('meta[name="theme-color"]');

  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }

  meta.setAttribute('content', themeColor);
}
