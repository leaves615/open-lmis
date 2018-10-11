services.factory('NosDrugsChartService', function ($http, $filter, $q, $timeout, messageService,
                                                   CubesGenerateUrlService, StockoutSingleProductZoneChartService,
                                                   CubesGenerateCutParamsService, ReportLocationConfigService,
                                                   ReportExportExcelService, DateFormatService, NosDrugStatusService,
                                                   WeeklyNosDrugExportService) {

  var DATE_FORMAT = 'yyyy,MM,dd';
  var drugCodeKey = "drug.drug_code";
  var drugNameKey = "drug.drug_name";
  var selectedDrugs = [];
  var chartDataItems;
  var allNosDrugs = [];

  function getNosDrugStockRateOnFriday(zone, friday, stockOuts, nosDrugCode, carryStartDates) {
    var stockOutsOfNosDrug = _.filter(stockOuts, function (stockOut) {
      return stockOut[drugCodeKey] === nosDrugCode;
    });
    var carryStartDatesOfNosDrug = _.filter(carryStartDates, function (carry) {
      return carry[drugCodeKey] === nosDrugCode;
    });

    return StockoutSingleProductZoneChartService.generateChartDataItemsForZone(zone, friday, friday, stockOutsOfNosDrug, carryStartDatesOfNosDrug)[0];
  }

  function getCubesRequestPromise(nosDrugs, province, district, userSelectedStartDate, userSelectedEndDate, cubesName, timeDimensionName) {
    var cutsParams = CubesGenerateCutParamsService.generateCutsParams(timeDimensionName,
      $filter('date')(userSelectedStartDate, "yyyy,MM,dd"),
      $filter('date')(userSelectedEndDate, "yyyy,MM,dd"),
      undefined, nosDrugs, province, district);

    var requestUrl = CubesGenerateUrlService.generateFactsUrl(cubesName, cutsParams);
    return $http.get(requestUrl);
  }

  function generateNosDrugDataItemForOneFriday(friday, nosDrugs, province, district, stockOuts, carryStartDates) {
    var chartDataItem = {date: friday};

    var totalPercentage = 0;
    _.forEach(nosDrugs, function (nosDrug) {
      var nosDrugCode = nosDrug[drugCodeKey];

      var fridayStockOutRate = getNosDrugStockRateOnFriday(ReportLocationConfigService.getZone(province, district), friday, stockOuts, nosDrugCode, carryStartDates);
      chartDataItem[nosDrugCode + "StockOutFacilities"] = fridayStockOutRate.stockOutFacilities;
      chartDataItem[nosDrugCode + "CarryingFacilities"] = fridayStockOutRate.carryingFacilities;
      chartDataItem[nosDrugCode] = 0;
      if (fridayStockOutRate.carryingFacilities.length > 0) {
        chartDataItem[nosDrugCode] = 100 - fridayStockOutRate.percentage;
      }

      totalPercentage += chartDataItem[nosDrugCode];
    });
    chartDataItem.average = (totalPercentage / nosDrugs.length).toFixed(0);

    return chartDataItem;
  }

  function LinkedNode() {
    var self = this;

    this.addToTail = function (elem) {
      if (self.next === undefined) {
        self.next = elem;
      } else {
        self.next.addToTail(elem);
      }
    };

    this.showSelfAndNext = function (isToggleOff, event) {
      $timeout(function () {
        if (isToggleOff) {
          event.chart.hideGraph(self.value);
        } else {
          event.chart.showGraph(self.value);
        }
        if (self.next !== undefined) {
          self.next.showSelfAndNext(isToggleOff, event);
        }
      });
    };
  }

  function toggleGraphsExclude(event, isToggleOff, excludes) {
    var firstLinkedNode = _.chain(event.chart.graphs)
      .filter(function (graph) {
        return _.every(excludes, function (exclude) {
          return graph.id != exclude;
        });
      })
      .reduce(function (node, graph) {
        var newNode = new LinkedNode();
        newNode.value = graph;

        node.addToTail(newNode);
        return node;
      }, new LinkedNode())
      .value().next;

    firstLinkedNode.showSelfAndNext(isToggleOff, event);
  }

  function generateNosDrugsChartDataItems(nosDrugs, stockOuts, carryStartDates, userSelectedStartDate, userSelectedEndDate, province, district) {
    var fridays = DateFormatService.getFridaysBetween(userSelectedStartDate, userSelectedEndDate);
    return _.chain(fridays)
      .map(function (friday) {
        return generateNosDrugDataItemForOneFriday(friday, nosDrugs, province, district, stockOuts, carryStartDates);
      }).value();
  }

  function makeNosDrugsChart(chartDivId, legendDivId, userSelectedStartDate, userSelectedEndDate, province, district) {
    selectedDrugs = [];
    $http.get('/cubesreports/cube/products/facts?cut=is_nos:true').success(function (nosDrugs) {
      allNosDrugs = nosDrugs;
      var stockOutPromise = getCubesRequestPromise(nosDrugs, province, district, userSelectedStartDate, userSelectedEndDate, "vw_stockouts", "overlapped_date");
      var carryStartDatesPromise = getCubesRequestPromise(nosDrugs, province, district, "", userSelectedEndDate, "vw_carry_start_dates", "carry_start");

      $q.all([stockOutPromise, carryStartDatesPromise]).then(function (arrayOfResults) {
        var stockOuts = arrayOfResults[0].data;
        var carryStartDates = arrayOfResults[1].data;
        chartDataItems = generateNosDrugsChartDataItems(nosDrugs, stockOuts, carryStartDates, userSelectedStartDate, userSelectedEndDate, province, district);

        renderNosDrugsChart(chartDivId, legendDivId, chartDataItems, nosDrugs);
      });
    });
    return true;
  }

  function makeNosDrugHistogram(chartDivId, province, district, userSelectedStartDate, userSelectedEndDate, selectedDrugCode) {
    var nosDrugItemsPromise = getNosDrugItemsPromise(province, district, userSelectedStartDate, userSelectedEndDate, selectedDrugCode);

    nosDrugItemsPromise.$promise.then(function (nosDrugItemsResponse) {
      var formattedNosDrugItems = formatNosDrugItems(nosDrugItemsResponse.data);

      renderNosDrugHistogram(chartDivId, formattedNosDrugItems);
    });

    return true;
  }

  function formatNosDrugItems(nosDrugItems) {
    return _.map(nosDrugItems, function (nosDrugItem) {
      var dateKey = Object.keys(nosDrugItem)[0];
      return {
        nosData: nosDrugItem,
        date: dateKey,
        lowStockPercentage: nosDrugItem[dateKey].lowStock.percentage === 0 ? null : nosDrugItem[dateKey].lowStock.percentage,
        overStockPercentage: nosDrugItem[dateKey].overStock.percentage === 0 ? null : nosDrugItem[dateKey].overStock.percentage,
        regularStockPercentage: nosDrugItem[dateKey].regularStock.percentage === 0 ? null : nosDrugItem[dateKey].regularStock.percentage,
        stockOutPercentage: nosDrugItem[dateKey].stockOut.percentage === 0 ? null : nosDrugItem[dateKey].stockOut.percentage
      };
    });
  }

  function getNosDrugItemsPromise(province, district, startTime, endTime, selectedDrugCode) {
    selectedDrugs = [];
    selectedDrugs.push(selectedDrugCode);
    var params = {
      province: province,
      district: district,
      startTime: $filter('date')(startTime, DATE_FORMAT),
      endTime: $filter('date')(endTime, DATE_FORMAT),
      selectedDrugs: selectedDrugs,
      reportType: "nosDrug"
    };

    return NosDrugStatusService.get(params);
  }

  function getNosDrugList() {
    return $http.get('/cubesreports/cube/products/facts?cut=is_nos:true').success(function (nosDrugs) {
      return nosDrugs;
    }).error(function () {
      return [];
    });
  }

  function generateGraphs(nosDrugs) {
    function stringToRGB(str) {
      var hash = 0;
      for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }

      var c = (hash & 0x00FFFFFF)
        .toString(16)
        .toUpperCase();

      return "#" + "00000".substring(0, 6 - c.length) + c;
    }

    function makeBalloon(nosDrugName, nosDrugcode) {
      return function (item, graph) {
        var percentage = item.dataContext[nosDrugcode];
        var stockOutFacilities = item.dataContext[nosDrugcode + "StockOutFacilities"];
        var carryingFacilities = item.dataContext[nosDrugcode + "CarryingFacilities"];
        var facilitiesWithStock = carryingFacilities.filter(function (a) {
          return !~this.indexOf(a);
        }, stockOutFacilities);
        var facilitiesWithStockNames = facilitiesWithStock.join(', ');

        var informationDrug = messageService.get('report.tracer.name') + ": " + nosDrugName + "[" + nosDrugcode + "]" + "<br>" +
          messageService.get('report.tracer.percentage') + ": " + percentage + "% <br>" +
          messageService.get('report.tracer.health.facility') + ": " + (carryingFacilities.length - stockOutFacilities.length) + "% <br>";

        if (!_.isEmpty(stockOutFacilities)) {
          var stockOutFacilitiesNames = stockOutFacilities.join(', ');
          informationDrug += "<span style='color:red;'>" + stockOutFacilitiesNames + "</span><br>";
        }

        informationDrug += facilitiesWithStockNames + "<br>";

        return informationDrug;
      };
    }

    var nosDrugGraphs = _.chain(nosDrugs)
      .sortBy(function (nosDrug) {
        return nosDrug[drugNameKey];
      })
      .map(function (nosDrug) {
        var nosDrugcode = nosDrug[drugCodeKey];
        var nosDrugName = nosDrug[drugNameKey];

        return {
          lineColor: stringToRGB(nosDrugcode + nosDrugName),
          bullet: "round",
          title: nosDrugName + "[" + nosDrugcode + "]",
          valueField: nosDrugcode,
          hidden: true,
          lineThickness: 2,
          balloonFunction: makeBalloon(nosDrugName, nosDrugcode)
        };
      }).value();

    nosDrugGraphs.unshift({
      id: "average",
      lineColor: "red",
      bullet: "round",
      title: messageService.get('report.tracer.average'),
      valueField: "average",
      dashLength: 3,
      lineThickness: 6,
      balloonText: messageService.get('report.tracer.average') + ": [[average]]%"
    });
    nosDrugGraphs.push({
      id: "all",
      title: messageService.get('report.tracer.all'),
      lineColor: "black",
      hidden: true,
      legendValueText: " ",
      legendPeriodValueText: " "
    });

    return nosDrugGraphs;
  }

  function renderNosDrugHistogram(chartDivId, nosDrugItems) {

    AmCharts.makeChart(chartDivId, {
        type: "serial",
        categoryField: "date",
        startDuration: 1,
        columnWidth: 0.5,
        categoryAxis: {
          gridPosition: "start"
        },
        zoomOutText: '',
        chartScrollbar: {
          enabled: true,
          graphType: "line",
          offset: 30,
          oppositeAxis: false,
          scrollbarHeight: 5,
          scrollDuration: 0
        },
        balloon: {
          textAlign: "left",
          "fixedPosition": false,
        },
        graphs: [
          {
            balloonFunction: generateBalloonInfo,
            fillAlphas: 1,
            title: "stockOut",
            type: "column",
            valueField: "stockOutPercentage",
            fillColors: "#f5212d",
            legendColor: "#f5212d",
          },
          {
            balloonFunction: generateBalloonInfo,
            fillAlphas: 1,
            id: "AmGraph-3",
            title: "lowStock",
            type: "column",
            valueField: "lowStockPercentage",
            fillColors: "#fad74d",
            legendColor: "#fad74d",
          },
          {
            balloonFunction: generateBalloonInfo,
            fillAlphas: 1,
            id: "AmGraph-4",
            title: "regularStock",
            type: "column",
            valueField: "regularStockPercentage",
            fillColors: "#4bba14",
            legendColor: "#4bba14",
          },
          {
            balloonFunction: generateBalloonInfo,
            fillAlphas: 1,
            title: "overStock",
            type: "column",
            valueField: "overStockPercentage",
            fillColors: "#6610c7",
            legendColor: "#6610c7",
          }
        ],
        valueAxes: [
          {
            axisFrequency: 4,
            baseValue: 2,
            id: "ValueAxis-1",
            maximum: 0,
            minMaxMultiplier: 0,
            stackType: "100%",
            unit: "%",
            offset: 1,
            titleColor: "#0000FF",
            color: "#999999",
            titleFontSize: 0
          }
        ],
        legend: {
          align: "center",
          textClickEnabled: true,
        },
        dataProvider: nosDrugItems
      }
    );
  }

  function generateBalloonInfo(e) {
    var drugContext = e.dataContext;
    var graph = e.graph;
    var originalNosDrugData = drugContext.nosData[drugContext.date];

    function generateFacilitiesName(facilities) {
      var names = '';
      return _.each(facilities, function (facility) {
        names += facility;
      });
    }

    return "Number Of Health Facility" + ": " + originalNosDrugData[graph.title].facilities.length + "<br>" +
      "Percentage: " + originalNosDrugData[graph.title].percentage +
      "<hr style='margin: 0'>" + generateFacilitiesName(originalNosDrugData[graph.title].facilities);
  }

  function renderNosDrugsChart(chartDivId, legendDivId, chartDataItems, nosDrugs) {
    var dateWeeklyString = messageService.get('report.tracer.week') + ' ' + 'W';

    function onInit(initEvent) {
      function legendHandler(toggleEvent) {
        if (toggleEvent.dataItem.id == 'all') {
          toggleGraphsExclude(toggleEvent, toggleEvent.dataItem.hidden, ['all', 'average']);
        }
      }

      initEvent.chart.legend.addListener('hideItem', legendHandler);
      initEvent.chart.legend.addListener('showItem', legendHandler);
    }

    AmCharts.makeChart(chartDivId, {
      "listeners": [{
        "event": "init",
        "method": onInit
      }],
      "type": "serial",
      "theme": "light",
      "legend": {
        divId: legendDivId,
        "listeners": [{
          "event": "hideItem",
          "method": handleLegendClick
        }, {
          "event": "showItem",
          "method": handleLegendClick
        }]
      },
      "dataProvider": chartDataItems,
      "valueAxes": [{
        "axisThickness": 2,
        "gridAlpha": 0,
        "axisAlpha": 1,
        "position": "left",
        maximum: 100,
        minimum: 0
      }],
      "graphs": generateGraphs(nosDrugs),
      balloon: {textAlign: "left", maxWidth: 300},
      "chartScrollbar": {
        "oppositeAxis": false,
        "offset": 30
      },
      "chartCursor": {
        "cursorPosition": "mouse",
        categoryBalloonDateFormat: dateWeeklyString + "(DD.MM.YYYY)"
      },
      "categoryField": "date",
      "categoryAxis": {
        "parseDates": true,
        "axisColor": "#DADADA",
        "minorGridEnabled": true,
        "dateFormats": [{
          period: 'DD',
          format: 'YYYY' + ' ' + dateWeeklyString
        }, {
          period: 'WW',
          format: 'YYYY' + ' ' + dateWeeklyString
        }, {
          period: 'MM',
          format: 'MM.YYYY'
        }, {
          period: 'YYYY',
          format: 'YYYY'
        }]
      }
    });
  }

  function handleLegendClick(evt) {
    if (evt.type === "hideItem") {
      _.uniq(selectedDrugs);
      var index = selectedDrugs.indexOf(evt.dataItem.valueField);
      if (index > -1) {
        selectedDrugs.splice(index, 1);
      }
    } else {
      selectedDrugs.push(evt.dataItem.valueField);
    }
  }

  function exportXLSX(startTime, endTime, province, district) {
    var allNosCodes = _.map(allNosDrugs, function (drug) {
      return drug['drug.drug_code'];
    });

    WeeklyNosDrugExportService.getDataForExport(selectedDrugs, province, district, startTime, endTime, allNosCodes);
  }

  return {
    generateGraphs: generateGraphs,
    generateNosDrugsChartDataItems: generateNosDrugsChartDataItems,
    makeNosDrugsChart: makeNosDrugsChart,
    exportXLSX: exportXLSX,
    getNosDrugList: getNosDrugList,
    makeNosDrugHistogram: makeNosDrugHistogram
  };
});