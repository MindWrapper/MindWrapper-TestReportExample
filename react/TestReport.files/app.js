var app = angular.module("TreeTestReportApp", ['treeGrid', 'ui.bootstrap', 'angular-clipboard'])
.directive('selectOnClick', ['$window', function ($window) {
    return {
        link: function (scope, element) {
            element.on('click', function () {
                var selection = $window.getSelection();
                var range = document.createRange();
                range.selectNodeContents(element[0]);
                selection.removeAllRanges();
                selection.addRange(range);
            });
        }
    };
}])
.directive('preEx', function () {
    return {
        restrict: 'E',
        replace: true,
        transclude: true,
        scope: {
            title: '@',
            text: '=',
            textArray: '=',
        },
        template: "<div compile=\"temp\"></div>",
        link: function (scope, elm, attrs, ctrl) {
            if (!scope.text && !scope.textArray) {
                console.log('No data was defined for the directive!');
                return;
            }

            var singleTextRowTemplate = "<div><div class=\"pre-ex-div\"><span>{{::title}}</span><button title=\"Copy to Clipboard\" type=\"button\" class=\"btn btn-default btn-xs pre-ex-button\" clipboard text=\"value\" on-copied=\"success()\" on-error=\"fail(err)\"><span class=\"glyphicon glyphicon-copy\"></span> Copy to Clipboard</button></div><pre title=\"\" class='pre-callstack'>{{::value}}</pre></div>";

            if(scope.text) {
            	scope.temp = singleTextRowTemplate;
            	scope.value = scope.text;
        	}

            else if(scope.textArray) {
            	if(scope.textArray.length === 1) {
            		scope.value = scope.textArray[0];
            		scope.temp = singleTextRowTemplate;
            	}
            	else {
            		scope.temp = "<div><p><span>{{::title}}</span></p><div ng-class=\"!$last ? 'pre-ex-div-default' : ''\" ng-repeat=\"text in ::value\"><div class=\"pre-ex-div\"><button title=\"Copy to Clipboard\" type=\"button\" class=\"btn btn-default btn-xs pre-ex-button-default\" clipboard text=\"::text\" on-copied=\"success()\" on-error=\"fail(err)\"><span class=\"glyphicon glyphicon-copy\"></span> Copy to Clipboard</button></div><pre title=\"\" class='pre-callstack'>{{::text}}</pre></div></div>";
            		scope.value = scope.textArray;
            	}
            }

            scope.success = function() {
                console.log('copied');
            }
            scope.fail = function () {
                console.log('copy failed');
            }
        }
    };
})
.directive('detailsWrapper', function () {
    return {
        restrict: 'E',
        replace: true,
        transclude: true,
        scope: {
            iconClass: '@'
        },
        template: "<div><table class=\"details-table\"><tr><td class=\"details-image-cell\"><i ng-class=\"::iconClass\"></i></td><td><div ng-transclude></div></td></tr></table></div>",
        link: function (scope, elm, attrs, ctrl) {
        }
    };
})
.controller("TreeController", function($scope, $timeout) {
	$scope.today = new Date();

	var data;
	if (document.getElementById("data").innerHTML.indexOf("{{DATA}}") > 0)
	{
		data = JSON.parse(document.getElementById("test_data").innerHTML);
	}
	else
	{
		data = JSON.parse(document.getElementById("data").innerHTML);
	}
	$scope.expand_to = {};
	$scope.row_filter = {filtered: false};

	$scope.search = '';
	$scope.clearSearch = function(){
		$scope.search = '';
		var searchElement = document.getElementById("search");
		if(searchElement)
			searchElement.focus();
	};

	$scope.filter = {};
	$scope.filter.info = {value: false, type: 'Info'};
	$scope.filter.warning = {value: false, type: 'Warning'};
	$scope.filter.error = {value: true, type: 'Error'};
	

	$scope.filters = ['Info', 'InfoPartial', 'Warning'];

	$scope.filterSelected = function(model){
		if(!model.value) {
			$scope.filters.push(model.type);
		}
		else {
			var index = $scope.filters.indexOf(model.type);
			if(index !== -1)
				$scope.filters.splice(index, 1);
		}
	}

	$scope.additionalFilter = {
		filterPropertyKey: 'type',
		filterPropertyValue: 'TestStatus',
		filterAttribute: 'state',
		filterAttributeValues: ['1', '2', '3', '4', '7'],
	};


	$scope.testStatusFilter = {};
	$scope.testStatusFilter.ignored = {selected: false, values: ['1', '2', '3', '7']}; // NotRunnable = 1, Skipped = 2, Ignored = 3, Cancelled = 7
	$scope.testStatusFilter.passed = {selected: false, values: ['4']};
	$scope.testStatusFilter.failed = {selected: true, values: ['5','6']}; // Failure = 5, Error = 6
	$scope.testStatusFilter.inconclusive = { selected: true, values: ['0'] };

	$scope.testStatusFilterChanged = function(model){
		if(!model.selected) {
			for(var i=0; i<model.values.length; i++) {
				$scope.additionalFilter.filterAttributeValues.push(model.values[i]);
			}
		}
		else {
			for(var i=0; i<model.values.length; i++) {
				var index = $scope.additionalFilter.filterAttributeValues.indexOf(model.values[i]);
				if(index !== -1)
					$scope.additionalFilter.filterAttributeValues.splice(index, 1);
			}
		}
	}

	$scope.my_tree = {};

	$scope.tree_data = [
		data
	];

	$scope.summary = {};
	$scope.summary = data != null && data.type === "TestSession" && data.summary != null ? data.summary : undefined;

	// $scope.convertTestStateToString = function(state) {
	// 	switch(state)
	// 		{
	// 			case 5:
	// 				return "Failure";
	// 			case 6:
	// 				return "Error";
	// 			case 1:
	// 				return "NotRunnable";
	// 			case 2:
	// 				return "Skipped";
	// 			case 3:
	// 				return "Ignored";
	// 			case 7:
	// 				return "Cancelled";
	// 			case 0:
	// 				return "Inconclusive";
	// 			case 4:
	// 				return "Passed";
	// 		}
	// }

	$scope.onExpandTo = function(branch){
	    return (typeof branch['summary'] !== 'undefined' && "successConclusion" in branch['summary']) || branch['rootCause'];
	}

	$scope.getIconByTestState = function(state) {
		switch(state)
			{
				case 5:
				case 6:
					return "glyphicon glyphicon-minus-sign icon-red";
				case 1:
				case 2:
				case 3:
				case 7:
					return "glyphicon glyphicon-question-sign icon-gray";
				case 0:
					return "glyphicon glyphicon-exclamation-sign icon-yellow";
				case 4:
					return "glyphicon glyphicon-ok-sign icon-green";
			}
	}

	$scope.onLeafNodeCreate = function(branch){
		var type = branch['type'];
		if(type === 'TestStatus') {
			return $scope.getIconByTestState(branch['state']) + " leaf-icon";
			//return branch['state'] === 5 || branch['state'] === 6 ? "glyphicon glyphicon-remove-sign icon-red" : "glyphicon glyphicon-ok-sign icon-green";
		}

		if(type === 'Info' || type === 'InfoPartial') {
			return "glyphicon glyphicon-file icon-blue leaf-icon";
		}

		if(type === 'Warning') {
			return "glyphicon glyphicon-file icon-yellow leaf-icon";
		}

		if(type === 'Error') {
			return "glyphicon glyphicon-file icon-red leaf-icon";
		}

		if(type === 'TestPlan') {
			return "glyphicon glyphicon-list-alt icon-black leaf-icon";
		}

		if(type === 'AssemblyCompilationErrors') {
			return "glyphicon glyphicon-remove-sign icon-red leaf-icon";
		}

		return "glyphicon glyphicon-file leaf-icon";
	}

	$scope.details_defs = {
		default: useTemplate('Default.details.template.html'),
		ArtifactPublish: "<div><pre class='pre-callstack'>{{::row.branch['destination']}}</pre></div>",
		ProcessInfo: useTemplate('ProcessInfo.details.template.html'),
		TestGroup: useTemplate('TestGroup.details.template.html'),
		TestPlan: useTemplate('TestPlan.details.template.html'),
		TestSuite: useTemplate('TestSuite.details.template.html'),
		TestStatus: useTemplate('TestStatus.details.template.html'),
		AssemblyCompilationErrors: useTemplate('AssermblyCompilationErrors.details.template.html'),
		TestSession: useTemplate('TestSession.details.template.html'),
		Action: useTemplate('Action.details.template.html')
	};

	$scope.expanding_property = {
		field: "type",
  		displayName: "Action",
  		cellCustomTemplate:
  		{
  		 		ArtifactPublish: "<div class=\"clipped\">{{::row.branch['destination']}}</div>",
  		 		ProcessInfo: "<div class=\"clipped\">{{::row.branch['path']}}</div>",
				TestPlan:  "<div ng-include src=\"'TestPlan.main.template.html'\">",
  		 		TestStatus: "<div class=\"clipped\">{{::row.branch['name']}}</div>",
  				TestSuite: useTemplate('TestSuite.main.template.html'),
				Info: "<div class=\"clipped\">{{::row.branch['message']}}</div>",
  		 		Warning: "<div class=\"clipped\">{{::row.branch['message']}}</div>",
  		 		Error: "<div class=\"clipped\">{{::row.branch['message']}}</div>",
  		 		InfoPartial: "<div class=\"clipped\">{{::row.branch['message']}}</div>",
  		 		AssemblyCompilationErrors: "<div class=\"clipped\">Assembly compilation failed: {{::row.branch['assembly']}}</div>",
				TestSession: useTemplate('TestSession.main.template.html'),
				TestGroup: useTemplate('TestGroup.main.template.html'),
  		 		default: useTemplate('Default.main.template.html'),
  		 },
  		filterable: true,
  		width: "77%"
	}

	$scope.col_defs = [
  		{
  			displayName: "Artifacts",
    		cellCustomTemplate: {
  				default: "<div ng-if=\"row.branch['artifacts'].length > 0\"><i class=\"glyphicon glyphicon-paperclip icon-black\"></i> {{::row.branch['artifacts'].length}}</div>"
  			},
  			width: "5%"
  		},
  		{
  			field: "duration",
  			displayName: "Duration",
  			width: "8%",
  			cellCustomTemplate: {
  				default: "<div>{{::row.branch['durationMicroseconds'] ? (row.branch['durationMicroseconds']/1000).toHHMMSS() : (row.branch['duration']).toHHMMSS()}}</div>"
  			},
  			class: "text-right",
  		},
		];
})
.run(function($rootScope) {
    $rootScope.formatCommandLine = function (cmdParams) {
		if(cmdParams == null || cmdParams.length === 0) {
			return "";
		}

		var cmdLine = "perl utr.pl ";
		for(var i=0; i<cmdParams.length; i++) {
			cmdLine += cmdParams[i] + " ";
		}
		return cmdLine;
	};

	$rootScope.formatDefaultMessage = function(msg){
		return JSON.stringify(msg,null, 2);
	}

	$rootScope.convertTestStateToString = function(state) {
		switch(state)
			{
				case 5:
					return "Failure";
				case 6:
					return "Error";
				case 1:
					return "NotRunnable";
				case 2:
					return "Skipped";
				case 3:
					return "Ignored";
				case 7:
					return "Cancelled";
				case 0:
					return "Inconclusive";
				case 4:
					return "Passed";
			}
	}
});

Number.prototype.toHHMMSS = function () {
    sec_num = this / 1000;
    if(sec_num < 0.0005)
    	return "0";

    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds.toFixed(3);} else {seconds = seconds.toFixed(3);}
    return hours+':'+minutes+':'+seconds;
};

function useTemplate(templateName) {
	return "<div ng-include src=\"'" + templateName +"'\"></div>";
}