YUIDataTableFormatters = {
	//define a formatter for URL for cases
	formatCaseUrl: function(elCell, oRecord, oColumn, oData) {
		if(oRecord.getData().url.length > 0) {
			elCell.innerHTML = "<a href=\""+oRecord.getData().url+"\">" + oRecord.getData().case_number_formatted + "</a>";			 
		} else {
			elCell.innerHTML = oRecord.getData().case_number_formatted;
		}
	},
	//define a formatter for URL for devices
	formatUrlOnThis: function(elCell, oRecord, oColumn, oData) {
		elCell.innerHTML = "<a href=\""+oRecord.getData().url+"\">" + oData + "</a>";
	},
	//define a formatter for URL for devices
	formatUrlOnName: function(elCell, oRecord, oColumn, oData) {
		elCell.innerHTML = "<a href=\""+oRecord.getData().url+"\">" + oRecord.getData().name + "</a>";
	},
	// Expects a JavaScript Date instance as sData and will format that to something like "04/09/2008"
	format_date_mm_dd_yyyy_hh_mn: function(elCell, oRecord, oColumn, sData) {
		// TODO : figure out a better method to discover if the parsed date is 'Invalid'
		if (!sData.getYear || sData === '' || isNaN(sData.getYear())) {
			elCell.innerHTML = 'No Date Available';
		} else {
			var mm = (sData.getMonth() + 1).toPaddedString(2);
			var dd = sData.getDate().toPaddedString(2);
			var yyyy = sData.getFullYear();
			var hh = sData.getHours();
			var mn = sData.getMinutes();

			elCell.innerHTML = mm + '/' + dd + '/' + yyyy + ' ' + hh + ':' + mn;
		}
	},
	// Expects a JavaScript Date instance as sData and will format that to something like "04/09/2008"
	format_date_mm_dd_yyyy: function(elCell, oRecord, oColumn, sData) {
		// TODO : figure out a better method to discover if the parsed date is 'Invalid'
		if (!sData.getYear || sData === '' || isNaN(sData.getYear())) {
			elCell.innerHTML =	'No Date Available';
		} else {
			var mm = (sData.getMonth() + 1).toPaddedString(2);
			var dd = sData.getDate().toPaddedString(2);
			var yyyy = sData.getFullYear();
			
			elCell.innerHTML =	mm + '/' + dd + '/' + yyyy;
		}
	},
	//define a formatter for a link to the Printed Prescription page
	formatPrintedPrescriptionUrl: function(elCell, oRecord, oColumn, sData) {
		elCell.innerHTML = "<a href=\""+oRecord.getData('printed_prescription_url')+"\">View Printed Prescription</a>";
	},
	formatDuplicatedFromCaseUrl: function(elCell, oRecord, oColumn, sData) {
		if (sData.blank()) {
			elCell.innerHTML = "(Not duplicated from any case)";
		} else {
			elCell.innerHTML = "<a href=\""+oRecord.getData("duplicated_from_case_url")+"\">" + oRecord.getData("duplicated_from_case_formatted") + "</a>";
		}
	},
	removeCaseButton: function(elCell, oRecord, oColumn, sData) {
		var inner_html = '<img src="/images/delete.gif">';

		elCell.innerHTML = inner_html;

		var case_number = oRecord.getData('case_number');
		var input_elements = $(elCell).select('img');
		input_elements[0].observe('click', function(event) {
			// delete the case from this test
			new Ajax.Request('/cases/remove_case_from_experiment/' + case_number, 
				{
					onSuccess: function(transport) {
						// YAHOO.cm4.experiment_editor_cases_data_table.refresh_from_server(); // TODO : reload the datatable
						window.location.reload();
					},
					onFailure: function(transport) {
						update_error_flash([transport.responseJSON.code, transport.responseJSON.message]);
					}
				}
			);
		});
	},
	lastSeenAndDelete: function(elCell, oRecord, oColumn, sData) {
		var inner_html = oRecord.getData().last_seen_at;
		var remove_pending_url = oRecord.getData().remove_pending_url;
		inner_html += '<img src="/images/delete.gif">';
		
		elCell.innerHTML = inner_html;
		
		var guid = oRecord.getData('guid');
		var input_elements = $(elCell).select('img');
		input_elements[0].observe('click', function(event) {
			var answer = confirm("Are you sure? This will delete the pending update from the device "+oRecord.getData().cart_serial_number+".");
			if (answer) {
				// delete the case from this test
				new Ajax.Request(remove_pending_url, 
					{
						onSuccess: function(transport) {
							// YAHOO.cm4.pendInitialData.refresh_from_server(); // TODO : reload the datatable
							window.location.reload();
						},
						onFailure: function(transport) {
							update_error_flash([transport.responseJSON.code, transport.responseJSON.message]);
						}
					}
				);
			}
			
		});
	},
	lastSeenAndDeleteCompleted: function(elCell, oRecord, oColumn, sData) {
		var inner_html = oRecord.getData().last_seen_at;
		var remove_completed_url = oRecord.getData().remove_completed_url;
		inner_html += '<img src="/images/delete.gif">';
		
		elCell.innerHTML = inner_html;
		
		var guid = oRecord.getData('guid');
		var input_elements = $(elCell).select('img');
		input_elements[0].observe('click', function(event) {
			var answer = confirm("Are you sure? This will delete the completed update from the device "+oRecord.getData().cart_serial_number+".");
			if (answer) {
				// delete the case from this test
				new Ajax.Request(remove_completed_url, 
					{
						onSuccess: function(transport) {
							// YAHOO.cm4.pendInitialData.refresh_from_server(); // TODO : reload the datatable
							window.location.reload();
						},
						onFailure: function(transport) {
							update_error_flash([transport.responseJSON.code, transport.responseJSON.message]);
						}
					}
				);
			}
			
		});
	}
};

