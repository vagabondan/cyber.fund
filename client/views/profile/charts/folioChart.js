var cfCDs = CF.CurrentData.selectors;

CF.UserAssets.graph = CF.UserAssets.graph || {};
CF.UserAssets.graph.minimalShare = 0.015;

function emptyPie(){
  if (CF.UserAssets.graph.folioPie) {
    CF.UserAssets.graph.folioPie.update({
      labels: [],
      series: []
    });
  }
}

Template['folioChart'].onRendered(function() {
  var self = this;

  self.autorun(function(comp) {
    var assets = Template.currentData() && Template.currentData().accountsData || {};
    if (_.isEmpty(assets)) {
      emptyPie();
      return;
    }

    var ticks = [],
      labels = [];

    systems = _.keys(assets);
    var r = CurrentData.find(cfCDs.system(systems));

    var data = r.fetch().sort(function(x, y) {
      var q1 = accounts[x._id] && accounts[x._id].quantity || 0,
        q2 = accounts[y._id] && accounts[y._id].quantity || 0;
      return Math.sign(q2 * CF.CurrentData.getPrice(y) - q1 * CF.CurrentData.getPrice(x)) || Math.sign(q2 - q1);
    });

    var sum = 0; // this to be used o determine if minor actives
    var datum = []; // let s calculate first and put calculations here
    var others = { // here be minor actives
      symbol: 'other',
      u: 0,
      b: 0,
      q: 0
    };

    console.log(data);
    _.each(data, function(system) {
      var asset = assets[system._id] || {};
      var point = {
        symbol: system._id,
        q: asset.quantity || 0,
        u: asset.vUsd || 0,
        b: asset.vBtc || 0,
      }

      datum.push(point);
      sum += point.b;
    });

    if (!sum) {
      emptyPie();
      return;
    }

    // push smalls into 'others'
    _.each(datum, function(point) {
      if (point.b / sum >= CF.UserAssets.graph.minimalShare) {
        labels.push(point.symbol);
        ticks.push({
          value: point.u,
          meta: 'N: ' + point.q.toFixed(4) + '; BTC: ' + point.b.toFixed(4) + '; USD: ' + point.u.toFixed(2)
        })
      } else {
        others.u += point.u;
        others.b += point.b;
      }
    });

    // if others, draw them too
    if (others.b && others.b > 0) {
      labels.push("OTHER");
      ticks.push({
        value: others.u,
        meta: 'other assets: BTC: ' + others.b.toFixed(4) + '; USD: ' + others.u.toFixed(2)
      })
    }

    if (ticks.length && self.$('.ct-chart.folio-pie').length)
      CF.UserAssets.graph.folioPie = // crutch
      new Chartist.Pie('.ct-chart.folio-pie', {
        labels: labels,
        series: ticks
      }, {
        chartPadding: CF.Chartist.options.chartPadding.folio,
        startAngle: 0,
        labelOffset: 82,
        labelDirection: 'explode'
      });
  })
});