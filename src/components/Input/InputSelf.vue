<template>
	<div class="json-input">
		<!-- menu -->
		<div class="input-menu">
				<div class="tool">
					<button class="menu-btn" @click="forceUpdate()">
							<span class="icon" title="Fix common mistake"><i class="fas fa-tasks"></i></span>
					</button>
					<button class="menu-btn">
							<span class="icon" title="Compress"><i class="far fa-file-archive"></i></span>
					</button>
				</div>
				<div class="dropdown is-right is-hoverable">
					<div class="dropdown-trigger">
						<button class="menu-btn" @click="scrollToError()"><span class="icon" v-html="has_error"></span></button>
					</div>
					<div class="dropdown-menu" role="menu" v-show="error.line">
						<div class="dropdown-content">
							<div class="dropdown-item">
								Line {{error.line}} has error: {{error.msg}}
							</div>
						</div>
					</div>
				</div>
		</div>
		<!-- content -->
		<div class="input-main">
			<div class="input-outer">
				<div class="input-linenumber">
					<template v-for="i in lines.length" >
						<div v-bind:class="{
							'input-line': true,
							'line-number' : true, 
							'numline-active': (i == activeLine + 1)
							}" 
							:key="i"><span class="icon is-sm error-show" v-bind:title="error.msg" v-show="error.line && error.line == i"><i class="fas fa-times-circle"></i></span>{{i}}</div>
					</template>
				</div>
				<div class="input-content" 
						:contenteditable="!options.View_mode" 
						@input="debouncedUpdateLine($event)"
						v-on:keydown="keydownHandler($event)"
						v-on:keyup="keyupHandler($event)"
						>
					<div class="input-layer input-text-layer" ref="inputContent">
						<template v-for="(line,i) in highlight" >
							<pre  :id="'l'+i"
							v-bind:class="{
							'input-line': true,
							'line-text' : true
							}"
							:key="i"
							@click="onLineSelection(i+1)"
							v-html="line"></pre>
						</template>
					</div>
				</div>
			</div>
			<div id="autocompleteInp"></div>
		</div>
		<!-- status -->
		<div class="input-status">
				Total lines: {{lines.length}}.
		</div>	
	</div>
</template>

<script>
import _ from 'lodash';
import { eventBus } from '../../main.js';

var keyCtrl = require('./assets/KeyController.js')
var util = require('../common_assets/util.js');
var validate = require('../common_assets/Validator.js');
var AC = require('../common_assets/Autocomplete.js');

var error = '<i class="fas fa-exclamation-triangle"></i>';
var no_error  = '<i class="fas fa-check-circle"></i>';

function noAutocomplete() {
	if (document.getElementsByClassName("autocomplete-items").length > 0) {
		if (document.getElementsByClassName("autocomplete-items")[0].style.display != "none") return false;
		else return true;
	} else return true;
}

function runAutocomplete(target,keyCode){
	let evt = new KeyboardEvent('keydown', {'keyCode':keyCode, 'which':keyCode});
	target.dispatchEvent(evt);
}

