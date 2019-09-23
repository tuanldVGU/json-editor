<template>
	<div class="json-outter">
		<div class="input-menu">
				<div class="tool">
					<button class="menu-btn">
							<span class="icon" title="Format JSON data, with proper indentation and line feeds." @click="fixIndent()"><i class="fas fa-tasks"></i></span>
					</button>
					<button class="menu-btn">
							<span class="icon" title="Compact JSON data, remove all whitespaces." @click="compact()"><i class="far fa-file-archive"></i></span>
					</button>
				</div>
				<div class="dropdown is-right is-hoverable">
					<div class="dropdown-trigger">
						<button class="menu-btn"><span class="icon" v-html="has_error"></span></button>
					</div>
					<div id="input_error" class="dropdown-menu" role="menu" v-show="error.line">
						<div class="dropdown-content">
							<div class="dropdown-item">
								Line {{error.line}} has error: {{error.msg}}
							</div>
						</div>
					</div>
				</div>
		</div>
		<div class="input-outter">
			<div id="input"></div>
		</div>
	</div>	
</template>
<script>
import _ from 'lodash';
import { eventBus } from '../../main.js';
import axios from 'axios';

var ace = require('brace');
var util = require('../common_assets/util.js');
var validate = require('../common_assets/Validator.js');

require('../../assets/js/datamodel');
require('brace/theme/twilight');
require('brace/ext/language_tools');

var error = '<i class="fas fa-exclamation-triangle"></i>';
var no_error  = '<i class="fas fa-check-circle"></i>';
var debounce_interval = 500;

var semantic_format = {
	class: "\"class\": \"\", \"attributes\" : []",
	association: "\"association\": \"\",\"ends\" : [],\"classes\" : []",
	type_name: "\"name\": \"\",\"type\" : \"\""
}

