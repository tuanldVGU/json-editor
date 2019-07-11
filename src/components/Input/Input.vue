<template>
	<div class="json-input">
		<!-- menu -->
		<div class="input-menu">
				<div class="tool">
					<button class="menu-btn">
							<span class="icon" title="Fix common mistake"><i class="fas fa-tasks"></i></span>
					</button>
					<button class="menu-btn">
							<span class="icon" title="Compress"><i class="far fa-file-archive"></i></span>
					</button>
				</div>
				<div class="control has-icons-right searchbox">
					<input type="text" class="input">
					<span class="icon is-small is-right">
						<i class="fas fa-search"></i>
					</span>	
				</div>
		</div>
		<!-- content -->
		<div class="input-outer">
			<div class="input-linenumber">
				<template v-for="i in lines.length" >
					<div v-bind:class="{
						'input-line': true,
						'line-number' : true, 
						'numline-active': (i == activeLine + 1)
						}" 
						:key="i"><span class="icon is-sm error-show" v-bind:title="error.message" v-show="error.line && error.line == i"><i class="fas fa-times-circle"></i></span>{{i}}</div>
				</template>
			</div>
			<div class="input-content" 
					 contenteditable ="true" 
					 @input="debouncedUpdateLine($event)"
					 v-on:keydown="keydownHandler($event)"
					 v-on:keyup="keyupHandler($event)"
					 >
				<div class="input-layer input-text-layer" ref="inputContent">
					<template v-for="(line,i) in highlight" >
						<pre v-bind:class="{
						'input-line': true,
						'line-text' : true
						}"
						@input="lineLimit($event)"
						@click="onLineSelection(i+1)"
						:key="line.id" v-html="line"></pre>
					</template>
				</div>
				<!-- <div class="input-layer input-marker-layer"></div> -->
				<!-- <div class="input-layer input-cursor-layer" v-on:click="onClickEvent">
					<div class="input-cursor blinking-cursor" v-bind:style="cursor_style">
					</div>
				</div> -->
			</div>
		</div>
		<!-- status -->
		<div class="input-status">
				Total lines: {{lines.length}}. 
		</div>
	</div>
</template>

<script>
import _ from 'lodash';
import { eventBus } from '../../main';
import { validate } from '../common_assets/util';

var keyCtrl = require('./assets/KeyController.js')
var util = require('../common_assets/util.js');

var error = '<i class="fas fa-exclamation-triangle"></i>';

export default {
	name: 'input-component',
	data: function(){
		return {
			activeLine: -2,
			textData: "",
			lines: [],
			highlight: [],
			error: {},
			save_position: {}
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
			this.textData = JSON.stringify(this.json_data,undefined,4)
			this.lines = this.textData.split('\n');
			this.highlight = this.highlightText(this.lines);
		},
		focus: function(){

		},
		format: function(){

		},
		getText: function(){

		},
		onLineSelection: function(i){
			this.activeLine = util.setActiveLine();
		},
		highlightText: function(text){
			let result = [...text];
			let open_1 = "<span class='text-prop'>";
			let open_2 = "<span class='text-val'>";
			let close = "</span>";
			for (let i=0; i<result.length; i++){
				let isOpened = false;
				let prop = ( result[i].indexOf(':') != -1);
				let isString = (result[i].indexOf('\"') != -1);
				let isBlank = util.str_isBlank(result[i]);
				// highlight string value
				for (var j=0; j < result[i].length; j++){
					if (result[i].charAt(j) == '\"' && isString){
						if (!isOpened){
							if (prop) {
								result[i] = util.str_splice(result[i],j+1,0,open_1);
								j += 24;
							} else {
								result[i] = util.str_splice(result[i],j+1,0,open_2);
								j += 23;
							}
							isOpened = true;
						} else {
							result[i] = util.str_splice(result[i],j,0,close);
							j += 7;
							isOpened = false;
							prop = false;
						}
					}	else if (j == 0 && !isString && !isBlank) { // for null, number and boolean
						result[i] = util.str_splice(result[i],j+1,0,open_2);
						j += 23;
					}	else if (result[i].charAt(j) == "," && !isString && !isBlank){
						result[i] = util.str_splice(result[i],j,0,close);
						j += 7;
					}
				}
				// update boolean value
				let trueReg = /^ true/;
				let falseReg = /^ false/;
				let start = result[i].split(":")[0];
				let end = result[i].split(":")[1];
				if ( (typeof end == 'string') && (trueReg.test(end) || falseReg.test(end)) ) {
					end = util.str_splice(end,5,0,close);
					end = util.str_splice(end,0,0,open_2);
					result[i]= start + ':' + end;
				}
			}
			return result;
		},
		debouncedUpdateLine: _.debounce( function(e) {
			this.activeLine = util.setActiveLine();
			this.textData = this.$refs.inputContent.innerText;			
			this.lines = this.textData.split('\n');
			try {
				util.validate(this.textData);
				if (!util.str_isBlank(this.lines[this.activeLine])) {
					this.highlight[this.activeLine+1] = "";
					let msg = util.parse(this.textData);
					this.$emit('json_onChange',msg);
				}
				this.error = {}
			} catch (err) {
				this.error = util.validateError(err.message);
			}
		}, 1500),
		keydownHandler: function(e){
			switch (e.keyCode) {
				case 9: // tab
					e.preventDefault();
					keyCtrl.customonTab();
					break;
				case 13: //enter
					e.preventDefault();
					let res = keyCtrl.customonEnter();
					if (res) {
						this.activeLine ++;
						this.lines.splice(res.index,0,res.content);
						this.highlight = this.highlightText(this.lines);
						this.$nextTick(function(){
							util.setCaretPosition(this.$refs.inputContent.childNodes[res.index],0,res.level);
							this.activeLine = util.setActiveLine();
						});
					}
					break;
			}
			this.caret_pos = util.getCaretPosition();
		},
		keyupHandler: function(e){
			switch (e.keyCode) {
				case 38: // up
				case 40: // down
					this.activeLine = util.setActiveLine();
					break;
			}
			this.caret_pos = util.getCaretPosition();
		}
	},
	watch: {
		json_data: function(val) {
			this.initInput();
		},
		activeLine: function(val){
			let msg = util.pathVal(this.lines,val);
			eventBus.$emit('activeLine_Change',msg);
		}
	},
	created(){
	},
	mounted() {
		this.initInput();
	}
}

</script>