export default {
	name: 'input-component',
	data: function(){
		return {
			has_error: no_error,
			activeLine: -2,
			textData: "",
			lines: [],
			highlight: [],
			error: {},
			autocomplete: []
		}
	},
	props: {
		options: {
			type: Object
		},
		value: [Object, Array, Number, String, Boolean],
		json_data: {
		},
		debounce: {
			type: Number
		}
	},
	computed: {
	},
	methods: {
		initInput: function(){
			this.textData = JSON.stringify(this.json_data,undefined,4);
			this.lines = this.textData.split('\n');
			this.highlight = this.highlightText(this.lines);
			this.error = {};
		},
		forceUpdate: function(){
			this.$forceUpdate();
		},
		getText: function(){
			return this.textData;
		},
		onLineSelection: function(i){
			this.activeLine = util.setActiveLine();
		},
		highlightText: function(text){
			let result = [...text];
			for (let i=0; i<result.length; i++){
				result[i] = this.highlightLine(result[i]);
			}
			return result;
		},
		highlightLine: function(line){
			let open_1 = "<span class='text-prop'>";
			let open_2 = "<span class='text-val'>";
			let close = "</span>";

			let isOpened = false;
			let prop = (line.indexOf(':') != -1);
			let isString = (line.indexOf('\"') != -1);
			let isBlank = util.str_isBlank(line);
			let isBracket = (line.indexOf('}') != -1) || (line.indexOf(']') != -1);
			// highlight string value
			for (var j=0; j < line.length; j++){
				if (line.charAt(j) == '\"' && isString){
					if (!isOpened){
						if (prop) {
							line = util.str_splice(line,j+1,0,open_1);
							j += 24;
						} else {
							line = util.str_splice(line,j+1,0,open_2);
							j += 23;
						}
						isOpened = true;
					} else {
						line = util.str_splice(line,j,0,close);
						j += 7;
						isOpened = false;
						prop = false;
					}
				} else if (j == 0 && !isString && !isBlank && !isBracket) { // for null, number and boolean
					let level = util.getLevel(line);
					line = util.str_splice(line,level,0,open_2);
					j += 23;
				}	else if (line.charAt(j) == "," && !isString && !isBlank){
					line = util.str_splice(line,j,0,close);
					j += 7;
				}
			}
			// update boolean value
			let trueReg = /^ true/;
			let falseReg = /^ false/;
			let start = line.split(":")[0];
			let end = line.split(":")[1];
			if ( (typeof end == 'string') && (trueReg.test(end) || falseReg.test(end)) ) {
				end = (trueReg.test(end) ? util.str_splice(end,5,0,close) : util.str_splice(end,6,0,close));
				end = util.str_splice(end,0,0,open_2);
				line= start + ':' + end;
			}
			return line;
		},
		debouncedUpdateLine: _.debounce( function(e) {
			let savePosition = util.getCaretPositionAll(); //save postion before update
			let isBracket = 0;
			// bracket handling
			if (e.data == "[" || e.data == "{") {
				let val = util.getCaretElement();
				let str = val.nodeValue;
				let close1 = "\"key\": \"value\"}";
				let close2 = "{\"key\": \"value\"}]";
				val.nodeValue = util.str_splice(str,str.indexOf(e.data)+1,0,(e.data == "{" ? close1: close2));
				isBracket = e.data == "{" ? 1: 2;
			}
			// update data
			if (this.options.Autocomplete) AC.autocomplete(util.getActiveLine(),0,""); //autocomplete
			this.activeLine = util.setActiveLine();
			this.textData = this.$refs.inputContent.innerText;
			try {
				util.validate(this.textData);
				this.lines = this.textData.split('\n');
				if (!util.str_isBlank(this.lines[this.activeLine])) {
					let msg = util.parse(this.textData);
					let before= this.highlight.length;
					this.$emit('json_onChange',msg);
					this.$nextTick(function(){
						if (savePosition.saveParent){
							if (isBracket != 0) {
								let target = this.$refs.inputContent.childNodes[this.activeLine+(isBracket == 1 ? 2:3)];
								 util.setCaretPosition(target,4,1) ;
							} else if (before < this.highlight.length) {
								let target = this.$refs.inputContent;
								let line = this.highlight[this.activeLine];
								util.isNewElement(savePosition.saveParent,target,line);
								this.activeLine++;
							}
							else {
								// check if new element is create
								if (savePosition.saveParent && savePosition.saveParent.childNodes[savePosition.index].nodeValue != savePosition.value) {
									savePosition.savePos -= savePosition.saveParent.childNodes[savePosition.index].nodeValue.length;
									savePosition.index++;
								}
								util.setCaretPosition(savePosition.saveParent,savePosition.index,savePosition.savePos);
							}
						}
					});
				}
				this.error = {};
			} catch (err) {
				this.error = validate.validateSyntaxError(err.message);
				eventBus.$emit('jsonSyntax_error',this.error);
			}
		}, 300),
		keydownHandler: function(e){
			//single
			switch (e.keyCode) {
				case 9: // tab
					e.preventDefault();
					keyCtrl.customonTab();
					break;
				case 13: //enter
					e.preventDefault();
					if (!noAutocomplete()) {
						let target = this.$refs.inputContent.childNodes[this.activeLine];
						runAutocomplete(target,e.keyCode);
					} else {
						let res = keyCtrl.customonEnter();
						if (res && res.level>0) {
							this.activeLine++;
							this.highlight.splice(res.index,0,res.content);
							this.$nextTick(function(){
								let target = this.$refs.inputContent.childNodes[res.index];
								util.setCaretPosition(target,0,res.level);
								this.activeLine = util.setActiveLine();
							});
						}
					}
					break;
				case 38: // up
				case 40: // down
					if (!noAutocomplete()) {
						e.preventDefault();
						runAutocomplete(this.$refs.inputContent.childNodes[this.activeLine],e.keyCode);
					}
					break;
			}
			// ctrl combination
			if (e.ctrlKey || e.metaKey) {
        switch (String.fromCharCode(event.which).toLowerCase()) {
					case 's':
							e.preventDefault();
							eventBus.$emit('sys_action','save');
							break;
					case 'n':
							e.preventDefault();
							eventBus.$emit('sys_action','new');
							break;
					case 'o':
							e.preventDefault();
							eventBus.$emit('sys_action','open');
							break;
        }
    	}
			this.caret_pos = util.getCaretPosition();
		},
		keyupHandler: function(e){
			switch (e.keyCode) {
				case 38: // up
				case 40: // down
					// if no autocomplete
					if (noAutocomplete()) this.activeLine = util.setActiveLine();
					break;
			}
			this.caret_pos = util.getCaretPosition();
		},
		scrollToError:function(){
			let errLine = document.getElementById('l'+(this.error.line-1));
			if (errLine) errLine.scrollIntoView();
		}
	},
	watch: {
		json_data: function(val) {
			this.initInput();
		},
		activeLine: function(val){
			eventBus.$emit('activeLine_Change',val);
		},
		error: function(val){
			if (val.msg) this.has_error = error;
			else this.has_error = no_error;
			this.scrollToError();
		}
	},
	created(){
		eventBus.$on('ruleViolation',(val)=>{
			this.error = val;
		});
		eventBus.$on('onChangeInput',(val)=>{
			let line = util.getRowIndex(val.element);
			let level = util.getLevel(val.element.innerText);
			this.lines[line] = ' '.repeat(level) + val.change;
			this.highlight.splice(line,1,this.highlightLine(this.lines[line]));
			this.$nextTick(function(){
				var target = this.$refs.inputContent.childNodes[line];
				if (target.innerHTML != this.highlight[line]) target.innerHTML = this.highlight[line];
				util.setCaretPosition(target,4,1);
				util.setActiveLine();
			});
		});
	},
	mounted() {
		this.initInput();
	}
}
</script>