YUIDataTableSorters = {
	// Sort the case's state field by the index returned in the state_index hidden column
	sort_case_number: function(a, b, desc) { 
		var comp = YAHOO.util.Sort.compare;
		
		var a_case_number = a.getData('case_number');
		var b_case_number = b.getData('case_number');
		
		if (typeof a_case_number == 'undefined' || typeof b_case_number == 'undefined') { 
			alert("Error: Missing the hidden column 'case_number' needed to sort by Case number");
			// NOTE : this haults the rest of the sort calls from happening
			throw new Error("Missing the hidden column 'case_number' needed to sort by Case number");
		}
		
		var compState = comp(a_case_number, b_case_number, desc);
		return compState;
	},
	sort_case_state: function(a, b, desc) { 
		var comp = YAHOO.util.Sort.compare;
		
		var a_state_index = a.getData('state_index');
		var b_state_index = b.getData('state_index');
		
		if (typeof a_state_index == 'undefined' || typeof b_state_index == 'undefined') { 
			alert("Error: Missing the hidden column 'state_index' needed to sort by Case state");
			// NOTE : this haults the rest of the sort calls from happening
			throw new Error("Missing the hidden column 'state_index' needed to sort by Case state");
		}
		
		var compState = comp(a_state_index, b_state_index, desc);
		return compState;
	},
	sort_positive_integers_with_NA: function(col_to_use){
		return function(a, b, desc) { 
			var comp = YAHOO.util.Sort.compare;
			
			var a_val = a.getData(col_to_use);
			var b_val = b.getData(col_to_use);
			
			if("string" == typeof(a_val)){
				a_val = -1;
			}
			if("string" == typeof(b_val)){
				b_val = -1;
			}
						
			var compState = comp(a_val, b_val, desc);
			return compState;
		};
	}
};





