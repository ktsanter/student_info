define(function (require) {
  require('popup');
  require('deck');
  require('fuzzyinputcontrol');
  require('google_webapp_interface');
  require('date_time');
  require('create_element');
  require('clipboard_copy');

  document.addEventListener('DOMContentLoaded', app.init());
});