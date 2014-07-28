var Popup = (function(my){

  var bg = chrome.extension.getBackgroundPage();
  var linkedinData = {};
  var settings = {};

  my.init = function() {
    window.addEventListener('load', showPopup, false);
  };

  function showPopup() {
    updateLinkedinData();
    var content = renderContent();
    $('body').html(content);
  }

  function updateLinkedinData() {
    linkedinData = bg.App.linkedinData;
  }

  function updateSettings() {
    
  }

  function renderContent() {
    return linkedinData.firstname + ' ' + linkedinData.lastname;
  }

  return my;

})(Popup || {});


Popup.init();