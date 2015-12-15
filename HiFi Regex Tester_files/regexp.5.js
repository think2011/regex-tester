/**
 * A Simple JavaScript Regular Expression Editor
 * Copyright (c) 2009 - Kris Jordan, New Media Campaigns
 * http://www.newmediacampaigns.com/
 */
$(document).ready(function() {
	var app, aboutPane, regexPane, haystackPane, matchTable, exampleCode, cheatSheet;
	
	var aboutPane = {
		$about: $("#about"),
		$showAbout: $("#showAbout"),
		$hideAbout: $("#hideAbout"),
		init: function() {
			var toggle = function() { aboutPane.$about.toggle(); };
			toggle();
			this.$showAbout.click(toggle);
			this.$hideAbout.click(toggle);
		}
	};
	
	var regexPane = {
			// Children Nodes
			$pane: $("#regexPane"),
			$textPane: $("#regexPaneText"),
			$inputsPane: $("#regexPaneInputs"),
			$editRegex: $("#editRegex"),
			$inputs: $("#regexPaneInputs :input"),
			$labels: $("#regexPaneInputs label"),
			$regex: $("#regex"),
			$globalFlag: $("#globalFlag"),
			$insensitiveFlag: $("#insensitiveFlag"),
			$multilineFlag: $("#multilineFlag"),
			$regexFlagsPlaceHolder: $("#regexFlagsPlaceHolder"),
			
			init: function() {				
				this.$inputs.change(app.refresh)
							.keyup(app.refresh)
							.mouseup(function() { setTimeout(app.refresh,50); });
				
				this.$regex.focus();
			},
			
			regexString: function() {
				return "/" + this.$regex.val() + "/" + this.regexFlags();
			},
			
			regexCode: function() { return "var regex = " + regexPane.regexString() + ";"; },
			
			regexFlags: function() {
				return (this.$globalFlag.is(":checked") ? "g" : "")
						+ (this.$insensitiveFlag.is(":checked") ? "i" : "")
						+ (this.$multilineFlag.is(":checked") ? "m" : "");
			},
			
			hintValidity: function() {
				var newClass = (haystackPane.isMatch() ? "match" : 
								(haystackPane.isValid() ? "valid" : 
								"invalid"));
				this.$pane.removeClass();
				this.$pane.addClass(newClass);
			},
			
			refresh: function() {
				this.$regexFlagsPlaceHolder.text(this.regexFlags());
				this.$editRegex.text(this.regexString());
				this.hintValidity();
			}
		};
		
	var haystackPane = {
			$textPane: $("#haystackPaneText"),
			$inputsPane: $("#haystackPaneInputs"),
			$haystack: $("#haystack"),
			_isMatch: false,
			_isValid: false,
			
			init: function() {
				this.$textPane.click(this.toggleEdit);
				this.$haystack.blur(this.toggleEdit);
			},
			
			isEditable: function() {
				return this.$inputsPane.css("display") !== "none";
			},
			
			toggleEdit: function() {
				if(haystackPane.isEditable()) {
					haystackPane.$inputsPane.hide();
					haystackPane.$textPane.fadeIn(250);
				} else {
					haystackPane.$textPane.hide();
					haystackPane.$inputsPane.fadeIn(250);
					haystackPane.$haystack.focus();
				}
				app.refresh();
			},
			
			isMatch: function() { return this._isMatch; },
			isValid: function() { return this._isValid; },
			matches: function() { return this._matches; },
			
			refresh: function() {
				function evalRegex() {
					try {
						var regexString = regexPane.regexCode();
						eval(regexString);
						return regex;
					} catch(e) {
						return false;
					}
				}
				
				function findMatches(regex,text) {
					regex.lastIndex = 0;
					if(regex.test(text)) {
						regex.lastIndex = 0;
						var matches = new Array();
						
						var match;
						if(!regexPane.$globalFlag.is(":checked")) {
							match = regex.exec(text);
							matches.push({result: match, lastIndex: match[0].length});
						} else {
							while((match = regex.exec(text)) !== null) {
								if(match[0] === "") { regex.lastIndex += 1 }
								else {
									matches.push({result: match, lastIndex: regex.lastIndex});
								}
							}
						}
						
						return matches;
					} else {
						return false;
					}
				}
				
				function drawPlainText(text) {
					haystackPane.$textPane.html(text);
				}
				
				function drawHighlightedText(text, matches) {
					var highlight = "";
					for( var i = 0; i < matches.length; i++ ) {
						var result = matches[i].result;
						var lastIndex = matches[i].lastIndex;
						
						// Capturing groups
						var matchString = result[0];
						var matchIndex = result.index;
				
						var lastStartPosition = startPosition;
						var startPosition = matchIndex;
						var endPosition = startPosition + matchString.length;
						var before = encode(text.slice(lastStartPosition,startPosition));
				
						
						var searchString = "^(.*?)";
						var replaceString = "$1";
						var k = 1;
						for(var j = 1; j < result.length; j++) {
							if(result[j] !== undefined) {
								var resultRegex = encode(result[j].replace(/([.?\^${}\[\]()*+\/\\])/g,"\\$1"));
								searchString += resultRegex + "(.*?)";
								replaceString += "<span class=\"group-" + j + "\">" + encode(result[j]) + "</span>$" + (k+1);
								k += 1;
							}
						}
						searchString += "$";
						matchString = encode(matchString).replace(new RegExp(searchString), replaceString);
								
						highlight += before + "<span class=\"match\">" + matchString + "</span>";
						startPosition = endPosition;
					}
					highlight += encode(text.slice(endPosition));
					
					haystackPane.$textPane.html(highlight);
				}
				
				var regex = evalRegex();
				var text = this.$haystack.val();
				drawPlainText(encode(text));
				
				if(regex === false) {
					this._isValid = this._isMatch = false;
				} else {
					this._isValid = true;
					this._matches = findMatches(regex, text);
					if(this._matches === false) {
						this._isMatch = false;
					} else {
						this._isMatch = true;
						drawHighlightedText(text, this._matches);
					}
				}
			}
		};
	
	var matchTable = {
		$pane: $("#matchesPane"),
		refresh: function() {
			if(!haystackPane.isMatch()) {
				this.$pane.hide();
			} else {
				var matches = haystackPane.matches();
				var matchTable = "<table><thead><tr><td id=\"matchNumber\"></td><td>Matched Text</td>";
				
				var columns = 0;
				for(var i = 0; i < matches.length ; i++ ) {
					if(columns < matches[i].result.length) {
						columns = matches[i].result.length;
					}
				}
			
				for(var i = 1; i < columns; i++) {
					matchTable += "<td class=\"group-" + i + "\">$" + i + "</td>";
				}
				matchTable += "</tr></thead>";
			
				for( var i = 0; i < matches.length; i++ ) {
					var result = matches[i].result;
					matchTable += "<tr><td>" + (i + 1) + "</td>";
					matchTable += "<td title=\"" + encode(result[0]) + "\">" + encode(result[0].length > 20 ? result[0].substring(0,20) + '...' : result[0]) + "</td>";
					for(var j = 1; j < columns; j++) {
						if(result[j] !== undefined) {
							matchTable += "<td class=\"group-" + j + "\" title=\"" + encode(result[j]) + "\">" + encode(result[j].length > 20 ? result[j].substring(0,20) + '...' : result[j]) + "</td>";
						} else {
							matchTable += "<td class=\"group-" + j + "\">&nbsp;</td>";
						}
					}
					matchTable += "</tr>";
				}
				matchTable += "</table>";
				this.$pane.html(matchTable);
				this.$pane.show();
			}
		}
	};
	
	var exampleCode = {
		$pane: $("#codePane"),
		$code: $("#code"),
		$regexCode: $("#regexCode"),
		$matchInputOnce: $("#matchInputOnce"),
		$matchInputGlobal: $("#matchInputGlobal"),
		
		init: function() {
		},
		
		refresh: function () {
			if(haystackPane.isValid()) {
				this.$pane.show();
				this.$regexCode.text(regexPane.regexCode());
				if(!regexPane.$globalFlag.is(":checked")) {
					this.$matchInputOnce.show();
					this.$matchInputGlobal.hide();
				} else {
					this.$matchInputOnce.hide();
					this.$matchInputGlobal.show();
				}
			} else {
				this.$pane.hide();
			}
		}
	};
	
	var cheatSheet = {
		$div: $("#cheatSheet"),
		$selectedContent: false,
		init: function() {
			this.$div.append("<div id=\"selectedContent\"></div>");
			this.$selectedContent = this.$div.children("#selectedContent");
			this.$div.children("h3").click(function() {
				cheatSheet.deselect();
				cheatSheet.select($(this));
			});
			this.select(this.$div.children("h3:first"));
		},
		deselect: function() {
			this.$div.children(".selected").removeClass("selected");
			this.$selectedContent.empty();
		},
		select: function($h3) {
			$h3.addClass("selected")
				.next().clone().appendTo(this.$selectedContent);
		}
	};
	
	var app = {
			init: function() {
				aboutPane.init();
				regexPane.init();
				haystackPane.init();
				exampleCode.init();
				cheatSheet.init();
				this.refresh();
			},
			
			refresh: function() {
				haystackPane.refresh();
				regexPane.refresh();
				matchTable.refresh();
				exampleCode.refresh();
			}
	};
	
	app.init();
	
	function encode(string) {
		return string
				.replace(/&/g,'&amp;')
				.replace(/</g,'&lt;')
				.replace(/>/g,'&gt;')
				.replace(/  /g,'&nbsp;&nbsp;')
				.replace(/\n/g,"<br />")
				.replace(/\t/g,"&nbsp;&nbsp;");
	}	
});