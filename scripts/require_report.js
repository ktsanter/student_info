define(function (require) {
  require('report');
  require('google_webapp_interface');

  document.addEventListener('DOMContentLoaded', app.init());
});