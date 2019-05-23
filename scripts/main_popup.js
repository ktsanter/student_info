define(function (require) {
  require('popup');
  require('deck');
  require('fuzzyinputcontrol');
  require('google_webapp_interface');

  document.addEventListener('DOMContentLoaded', app.init());
});