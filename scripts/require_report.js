define(function (require) {
  require('report');
  require('google_webapp_interface');
  require('date_time');
  require('create_element');
  require('clipboard_copy');

  document.addEventListener('DOMContentLoaded', app.init());
});