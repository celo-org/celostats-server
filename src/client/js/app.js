'use strict';

/* Init Angular App */

var netStatsApp = angular.module('netStatsApp', [
  'netStatsApp.filters',
  'netStatsApp.directives',
  'ngStorage'
]);

netStatsApp.run(function ($rootScope) {
  $rootScope.networkName = networkName || 'Ethereum';
  $rootScope.faviconPath = faviconPath || '/favicon-celo.ico';
});

/* Services */

netStatsApp.factory('socket', function ($rootScope) {
  // your url goes here
  var url = undefined;
  return io(url, {
    path: '/client',
    transports: ['websocket'],
    cookie: false,
    perMessageDeflate: true,
    httpCompression: true,
  });
});

netStatsApp.factory('toastr', function ($rootScope) {
  toastr = window.toastr;
  toastr.options = {
    'closeButton': false,
    'debug': false,
    'progressBar': false,
    'newestOnTop': true,
    'positionClass': 'toast-top-right',
    'preventDuplicates': false,
    'onclick': null,
    'showDuration': '300',
    'hideDuration': '1000',
    'timeOut': '5000',
    'extendedTimeOut': '1000',
    'showEasing': 'swing',
    'hideEasing': 'linear',
    'showMethod': 'fadeIn',
    'hideMethod': 'fadeOut'
  };
  return toastr;
});

netStatsApp.factory('_', function ($rootScope) {
  var lodash = window._;
  return lodash;
});

netStatsApp.factory('moment', function ($rootScope) {
  moment.relativeTimeThreshold('s', 60);
  moment.relativeTimeThreshold('m', 60);
  moment.relativeTimeThreshold('h', 24);
  moment.relativeTimeThreshold('d', 28);
  moment.relativeTimeThreshold('M', 12);

  return moment;
});

netStatsApp.factory('sparkline', function ($rootScope) {
  $('body')
    .on('mouseenter', '[data-toggle="tooltip"]', function (event) {
      $(this).tooltip('show');
    })
    .on('mouseleave', '[data-toggle="tooltip"]', function (event) {
      $(this).tooltip('hide');
    });

  $.fn.sparkline.defaults.bar.height = 63;
  $.fn.sparkline.defaults.bar.barWidth = 6;

  if ($('body').width() < 600) {
    $.fn.sparkline.defaults.bar.barWidth = 4;
  } else if ($('body').width() < 1200) {
    $.fn.sparkline.defaults.bar.barWidth = 5;
  }

  $.fn.sparkline.defaults.bar.barSpacing = 1;
  $.fn.sparkline.defaults.bar.tooltipClassname = 'jqstooltip';
  $.fn.sparkline.defaults.bar.tooltipOffsetX = 0;
  $.fn.sparkline.defaults.bar.tooltipFormat = $.spformat('<div class="tooltip-arrow"></div><div class="tooltip-inner">{{prefix}}{{value}} {{suffix}}</div>');
  $.fn.sparkline.defaults.bar.colorMap = $.range_map({
    '0:6': '#8be9fd',
    '6:15': '#50fa7b',
    '15:40': '#f1fa8c',
    '40:60': '#ffb86c',
    '60:': '#ff5555'
  });

  return $.fn.sparkline;
});

