/* Controllers */
netStatsApp.controller('StatsCtrl', function (
  $scope,
  $filter,
  $localStorage,
  socket,
  _,
  toastr,
  // keep them here, or they will not loaded
  moment,
  sparkline
) {

  var MAX_BINS = 40;

  // Main Stats init
  // ---------------

  $scope.frontierHash = '0x11bbe8db4e347b4e8c937c1c8370e4b5ed33adb3db69cbdb7a38e1e50b1b82fa';
  $scope.nodesTotal = 0;
  $scope.nodesActive = 0;
  $scope.bestBlock = 0;
  $scope.lastBlock = 0;
  $scope.lastDifficulty = 0;
  $scope.upTimeTotal = 0;
  $scope.avgBlockTime = 0;
  $scope.blockPropagationAvg = 0;
  $scope.avgHashrate = 0;
  $scope.bestStats = {};

  $scope.lastGasLimit = _.fill(Array(MAX_BINS), 2);
  $scope.lastBlocksTime = _.fill(Array(MAX_BINS), 2);
  $scope.difficultyChart = _.fill(Array(MAX_BINS), 2);
  $scope.transactionDensity = _.fill(Array(MAX_BINS), 2);
  $scope.gasSpending = _.fill(Array(MAX_BINS), 2);
  $scope.miners = [];
  $scope.validators = {
    elected: 0,
    registered: 0
  };
  $scope.nodes = [];
  $scope.map = [];
  $scope.blockPropagationChart = [];
  $scope.coinbases = [];
  $scope.latency = 0;
  $scope.currentApiVersion = '0.1.1';

  $scope.originalPredicate = [
    '-pinned',
    '!stats.active'
  ];

  $scope.predicate = $localStorage.predicate || $scope.originalPredicate;
  $scope.reverse = $localStorage.reverse || false;
  $scope.pinned = $localStorage.pinned || [];
  $scope.prefixPredicate = [
    '-pinned'
  ];

  $scope.orderTable = function (predicate, reverse) {
    if (!_.isEqual(predicate, $scope.originalPredicate)) {
      $scope.reverse = reverse;
      $scope.originalPredicate = predicate;
      $scope.predicate = _.union($scope.prefixPredicate, predicate);
    } else {
      $scope.reverse = !$scope.reverse;

      if ($scope.reverse === true) {
        _.forEach(predicate, function (value, key) {
          predicate[key] = (value[0] === '-' ? value.replace('-', '') : '-' + value);
        });
      }

      $scope.predicate = _.union($scope.prefixPredicate, predicate);
    }

    $localStorage.predicate = $scope.predicate;
    $localStorage.reverse = $scope.reverse;
  };

  $scope.pinNode = function (id) {
    var index = findIndex({ id: id });
    var node = $scope.nodes[index];

    if (!_.isUndefined(node)) {
      node.pinned = !node.pinned;

      if (node.pinned) {
        $scope.pinned.push(id);
      } else {
        $scope.pinned.splice($scope.pinned.indexOf(id), 1);
      }
    }

    $localStorage.pinned = $scope.pinned;
  };

  $scope.getNumber = function (num) {
    return new Array(num);
  };

  // Socket listeners
  // ----------------
  socket
    .on('connect', function open () {
      socket.emit('ready');
      console.log('The connection has been opened.');
    })
    .on('end', function end () {
      console.log('Socket connection ended.');
    })
    .on('error', function error (err) {
      console.log(err);
    })
    .on('reconnecting', function reconnecting (opts) {
      console.log('We are scheduling a reconnect operation', opts);
    })
    .on('b', function (data) {
      socketAction(data.action, data.data);
    })
    .on('init', function (data) {
      socketAction('init', data);
    })
    .on('charts', function (data) {
      socketAction('charts', data);
    })
    .on('client-latency', function (data) {
      $scope.latency = data.latency;
    });

  setInterval(function () {
    $scope.$apply();
  }, 750);

  function handleInit (data) {
    $scope.nodes = data;
    _.forEach($scope.nodes, function (node) {

      // Init hashrate
      if (_.isUndefined(node.stats.hashrate))
        node.stats.hashrate = 0;

      // Init latency
      latencyFilter(node);

      // Init history
      if (_.isUndefined(data.history)) {
        data.history = new Array(40);
        _.fill(data.history, -1);
      }

      // Init or recover pin
      node.pinned = ($scope.pinned.indexOf(node.id) >= 0);
    });

    if ($scope.nodes.length > 0) {
      toastr['success']('Got nodes list', 'Got nodes!');

      updateActiveNodes();
    }
  }

  function handleUpdate (data) {
    var index = findIndex({ id: data.id });
    var node = $scope.nodes[index];

    if (
      index >= 0 &&
      !_.isUndefined(node) &&
      !_.isUndefined(node.stats)
    ) {
      if (!_.isUndefined(node.stats.latency))
        data.stats.latency = node.stats.latency;

      if (_.isUndefined(data.stats.hashrate))
        data.stats.hashrate = 0;

      if (node.stats.block.number < data.stats.block.number) {
        var best = _.maxBy($scope.nodes, function (node) {
          return parseInt(node.stats.block.number);
        }).stats.block;

        if (data.stats.block.number > best.number) {
          data.stats.block.arrived = _.now();
        } else {
          data.stats.block.arrived = best.arrived;
        }
        node.history = data.history;
      }

      node.stats = data.stats;

      if (
        !_.isUndefined(data.stats.latency) &&
        _.get(node, 'stats.latency', 0) !== data.stats.latency
      ) {
        node.stats.latency = data.stats.latency;

        latencyFilter(node);
      }

      updateBestBlock();
    }
  }

  function handleBlock (data) {
    var index = findIndex({ id: data.id });
    var node = $scope.nodes[index];

    if (
      index >= 0 &&
      !_.isUndefined(node) &&
      !_.isUndefined(node.stats)
    ) {
      if (node.stats.block.number < data.block.number) {
        var best = _.maxBy($scope.nodes, function (node) {
          return parseInt(node.stats.block.number);
        }).stats.block;

        if (data.block.number > best.number) {
          data.block.arrived = _.now();
        } else {
          data.block.arrived = best.arrived;
        }

        node.history = data.history;
      }

      node.stats.block = data.block;
      node.stats.propagationAvg = data.propagationAvg;

      if (data.block.validators.elected || data.block.registered) {
        $scope.validators = data.block.validators;
      }

      updateBestBlock();
    }
  }

  function handlePending (data) {
    var index = findIndex({ id: data.id });

    if (
      !_.isUndefined(data.id) &&
      index >= 0
    ) {
      var node = $scope.nodes[index];

      if (
        !_.isUndefined(node) &&
        !_.isUndefined(node.stats.pending) &&
        !_.isUndefined(data.pending)
      )
        node.stats.pending = data.pending;
    }
  }

  function handleStats (data) {
    var index = findIndex({ id: data.id });

    if (!_.isUndefined(data.id) && index >= 0) {
      var node = $scope.nodes[index];

      if (
        !_.isUndefined(node) &&
        !_.isUndefined(node.stats)
      ) {
        node.stats.active = data.stats.active;
        node.stats.mining = data.stats.mining;
        node.stats.hashrate = data.stats.hashrate;
        node.stats.peers = data.stats.peers;
        node.stats.gasPrice = data.stats.gasPrice;
        node.stats.uptime = data.stats.uptime;
        node.stats.address = data.stats.address;

        if (
          !_.isUndefined(data.stats.latency) &&
          _.get(node, 'stats.latency', 0) !== data.stats.latency
        ) {
          node.stats.latency = data.stats.latency;
        }

        latencyFilter(node);
        updateActiveNodes();
      }
    }
  }

  function handleInfo (data) {
    var index = findIndex({ id: data.id });

    if (index >= 0) {
      var node = $scope.nodes[index];
      node.info = data.info;

      if (_.isUndefined(node.pinned))
        node.pinned = false;

      // Init latency
      latencyFilter(node);

      updateActiveNodes();
    }
  }

  function handleBlockPropagationChart (data) {
    $scope.blockPropagationChart = data.histogram;
    $scope.blockPropagationAvg = data.avg;
  }

  function handleCharts (data) {
    if (!_.isEqual($scope.avgBlockTime, data.avgBlocktime))
      $scope.avgBlockTime = data.avgBlocktime;

    if (!_.isEqual($scope.avgHashrate, data.avgHashrate))
      $scope.avgHashrate = data.avgHashrate;

    if (!_.isEqual($scope.lastGasLimit, data.gasLimit) && data.gasLimit.length >= MAX_BINS)
      $scope.lastGasLimit = data.gasLimit;

    if (!_.isEqual($scope.lastBlocksTime, data.blocktime) && data.blocktime.length >= MAX_BINS)
      $scope.lastBlocksTime = data.blocktime;

    if (!_.isEqual($scope.difficultyChart, data.difficulty) && data.difficulty.length >= MAX_BINS)
      $scope.difficultyChart = data.difficulty;

    if (!_.isEqual($scope.blockPropagationChart, data.propagation.histogram)) {
      $scope.blockPropagationChart = data.propagation.histogram;
      $scope.blockPropagationAvg = data.propagation.avg;
    }

    if (!_.isEqual($scope.transactionDensity, data.transactions) && data.transactions.length >= MAX_BINS)
      $scope.transactionDensity = data.transactions;

    if (!_.isEqual($scope.gasSpending, data.gasSpending) && data.gasSpending.length >= MAX_BINS)
      $scope.gasSpending = data.gasSpending;

    if (!_.isEqual($scope.miners, data.miners)) {
      $scope.miners = data.miners;
    }
  }

  function handleInactive (data) {
    var index = findIndex({ id: data.id });

    if (index >= 0) {
      var node = $scope.nodes[index];
      if (!_.isUndefined(data.stats))
        node.stats = data.stats;

      latencyFilter(node);
      updateActiveNodes();
    }
  }

  function handleLatency (data) {
    if (
      !_.isUndefined(data.id) &&
      !_.isUndefined(data.latency)
    ) {
      var index = findIndex({ id: data.id });

      if (index >= 0) {
        var node = $scope.nodes[index];

        if (
          !_.isUndefined(node) &&
          !_.isUndefined(node.stats) &&
          !_.isUndefined(node.stats.latency) &&
          node.stats.latency !== data.latency
        ) {
          node.stats.latency = data.latency;
          latencyFilter(node);
        }
      }
    }
  }

  function handleClientPing (data) {
    socket.emit('client-pong', {
      serverTime: data.serverTime,
      clientTime: _.now()
    });
  }

  function socketAction (action, data) {
    // filter data
    data = xssFilter(data);

    switch (action) {
      case 'init':
        handleInit(data);
        break;

      // TODO: Remove when everybody updates api client to 0.0.12
      case 'update':
        handleUpdate(data);
        break;

      case 'block':
        handleBlock(data);
        break;

      case 'pending':
        handlePending(data);
        break;

      case 'stats':
        handleStats(data);
        break;

      case 'info':
        handleInfo(data);
        break;

      case 'blockPropagationChart':
        handleBlockPropagationChart(data);
        break;

      case 'charts':
        handleCharts(data);
        break;

      case 'inactive':
        handleInactive(data);
        break;

      case 'latency':
        handleLatency(data);
        break;

      case 'client-ping':
        handleClientPing(data);
        break;
    }
  }

  function findIndex (search) {
    return _.findIndex($scope.nodes, search);
  }

  function updateActiveNodes () {
    updateBestBlock();

    $scope.nodesTotal = $scope.nodes.length;

    $scope.nodesActive = _.filter($scope.nodes, function (node) {
      // forkFilter(node);
      return node.stats.active === true;
    }).length;

    $scope.upTimeTotal = _.reduce($scope.nodes, function (total, node) {
      return total + node.stats.uptime;
    }, 0) / $scope.nodes.length;
  }

  function updateBestBlock () {
    if ($scope.nodes.length) {
      var bestStats = _.maxBy($scope.nodes, function (node) {
        return parseInt(node.stats.block.number);
      }).stats;

      if (bestStats.block.number > $scope.bestBlock) {
        $scope.bestBlock = bestStats.block.number;
        $scope.bestStats = bestStats;

        $scope.lastBlock = $scope.bestStats.block.arrived;
        $scope.lastDifficulty = $scope.bestStats.block.difficulty;
      }
    }
  }
});
