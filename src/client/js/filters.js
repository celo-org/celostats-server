'use strict';

/* Filters */
angular.module('netStatsApp.filters', [])
  .filter('nodesActiveClass', function () {
    return function (active, total) {
      var ratio = active / total;

      if (ratio >= 0.9)
        return 'text-success';

      if (ratio >= 0.75)
        return 'text-info';

      if (ratio >= 0.5)
        return 'text-warning';

      return 'text-danger';
    };
  })
  .filter('nodePinClass', function () {
    return function (pinned) {
      if (pinned)
        return 'icon-check-o';

      return 'icon-loader';
    };
  })
  .filter('mainClass', function () {
    return function (node, bestBlock) {
      return mainClass(node, bestBlock);
    };
  })
  .filter('peerClass', function () {
    return function (peers, active) {
      return peerClass(peers, active);
    };
  })
  .filter('miningClass', function () {
    return function (mining, active) {
      if (!active)
        return 'text-gray';

      return (!mining ? 'text-danger' : 'text-success');
    };
  })
  .filter('miningIconClass', function () {
    return function (mining) {
      return (!mining ? 'icon-cancel' : 'icon-check');
    };
  })
  .filter('stakingClass', function () {
    return function (validatorData) {
      if (validatorData) {
        if (validatorData.elected)
          return 'text-success';
        if (validatorData.registered)
          return 'text-warning';
      }
      return 'text-info';
    };
  })
  .filter('hashrateFilter', ['$sce', '$filter', function ($sce, filter) {
    return function (hashes, isMining) {
      if (!isMining)
        return $sce.trustAsHtml('<i class="icon-cancel"></i>');

      var result = hashes;
      var units = ['', 'K', 'M', 'G', 'T', 'P', 'E'];
      var unit = 'K';

      for (var i = 1; result > 1000; i++) {
        result /= 1000;
        unit = units[i];
      }

      return $sce.trustAsHtml('<span class="small">' + filter('number')(result.toFixed(1)) + ' <span class="small-hash">' + unit + 'H/s</span></span>');
    };
  }])
  .filter('stakingFilter', ['$sce', '$filter', function ($sce, filter) {
    return function (validatorData) {
      if (validatorData) {
        if (validatorData.elected)
          return $sce.trustAsHtml('<i class="icon-check-o"></i>');
        if (validatorData.registered)
          return $sce.trustAsHtml('<i class="icon-check"></i>');
      }
      return $sce.trustAsHtml('<i class="icon-block"></i>');
    };
  }])
  .filter('stakingString', function () {
    return function (validatorData) {
      if (validatorData) {
        if (validatorData.elected)
          return 'Elected';
        if (validatorData.registered)
          return 'Registered';
      }
      return 'Full node';
    };
  })
  .filter('totalDifficultyFilter', function () {
    return function (hashes) {
      var result = hashes;
      var units = ['', 'K', 'M', 'G', 'T', 'P', 'E'];
      var unit = '';

      for (var i = 1; result > 1000; i++) {
        result /= 1000;
        unit = units[i];
      }

      return result.toFixed(2) + ' ' + unit + 'H';
    };
  })
  .filter('nodeVersion', function ($sce) {
    return function (version) {
      if (version) {
        var tmp = version.split('/');

        tmp[0] = tmp[0].replace('Ethereum(++)', 'Eth');

        if (tmp[0].indexOf('pyethapp') === 0) {
          tmp[0] = 'pyeth';
        }

        if (tmp[1] && tmp[1][0] !== 'v' && tmp[1][2] !== '.') {
          tmp.splice(1, 1);
        }

        if (tmp[2] && tmp[2] === 'Release') {
          tmp.splice(2, 1);
        }

        if (tmp[2] && tmp[2].indexOf('Linux') === 0)
          tmp[2] = 'linux';

        if (tmp[2] && tmp[2].indexOf('Darwin') === 0)
          tmp[2] = 'darwin';

        return $sce.trustAsHtml(tmp.join('/'));
      }

      return '';
    };
  })
  .filter('blockClass', function () {
    return function (current, best) {
      if (!current.active)
        return 'text-gray';

      return (best - current.block.number < 1 ? 'text-success' : (best - current.block.number === 1 ? 'text-warning' : (best - current.block.number > 1 && best - current.block.number < 4 ? 'text-orange' : 'text-danger')));
    };
  })
  .filter('gasPriceFilter', ['$filter', function (filter) {
    var numberFilter = filter('number');
    return function (price) {
      if (typeof price === 'undefined')
        return '0 wei';

      if (price.length < 4)
        return numberFilter(price) + ' wei';

      if (price.length < 7)
        return numberFilter(price / 1000) + ' kwei';

      if (price.length < 10)
        return numberFilter(price / 1000000) + ' mwei';

      if (price.length < 13)
        return numberFilter(price / 1000000000) + ' gwei';

      if (price.length < 16)
        return numberFilter(price / 1000000000000) + ' szabo';

      if (price.length < 19)
        return numberFilter(price.substr(0, price.length - 15)) + ' finney';

      return numberFilter(price.substr(0, price.length - 18)) + ' ether';
    };
  }])
  .filter('gasFilter', function () {
    return function (gas) {
      return (typeof gas !== 'undefined' ? parseInt(gas) : '?');
    };
  })
  .filter('hashFilter', ['$sce', '$filter', function ($sce, filter) {
    function hashFilter (hash, number) {
      if (typeof hash === 'undefined')
        return '?';

      if (hash.substr(0, 2) === '0x') {
        hash = hash.substr(2);
      }

      var hashStr = hash.substr(0, 8) + '..' + hash.substr(hash.length - 8);

      return $sce.trustAsHtml('' +
        '<a class="blockhash" href="' + blockscoutUrl + '/blocks/' + number + '" target="_blank">'
        + hashStr +
        '</a>');
    }

    hashFilter.$stateful = true;
    return hashFilter;
  }])
  .filter('blockNumberFilter', ['$sce', '$filter', function ($sce, filter) {
    return function (number) {
      if (typeof number === 'undefined')
        return '?';

      return $sce.trustAsHtml('' +
        '<a class="blockhash" href="' + blockscoutUrl + '/blocks/' + number + '" target="_blank">'
        + number +
        '</a>');
    };
  }])
  .filter('nameFilter', function () {
    return function (name) {
      if (typeof name === 'undefined')
        return '?';
      return name;
    };
  })
  .filter('addressFilter', ['$sce', '$filter', function ($sce, filter) {
    return function (address) {
      if (typeof address === 'undefined' || !address)
        return '';
      return $sce.trustAsHtml('' +
        '<a class="blockhash" href="' + blockscoutUrl + '/address/' + address + '" target="_blank">'
        + address.substr(2, 10) + '..' +
        '</a>');
    };
  }])
  .filter('longAddressFilter', ['$sce', '$filter', function ($sce, filter) {
    return function (address) {
      if (typeof address === 'undefined')
        return '?';

      if (address.substr(0, 2) === '0x')
        address = address.substr(2);

      return $sce.trustAsHtml('' +
        '<a class="blockhash" href="' + blockscoutUrl + '/address/' + address + '" target="_blank">'
        + address +
        '</a>');
    };
  }])
  .filter('minerHistoryFilter', ['$sce', '$filter', function ($sce, filter) {
    return function (miners, miner) {
      if (typeof miner === 'undefined')
        return '?';

      var htmlStr = '';
      for (var x = miners.length - 1; x >= 0; x--) {
        var isMinerClass = miners[x].miner === miner.miner ? 'bg-info' : 'border-gray';
        htmlStr = htmlStr +
          '<span class="block ' + isMinerClass + '"></span>';
      }
      return $sce.trustAsHtml(htmlStr);
    };
  }])
  .filter('timeClass', function () {
    return function (timestamp, active) {
      if (!active)
        return 'text-gray';

      return timeClass(timestamp);
    };
  })
  .filter('propagationTimeClass', function () {
    return function (stats, bestBlock) {
      if (!stats.active)
        return 'text-gray';

      if (stats.block.number < bestBlock)
        return 'text-gray';

      if (stats.block.propagation === 0)
        return 'text-info';

      if (stats.block.propagation < 1000)
        return 'text-success';

      if (stats.block.propagation < 3000)
        return 'text-warning';

      if (stats.block.propagation < 7000)
        return 'text-orange';

      return 'text-danger';
    };
  })
  .filter('propagationNodeAvgTimeClass', function () {
    return function (stats, bestBlock) {
      if (!stats.active)
        return 'text-gray';

      if (stats.block.number < bestBlock)
        return 'text-gray';

      if (stats.propagationAvg === 0)
        return 'text-info';

      if (stats.propagationAvg < 1000)
        return 'text-success';

      if (stats.propagationAvg < 3000)
        return 'text-warning';

      if (stats.propagationAvg < 7000)
        return 'text-orange';

      return 'text-danger';
    };
  })
  .filter('propagationAvgTimeClass', function () {
    return function (propagationAvg, active) {
      if (!active)
        return 'text-gray';

      if (propagationAvg === 0)
        return 'text-info';

      if (propagationAvg < 1000)
        return 'text-success';

      if (propagationAvg < 3000)
        return 'text-warning';

      if (propagationAvg < 7000)
        return 'text-orange';

      return 'text-danger';
    };
  })
  .filter('latencyFilter', function () {
    function latencyFilter (stats) {
      if (stats.active === false)
        return 'offline';
      else
        return stats.latency + ' ms';
    }

    latencyFilter.$stateful = true;
    return latencyFilter;
  })
  .filter('latencyClass', function () {
    return function (stats) {
      if (stats.active === false)
        return 'text-danger';

      if (stats.latency <= 100)
        return 'text-success';

      if (stats.latency <= 1000)
        return 'text-warning';

      return 'text-danger';
    };
  })
  .filter('blockTimeFilter', function () {
    var blockTimeFilter = function (timestamp) {
      if (timestamp === 0) {
        return '∞';
      }

      var diff = Math.floor((Date.now() - timestamp) / 1000);

      var result;

      if (diff < 60) {
        result = Math.round(diff) + ' s ago';
      } else {
        result = moment.duration(Math.round(diff), 's').humanize() + ' ago';
      }

      return result;
    };

    blockTimeFilter.$stateful = true;
    return blockTimeFilter;
  })
  .filter('networkHashrateFilter', ['$sce', '$filter', function ($sce, filter) {
    return function (hashes, isMining) {
      if (hashes === null)
        hashes = 0;

      var result = hashes;
      var units = ['', 'K', 'M', 'G', 'T', 'P'];
      var unit = 'K';

      for (var i = 1; result > 1000; i++) {
        result /= 1000;
        unit = units[i];
      }

      if (!isMining)
        return $sce.trustAsHtml(filter('number')(result.toFixed(1)) + ' <span class="small-hash">' + unit + 'H/s</span>');

      return $sce.trustAsHtml('? <span class="small-hash">' + unit + 'KH/s</span>');
    };
  }])
  .filter('blockPropagationFilter', function () {
    var blockPropagationFilter = function (ms, prefix) {
      if (typeof prefix === 'undefined')
        prefix = '+';

      var result = 0;

      if (ms < 1000) {
        return (ms === 0 ? '' : prefix) + ms + ' ms';
      }

      if (ms < 1000 * 60) {
        result = ms / 1000;
        return prefix + result.toFixed(1) + ' s';
      }

      if (ms < 1000 * 60 * 60) {
        result = ms / 1000 / 60;
        return prefix + Math.round(result) + ' min';
      }

      if (ms < 1000 * 60 * 60 * 24) {
        result = ms / 1000 / 60 / 60;
        return prefix + Math.round(result) + ' h';
      }

      result = ms / 1000 / 60 / 60 / 24;
      return prefix + Math.round(result) + ' days';
    };

    blockPropagationFilter.$stateful = true;

    return blockPropagationFilter;
  })
  .filter('blockPropagationAvgFilter', function () {
    return function (stats, bestBlock) {
      var ms = stats.propagationAvg;

      if (bestBlock - stats.block.number > 40)
        return '∞';
      //ms = _.now() - stats.block.received;

      var prefix = '';
      var result = 0;

      if (ms < 1000) {
        return (ms === 0 ? '' : prefix) + ms + ' ms';
      }

      if (ms < 1000 * 60) {
        result = ms / 1000;
        return prefix + result.toFixed(1) + ' s';
      }

      if (ms < 1000 * 60 * 60) {
        result = ms / 1000 / 60;
        return prefix + Math.round(result) + ' min';
      }

      if (ms < 1000 * 60 * 60 * 24) {
        result = ms / 1000 / 60 / 60;
        return prefix + Math.round(result) + ' h';
      }

      result = ms / 1000 / 60 / 60 / 24;
      return prefix + Math.round(result) + ' days';
    };
  })
  .filter('avgTimeFilter', function () {
    return function (time) {
      if (time < 60)
        return parseFloat(time).toFixed(2) + ' s';

      return moment.duration(Math.round(time), 's').humanize();
    };
  })
  .filter('avgTimeClass', function () {
    return function (time) {
      return blockTimeClass(time);
    };
  })
  .filter('blocksInEpochClass', function () {
    return function (blocks, epochSize) {
      return blockTimeClass(Math.round(40 * (1 - blocks / epochSize)));
    };
  })
  .filter('upTimeFilter', function () {
    return function (uptime) {
      return Math.round(uptime) + '%';
    };
  })
  .filter('upTimeClass', function () {
    return function (uptime, active) {
      if (!active)
        return 'text-gray';

      if (uptime >= 90)
        return 'text-success';

      if (uptime >= 75)
        return 'text-warning';

      return 'text-danger';
    };
  })
  .filter('geoTooltip', function () {
    return function (node) {
      var tooltip = [];
      var string = '';

      if (node.info.node) {
        var eth_version = node.info.node.split('/');

        if (eth_version[1]) {
          if (eth_version[1][0] !== 'v' && eth_version[1][2] !== '.') {
            eth_version.splice(1, 1);
          }

          string = '<b>' + node.info.node + '</b>';
          tooltip.push(string);

          string = 'Version: <b>' + (eth_version[1]) + '</b>';
          tooltip.push(string);
        }
      }

      if (node.info.net !== '') {
        string = 'Network: <b>' + (typeof node.info.net !== 'undefined' ? node.info.net : '-') + '</b>';

        tooltip.push(string);
      }

      if (node.info.protocol !== '') {
        string = 'Protocol: <b>' + (typeof node.info.protocol !== 'undefined' ? node.info.protocol : '-') + '</b>';

        tooltip.push(string);
      }

      if (node.info.port !== '') {
        string = 'Port: <b>' + (typeof node.info.port !== 'undefined' ? node.info.port : '30303') + '</b>';

        tooltip.push(string);
      }

      if (node.info.api !== '') {
        string = 'Web3: <b>' + node.info.api + '</b>';

        tooltip.push(string);
      }

      if (node.info.client !== '') {
        string = 'API: <b>' + (typeof node.info.client !== 'undefined' ? node.info.client : '<= 0.0.3') + '</b>';

        tooltip.push(string);
      }

      if (node.info.os !== '') {
        string = 'OS: <b>' + (typeof node.info.os !== 'undefined' ? node.info.os + ' ' + node.info.os_v : '?') + '</b>';

        tooltip.push(string);
      }

      if (node.info.contact !== '') {
        string = 'Contact: <b>' + (typeof node.info.contact !== 'undefined' ? node.info.contact : '-') + '</b>';

        tooltip.push(string);
      }

      return tooltip.join('<br>');
    };
  })
  .filter('bubbleClass', function () {
    return function (node, bestBlock) {
      return mainClass(node, bestBlock).replace('text-', '');
    };
  })
  .filter('minerNameFilter', function () {
    return function (address, name) {
      if (typeof name !== 'undefined' && name !== false && name.length > 0)
        return name;

      return address.replace('0x', '');
    };
  })
  .filter('minerBlocksClass', function () {
    return function (blocks, prefix) {
      if (typeof prefix === 'undefined')
        prefix = 'bg-';
      if (blocks <= 6)
        return prefix + 'success';

      if (blocks <= 12)
        return prefix + 'info';

      if (blocks <= 18)
        return prefix + 'warning';

      return prefix + 'danger';
    };
  })
  .filter('nodeClientClass', function () {
    return function (info, current) {
      if (typeof info === 'undefined' || typeof info.client === 'undefined' || typeof info.client === '')
        return 'text-danger';

      if (compareVersions(info.client, '<', current))
        return 'text-danger';

      return 'hidden';
    };
  })
  .filter('consensusClass', function () {
    return function (nodes, bestBlock) {
      var status = 'success';
      var now = _.now();

      for (var x = 0; x < nodes.length; x++) {
        if (nodes[x].stats.block.number === bestBlock.number && nodes[x].stats.block.hash !== bestBlock.hash)
          return 'danger';

        if ((bestBlock.number - nodes[x].stats.block.number) > 1 && (now - bestBlock.received) >= 20 * 1000)
          status = 'orange';

        if ((bestBlock.number - nodes[x].stats.block.number) === 1 && (now - bestBlock.received) >= 10 * 1000 && status !== 'orange')
          status = 'warning';
      }

      return status;
    };
  })
  .filter('consensusFilter', function () {
    return function (nodes, bestBlock) {
      var cnt = 0;

      for (var x = 0; x < nodes.length; x++) {
        if (nodes[x].stats.block.number === bestBlock.number && nodes[x].stats.block.hash === bestBlock.hash)
          cnt++;
      }

      return cnt + '/' + nodes.length;
    };
  });
