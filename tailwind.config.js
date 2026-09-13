module.exports = {
  content: [
    './index.html',
    './js/**/*.js',
    './website/**/*.html'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#005c55',
        'primary-light': '#f0fdfa',
        'primary-container': '#0f766e',
        'on-primary': '#ffffff',
        secondary: '#0284c7',
        'secondary-light': '#cce5ff',
        tertiary: '#7f4025',
        background: '#f8f9ff',
        surface: '#ffffff',
        'surface-variant': '#d3e4fe',
        outline: '#6e7977',
        error: '#ba1a1a',
        success: '#166534',
        warning: '#92400e',
        info: '#0f766e'
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