//This is probably the most complicated and difficult to follow of the YUI element wrappers I have written so far
//It reaaaaallyy needs some unit tests
YUIDataTableWrapper = Class.create({
	dataTable: null,
	dataTableName: null,
	initialDataOrderKey: false,
	initialDataOrderDirection: "asc",
	defaultSortColumnName: null,
	searchString: null,
	
	
	getCurrentDataTableSort: function() {
		var to_return = {
			column_name : this.defaultSortColumnName,
			direction		: this.initialDataOrderDirection
		};
		
		if (this.dataTable) {
			var oCurrentState = this.dataTable.getState();
			to_return['column_name'] = oCurrentState.sortedBy.key;
			to_return['direction'] = (oCurrentState.sortedBy.dir === YAHOO.widget.DataTable.CLASS_DESC) ? "desc" : "asc";
		}
		
		return to_return;
	},
	
	doneLoadingCallback: function(){
		//do nothing
	},
	
	doOnLoad: function(thing_to_do){
		if(this.dataTable)
		{			 
			thing_to_do(this.dataTable);
		}
		else
		{
			//chain callbacks
			prevCallback = this.doneLoadingCallback;
			this.doneLoadingCallback = function(){
				prevCallback();
				thing_to_do(this.dataTable);
			}.bind(this);
		}
	},
	
	// function to generate a query string for the DataSource.	Also used
	// as the state indicator for the History Manager
	generateStateString: function (limit, start, key, dir, oExtraArgs) {
		oExtraArgs = oExtraArgs || {};
		oExtraArgs.search = oExtraArgs.search || (this.options.searchBoxID && $F(this.options.searchBoxID)) || this.options.initialSearchString;
		
		if (oExtraArgs.search && !oExtraArgs.search.blank()) { limit = 1000000; }
		limit = limit || this.options.recordsPerPage;
		
		var dt_sort_info = this.getCurrentDataTableSort();
		
		start = start || 0;
		key		= key || dt_sort_info['column_name'] || defaultSortColumnName;
		if (dir && (dir === YAHOO.widget.DataTable.CLASS_DESC || dir === YAHOO.widget.DataTable.CLASS_ASC)) {
			dir = (dir === YAHOO.widget.DataTable.CLASS_DESC) ? "desc" : "asc";
		} 
		else if (dt_sort_info['direction']) {
			dir = dt_sort_info['direction'];
		} 
		else {
			dir = 'asc';
		}
		
		var oBaseParams = { order_key: key, limit: limit, offset: start, order_dir: dir };
		var oToReturn = Object.extend(oExtraArgs, oBaseParams);
		oToReturn = Object.extend(oToReturn, this.additionalStateParamsFunction());
		var toReturn = Object.toQueryString(oToReturn);
		
		return toReturn;
	},
	
	// function to extract the key values from the state string and return them in an object/hash
	parseStateString: function (sState) {
		var parsed_string_state = sState.toQueryParams();
		
		var results		 = parsed_string_state.limit		 ? parseInt(parsed_string_state.limit, 10)	: this.options.recordsPerPage;
		var startIndex = parsed_string_state.offset		 ? parseInt(parsed_string_state.offset, 10) : 0;
		var sort			 = parsed_string_state.order_key ? parsed_string_state.order_key						: 'id';
		var dir				 = parsed_string_state.order_dir ? parsed_string_state.order_dir						: 'asc';
		var search		 = parsed_string_state.search		 ? parsed_string_state.search								: '';
		
		var result = {
			results		 : results,
			startIndex : startIndex,
			sort			 : sort,
			dir				 : dir,
			search		 : search,
			pagination : {
					rowsPerPage	 : results,
					recordOffset : startIndex
			}
		};
		
		return result;
	},
	
	additionalStateParamsFunction: function() {
		return {};
	},
	
	//This function will be called when the user uses the back button to go to a previous sort of search state of the datatable
	handleHistoryNavigation: function(request) {
		var oState = this.parseStateString(request);
		this.dataTable._oDataSource.sendRequest(request, this.createAjaxRequestCallbacks(oState));
	},
	
	createAjaxRequestCallbacks: function(oState) {
		return {
			success	 : this.dataTable.onDataReturnSetRows,
			failure	 : this.dataTable.onDataReturnSetRows,
			scope		 : this.dataTable,
			argument : oState // Pass along the new state to the callback
		};
	},
	
	goToNewState: function(sNewState) {
		if (this.getYuiHistoryObject()) {
			YAHOO.util.History.navigate(this.dataTableName, sNewState);
		}
		else {
			var oState = this.parseStateString(sNewState);
			this.dataTable._oDataSource.sendRequest(sNewState, this.createAjaxRequestCallbacks(oState));
		}
	},
	
	getYuiHistoryObject: function() {
		return (this.options.historyIframeID && this.options.historyInputFieldID) ? YAHOO.util.History : null;
	},
	
	commonDataTableSetup: function() {
		this.dataTable.setAttributeConfig("dataTableWrapperInstance", {value: this});

		if (this.options.dataSourceURL !== null) {
			this.dataTable.subscribe('initEvent', function() {
				var dataTableWrapperInstance = this.get("dataTableWrapperInstance");

				this._oDataSource = new YAHOO.util.XHRDataSource(dataTableWrapperInstance.options.dataSourceURL);
				this._oDataSource.connXhrMode = "cancelStaleRequests";
				this._oDataSource.responseSchema = dataTableWrapperInstance.options.responseSchema;
				// this._oDataSource.maxCacheEntries = 10;
			});
			
			// Dynamically pulls totalRecords value from each server response
			this.dataTable.handleDataReturnPayload = function(oRequest, oResponse, oPayload) {
				oPayload.totalRecords = oResponse.meta.totalRecords;
				var sortDir = (oResponse.meta.sortDir == "desc") ? YAHOO.widget.DataTable.CLASS_DESC : YAHOO.widget.DataTable.CLASS_ASC;
				
				oPayload.sortedBy = {key: oResponse.meta.sortKey, dir: sortDir};
				delete oPayload.sort;
				delete oPayload.dir;
				
				return oPayload;
			};
			
			// Intercepts built-in pagination and passes request off to the BHM
			this.dataTable.doBeforePaginatorChange = function(newPagState) {
				var oState = this.getState();
				var dataTableWrapperInstance = this.get("dataTableWrapperInstance");
			
				var sBookmark = dataTableWrapperInstance.generateStateString(
						newPagState.rowsPerPage, 
						newPagState.recordOffset, 
						oState.sortedBy.key, 
						oState.sortedBy.dir
				);
			
				dataTableWrapperInstance.goToNewState(sBookmark);
			
				return false;
			};
			
			// Intercepts built-in sorting and passes request off to the BroswerHistoryManager
			this.dataTable.doBeforeSortColumn = function(oColumn, sSortDir) {
				var oState = this.getState();
				var dataTableWrapperInstance = this.get("dataTableWrapperInstance");
				var sBookmark = dataTableWrapperInstance.generateStateString(
						oState.pagination.rowsPerPage, 
						0,
						oColumn.key, 
						sSortDir
				);
			
				dataTableWrapperInstance.goToNewState(sBookmark);
			
				return false;
			};
			
			this.dataTable.subscribe('dataReturnEvent', function(o) {
				var dataTableWrapperInstance = this.get("dataTableWrapperInstance");
				var state = dataTableWrapperInstance.parseStateString(o.request);
				
				this.configs.paginator.setTotalRecords(o.response.meta.totalRecords, true);
				if (state.search && !state.search.blank()) {
					this.configs.paginator.set("searchTerm", state.search, true);
					
					// NOTE : changing the paginator display to be more informational for searches
					this.configs.paginator.set("template", "{CurrentPageReport}", true);
					this.configs.paginator.set("pageReportTemplate", dataTableWrapperInstance.options.paginatorSearchPageReportTemplate, true);
					
					//If it's the result of a search setup infinite rows per page 
					//(so no pagination, and delete all existing rows so that we see only the new ones returned by the search):
					this.configs.paginator.setRowsPerPage(1000000, true);
					
					this.configs.paginator.set("alwaysVisible", true, true);
				} else {
					this.configs.paginator.set("searchTerm", "", true);
					
					// NOTE : changing the paginator display back to the page's original setting
					this.configs.paginator.set("template", YAHOO.widget.Paginator.TEMPLATE_DEFAULT + " {CurrentPageReport}", true);
					this.configs.paginator.set("pageReportTemplate", dataTableWrapperInstance.options.paginatorPageReportTemplate, true);
					
					//Otherwise, set pagination based on number of rows returned:
					this.configs.paginator.setRowsPerPage(dataTableWrapperInstance.options.recordsPerPage, true);
					
					this.configs.paginator.set("alwaysVisible", false, true);
				}
				
				// NOTE : this is a hack to force the Paginator instance to re-render itself with the new template value
				this.configs.paginator._configs.rendered.value = false;
				this.configs.paginator.render();
			});
		}
		
		if (this.options.summaryData && this.options.initialData) {
			this.dataTable.addRow(this.options.summaryData);
			var addedRow = this.dataTable.getRow(this.dataTable.getRecordSet().getRecords().length - 1);
			this.dataTable.highlightRow(addedRow);
		}
		
		if (this.doneLoadingCallback) {
			this.doneLoadingCallback();
		}
	},
	
	page_report_value_generator_w_search: function (paginator) {
			// NOTE : copied this function from the Paginator.ui.CurrentPageReport.init function and added the searchTerm only
			var curPage = paginator.getCurrentPage(),
					records = paginator.getPageRecords();
			
			return {
					'currentPage' : records ? curPage : 0,
					'totalPages'  : paginator.getTotalPages(),
					'startIndex'  : records ? records[0] : 0,
					'endIndex'    : records ? records[1] : 0,
					'startRecord' : records ? records[0] + 1 : 0,
					'endRecord'   : records ? records[1] + 1 : 0,
					'totalRecords': paginator.get('totalRecords'),
					'searchTerm'  : paginator.get('searchTerm')
			};
	},
	
	paginator_configs_in_common: function () {
		return {
			firstPageLinkLabel:       '<img src="/images/control-double-180-small.png" width="16" height="16" title="&lt;&lt;" />',
			lastPageLinkLabel:        '<img src="/images/control-double-000-small.png" width="16" height="16" title="&gt;&gt;" />',
			previousPageLinkLabel:    '<img src="/images/control-180-small.png" width="16" height="16" title="&lt;" />',
			nextPageLinkLabel:        '<img src="/images/control-000-small.png" width="16" height="16" title="&gt;" />',
			pageReportValueGenerator: this.page_report_value_generator_w_search
		}
	},
	
	refresh_from_server: function(url_params, callbacks) {
		if (url_params == null) {
			url_params = this.generateStateString();
		}
		
		if (callbacks == null) {
			callbacks = {
				success: this.dataTable.onDataReturnSetRows, 
				failure: this.dataTable.onDataReturnSetRows, 
				scope: this.dataTable,
				argument: this.dataTable.getState()
			};
		}
		
		this.dataTable._oDataSource.sendRequest(url_params, callbacks);
	},
	
	initialize: function(options) {
		this.options = Object.extend({
			searchBoxID: null,
			historyIframeID: null,
			historyInputFieldID: null,
			initialData: null,
			summaryData: null,
			initialSearchString: "",
			recordsPerPage: 30,
			dataSourceURL: null,
			dynamicData: false,
			paginatorPageReportTemplate: "Showing {startRecord} - {endRecord} of {totalRecords}",
			paginatorSearchPageReportTemplate: "Found {totalRecords} results for \"{searchTerm}\""
		}, options || {});

		var dataTableDivID = this.options.dataTableDivID;
		if(dataTableDivID === null){ throw new Error("dataTableDivID must be provided"); }

		var responseSchema = this.options.responseSchema;
		if(responseSchema === null){ throw new Error("responseSchema must be provided"); }

		var columnDefs = options.columnDefs;
		this.columnDefs = columnDefs;
		if(columnDefs === null){ throw new Error("columnDefs must be provided"); }

		if (this.options.dataSourceURL !== null) {
			this.options.dataSourceURL = options.dataSourceURL + "?";
			this.options.dynamicData = true;
		}
		var dataSourceURL = this.options.dataSourceURL;

		//if no searchBox div ids are given, there won't be a search box
		var searchBoxID = this.options.searchBoxID || null;

		//if either of these is null, we won't history manage
		var historyIframeID = this.options.historyIframeID || null;
		var historyInputFieldID = this.options.historyInputFieldID || null;

		var initialData = this.options.initialData || null;
		var summaryData = this.options.summaryData || null;
		
		if(dataSourceURL === null && initialData === null){ throw new Error("One of: dataSourceURL or initialData must be provided"); }

		var initialSearchString = this.options.initialSearchString || "";
		
		//Optional configs:		
		this.dataTableName = this.options.dataTableName || dataTableDivID+"DataTable";
		if(dataSourceURL === null) { this.options.recordsPerPage = 1000000; }
		
		this.initialDataOrderKey = this.options.initialData ? this.options.initialData['order_key'] : false;
		this.initialDataOrderDirection = this.options.initialData ? this.options.initialData['order_dir'] : false;
		this.defaultSortColumnName = this.options.defaultSortColumnName || this.initialDataOrderKey || columnDefs[0].key;
		var extraConfigOpts = this.options.extraConfigOpts || {};
		
		this.additionalStateParamsFunction = this.options.additionalStateParamsFunction || this.additionalStateParamsFunction;
		
		var History = this.getYuiHistoryObject();
		// if(initialData && History){ throw new Error("setting up a History is not supposed with initialData (yet)") }
		
		var thePaginator;	 // to hold the Paginator instance
		var theDataSource; // to hold the DataSource instance
		var theDataTable;	 // to hold the DataTable instance

		// Create the DataSource
		var initialState;
		if((History && (initialState = History.getBookmarkedState(this.dataTableName))) || !initialData) {
			theDataSource = new YAHOO.util.XHRDataSource(dataSourceURL);
			theDataSource.connXhrMode = "cancelStaleRequests";
		} else {
			theDataSource = new YAHOO.util.LocalDataSource(initialData);
		}
		theDataSource.responseSchema = responseSchema;
		// theDataSource.maxCacheEntries = 10;
		
		// Set up the search box to work
		var searchFieldObserver = null;
		if (this.options.searchBoxID && !searchFieldObserver) {
			searchFieldObserver = new Form.Element.DelayedObserver(searchBoxID, 0.5, function(element, value){
				// NOTE : Only run the search if we have 3 or more characters
				if (value.length == 0 || value.length >= 3) {
					var dt_sort_info = this.getCurrentDataTableSort();
					var newBookmark = this.generateStateString(this.options.recordsPerPage, 0, dt_sort_info['column_name'], dt_sort_info['direction'], {search: value});

					this.goToNewState(newBookmark);
				}
			}.bind(this));
		}
		
		
		var dt_sort_info = this.getCurrentDataTableSort();
		initialState = initialState || this.generateStateString(this.options.recordsPerPage, 0, dt_sort_info['column_name'], dt_sort_info['direction']);
		
		
		var initial_paginator_template = YAHOO.widget.Paginator.TEMPLATE_DEFAULT + " {CurrentPageReport}";
		var initial_page_report_template = this.options.paginatorPageReportTemplate;
		if (initialSearchString !== null && !initialSearchString.blank()) {
			initial_paginator_template = "{CurrentPageReport}";
			initial_page_report_template = this.options.paginatorSearchPageReportTemplate;
		}
		
		
		if (History) {
			History.register(this.dataTableName, initialState, this.handleHistoryNavigation, this, true);
			
			History.onReady(function() {
				// Pull the state from the History Manager, or default from the initial state
				var initialRequestFromHistory = History.getCurrentState(this.dataTableName) || initialState;
				
				// Parse the state string into an object literal.
				var state = this.parseStateString(initialRequestFromHistory);
				
				// Create the DataTable configuration and Paginator using the state
				// information we pulled from the History Manager
				var thePaginator = new YAHOO.widget.Paginator(Object.extend({
					template:           initial_paginator_template,
					pageReportTemplate: initial_page_report_template,
					rowsPerPage:        state.results,
					recordOffset:       state.startIndex,
					totalRecords:       initialData.total_records,
					alwaysVisible:      true
				}, this.paginator_configs_in_common()));
				thePaginator.setAttributeConfig("searchTerm", {value: state.search});
				if (this.options.searchBoxID && $(this.options.searchBoxID)) {
					$(this.options.searchBoxID).value = state.search;
				}

				var myConfig = {
					paginator : thePaginator,
					dynamicData : this.options.dynamicData,
					sortedBy : {
						key : state.sort,
						dir : state.dir
					},
					// renderLoopSize : this.options.recordsPerPage,
					initialRequest : initialRequestFromHistory
				};
				Object.extend(myConfig, extraConfigOpts);
				
				// Instantiate DataTable
				this.dataTable = new YAHOO.widget.DataTable(
					dataTableDivID, // The dom element to contain the DataTable
					columnDefs,			// What columns will display
					theDataSource,	// The DataSource for our records
					myConfig				// Other configurations
				);
				
				this.commonDataTableSetup();
			}, this, true);
			
			YAHOO.util.History.initialize(historyInputFieldID, historyIframeID);
		} 
		else {
			var initialStateString = this.generateStateString();
			var state = this.parseStateString(initialStateString);
			
			var thePaginator = new YAHOO.widget.Paginator(Object.extend({
				template:           initial_paginator_template,
				pageReportTemplate: initial_page_report_template,
				rowsPerPage:        state.results,
				recordOffset:       state.startIndex,
				totalRecords:       initialData.total_records,
				alwaysVisible:      false
			}, this.paginator_configs_in_common()));
			thePaginator.setAttributeConfig("searchTerm", {value: state.search});
			
			var myConfig = {
				paginator : thePaginator,
				dynamicData : this.options.dynamicData,
				sortedBy : {
					key : state.sort,
					dir : state.dir
				},
				// renderLoopSize : this.options.recordsPerPage,
				initialRequest : initialStateString
			};
			Object.extend(myConfig, extraConfigOpts);
			
			
			// Instantiate DataTable
			this.dataTable = new YAHOO.widget.DataTable(
				dataTableDivID, // The dom element to contain the DataTable
				columnDefs,			// What columns will display
				theDataSource,	// The DataSource for our records
				myConfig				// Other configurations
			);
			
			this.commonDataTableSetup();
		}
	
	}
});
