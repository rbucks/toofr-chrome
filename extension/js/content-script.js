var Linkedin = (function(my){

  my.result = {
    firstname: '',
    lastname: '',
    company: ''
  }

  my.init = function() {
    window.addEventListener('DOMContentLoaded', my.getData, false);
  }

  my.getData = function() {
    var fullname = document.querySelector(".full-name");

    if (!fullname) {
      console.log('Name not found');
      return;
    }

    fullname = fullname.textContent || '';
    var matches = fullname.match(/(\w+)\s+(.*)/);

    if (!matches) {
      console.log('Bad name: ' + fullname);
    }
    my.result.firstname = matches[1];
    my.result.lastname = matches[2];

    var company = document.querySelector("#overview-summary-current td li a");
    if (company) my.result.company = company.textContent || '';
    else {
      my.result.company = getCurrentCompanyFromExperienceSection();
    }
    my.sendResult();
  };


  var getCurrentCompanyFromExperienceSection = function(){
    var items = document.querySelectorAll('#background-experience .section-item');
    var company = '';
    for (var i = 0, len = items.length; i < len; i++) {
      var item = items[i];
      var dates = item.querySelector('.experience-date-locale');
      if (dates) dates = dates.textContent;
      if (dates.match(/Present/)) {
        company = item.querySelector('header h5 span a[href^="/company"]');
        if (company) company = company.textContent;
        else company = '';
        break;
      }
    }
    return company;
  };


  my.sendResult = function() {
    console.log('Sending results...');
    console.log(my.result);
    chrome.runtime.sendMessage({type: "name", data: my.result}, function(response) {
      console.log(response);
    });
  }

  return my;

})(Linkedin || {});


Linkedin.init();