var semantic_format_afteCursor = {
	class: 10,
	association: 16,
	type_name: 9
}
export default {
  	name: 'input-component',
	data: function(){
		return {
			editor: null,
			textData: "",
			has_error: no_error,
			error: {}
		}
	},
	props: {
		options: {
			type: Object
		},
		value: [Object, Array, Number, String, Boolean],
		json_data: {
		},
		change_from: {
			type: String
		},
		debounce: {
			type: Number
		}
	},
	methods: {
		updateInput: function(val){
			this.textData = JSON.stringify(val,undefined,4);
			this.editor.setValue(this.textData,-1);
		},
		getValue: function(){
			return this.editor.getValue();
		},
		setOptions: function(){
			var me = this;
			// autocompletions
			let langTools = ace.acequire("ace/ext/language_tools");
			this.editor = ace.edit("input");
			this.editor.$blockScrolling = Infinity;
			this.editor.setTheme("ace/theme/twilight");
			this.editor.session.setMode("ace/mode/custom");
			this.updateInput(this.json_data);
			this.editor.setBehavioursEnabled(true);
			let staticWordCompleter = {
				getCompletions: function(editor, session, pos, prefix, callback) {
					var wordList = me.getAutocompleteList();
					callback(null, wordList.map(function(word) {
						// auto close "" if users not already do it
						let close = ''; let start = '';
						let line = session.getLine(pos.row);
						if (line.charAt(pos.column) != "\"" && line.charAt(pos.column-prefix.length-1) == "\"") close = "\"";
						if (line.charAt(pos.column) != "\"" && line.charAt(pos.column-prefix.length-1) != "\"") { start = "\""; close = "\""; } 
						return {
							caption: word,
							value: start+word+close,
							meta: "static"
						};
					}));
				}
			}
			let formatWordCompleter = {
				getCompletions: function(editor, session, pos, prefix, callback) {
					var wordList = me.getFormList();
					callback(null, wordList.map(function(word) {
						// auto close {} if users not already do it
						let close = ''; let start = '';
						let line = session.getLine(pos.row);
						if (line.charAt(pos.column) != "}" && line.charAt(pos.column-prefix.length-1) == "{") close = "}";
						if (line.charAt(pos.column) != "}" && line.charAt(pos.column-prefix.length-1) != "{") { start = "{"; close = "}"; }
						return {
							caption: word,
							value: start+semantic_format[word]+close,
							meta: "format",
							completer: {
								insertMatch: function(editor,data){
									editor.completer.insertMatch({value: data.value});
									let pos = editor.selection.getCursor();
									editor.gotoLine(pos.row + 1, pos.column - data.value.length + semantic_format_afteCursor[word]);
								}
							}
						};
					}));
				}
			}
			this.editor.setOptions({
				enableBasicAutocompletion: me.options.Autocomplete,
				// enableSnippets: true,
				enableLiveAutocompletion: true
			});
			langTools.setCompleters([staticWordCompleter]);
			langTools.addCompleter(formatWordCompleter);
			this.editor.commands.addCommand({
				name: "nextItem",
				bindKey: {win: "Tab",mac: "Tab"},
				exec: function(editor) {
					let pos = editor.getCursorPosition();
					let before = editor.session.getLines(0,pos.row-1).join('');
					before += editor.session.getLine(pos.row).substring(0,pos.column);
					let isOdd = (before.match(/"/g) || []).length %2 != 0;
					if ( isOdd || ((before.match(/\[/g) || []).length - (before.match(/\]/g) || []).length > 0)){
						let check = editor.session.getLine(pos.row).substr(pos.column);
						let count = 0; let open = false; let exit= false;
						for (var i =0; i< check.length; i++){
							if (check.charAt(i) == "\"") count++;
							if (check.charAt(i) == "[") open=true;
							if ((count == 3) || (check.charAt(i) == ']' && open) || (!isOdd && count == 2)) {
								editor.gotoLine(pos.row+1,pos.column+i);
								exit=true;
								break;
							}
						}
						if (!exit) editor.indent();
					} else { editor.indent(); }
				},
				multiSelectAction: "forEach",
				scrollIntoView: "selectionPart"
			});
		},
		setEvents: function(){
			var me = this;
			this.editor.on('change',_.debounce(function(e){
				if (e.lines[0] == "\"\"" || e.lines[0] == "{" ||  e.lines[0] == "{}"){
					me.editor.commands.byName.startAutocomplete.exec(me.editor);
				};
				let val = me.editor.getValue();
				if (me.textData != val) {
					me.textData = val;
					try {
						let pkg ={
							msg: util.parse(val),
							from: 'input'
						}
						me.$emit('json_onChange',pkg);
					} catch (err){}
				}
			},debounce_interval));
			this.editor.getSession().on("changeAnnotation",_.debounce(function () {
				try {
					var annot = me.editor.getSession().getAnnotations();
					if (annot.length == 0) {
						me.error = {};
					} else {
						for (var key in annot) {
							if (annot.hasOwnProperty(key)){
								me.error = {
									line: annot[key].row,
									msg: annot[key].text
								};
							}
						}

					}
				} catch(err){}
			},debounce_interval));
		},
		fixIndent: function(){
			this.updateInput(this.json_data);
		},
		compact: function(){
			this.textData = JSON.stringify(this.json_data);
			this.editor.setValue(this.textData,1);
		},
		getAutocompleteList: function(){
			let wordList = ['class','association','super','ends','attributes','name','type','classes'];
			let caretPos = this.editor.getCursorPosition();
			let isClose = 0;
			for (var row = caretPos.row; row >0; row--){
				let inElement = this.editor.session.getLine(row);
				if (row == caretPos.row) inElement = inElement.substr(0,caretPos.column);
				inElement.replace(/\s/g,'');
				inElement = inElement.split("\"");
				if (row == caretPos.row && inElement.length >= 2 &&inElement[(inElement.length-2)].includes(':')) return [];
				for (var i=(inElement.length-1); i>=0; i--){
					if (inElement[i].includes('}') || inElement[i].includes('{') ) isClose = this.bracket_count(inElement[i],isClose);
					if (isClose > 0) continue; 
					if (wordList.includes(inElement[i]) && inElement[i+1] != ''){
						switch (inElement[i]){
							case 'class':
								return ['attributes','super'];
								break;
							case 'association':
								return ['ends','classes'];
								break;
							case 'attributes':
								return ['name','type'];
								break;
							case 'type':
								return ['String','Integer'];
								break;
							default:
								return [];
								break;
						}
						break;
					}
				}
			}
			return ['class','association'];
		},
		getFormList: function(){
			let wordList = ['class','association','attributes'];
			let caretPos = this.editor.getCursorPosition();
			let isClose = 0;
			for (var row = caretPos.row; row > 0; row--){
				let inElement = this.editor.session.getLine(row);
				if (row == caretPos.row) inElement = inElement.substr(0,caretPos.column);
				inElement.replace(/\s/g,'');
				inElement = inElement.split("\"");
				for (var i=(inElement.length-1); i>=0; i--){
					if (inElement[i].includes('}') || inElement[i].includes('{') ) isClose = this.bracket_count(inElement[i],isClose);
					if (isClose > 0) 	continue; 
					if (wordList.includes(inElement[i]) && inElement[i+1] != ''){
						switch (inElement[i]){
							case 'attributes':
								return ['type_name'];
								break;
							default:
								return [];
								break;
						}
						break;
					}
				}
			}
			return ['class','association'];
		},
		checkSyntax: function(){
			let pkg = this.getValue();
			axios
				.put('/api/checkDM',{data: pkg})
				.then(response => {
						console.log(response.data);
          }, response => {
						// error callback
						console.log(response);
					})
		},
		bracket_count: function(str,count){
			let caretPos = this.editor.getCursorPosition();
			let start = str.length-1;
			for (var i= start; i>=0; i--){
				if (str[i] == '{' && count >0) count--;
				if (str[i] == '}') count++;
			}
			return count;
		}
	},
	watch: {
		json_data: function(val){
			if (this.change_from != 'input') {
				this.updateInput(val);
			}
		},
		error: function(val){
			if (val.msg) this.has_error = error;
			else this.has_error = no_error;
			eventBus.$emit('jsonSyntax_error',val);
		},
		'options.View_mode': function(val){
			this.editor.setReadOnly(val);
		}
	},
	created(){
		eventBus.$on('ruleViolation',(val)=>{
			this.error = val;
		});
	},
	mounted() {
		this.setOptions();
		this.setEvents();
	}
}
</script>