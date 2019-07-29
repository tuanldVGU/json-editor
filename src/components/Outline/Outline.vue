<template>
	<div class="outline">
    <!-- Title -->
		<nav class="navbar is-primary">
			<div class="navbar-brand">
				<div class="navbar-item">Outline</div>
			</div>
			<div class="navbar-menu">
				<div class="navbar-end">
					<a class="navbar-item" @click.prevent="showNoti('errorMes')"><span class="icon" v-html="has_error"></span></a>
				</div>
			</div>
		</nav>
    <!-- Content -->
		<div class="outline-content">
      <!-- Menu -->
			<div class="outline-menu">
				<!-- expand and collapse -->
				<button class="outline-expandAll menu-btn" title="Expand all fields" @click="updateExpand(true,-1)">
					<span class="icon"><i class="fas fa-expand"></i></span>
				</button>
				<button class="outline-collapseAll menu-btn" title="Collapse all fields" @click="updateExpand(false,-1)">
					<span class="icon"><i class="fas fa-compress"></i></span>
				</button>
				<!-- search -->
				<template v-if="options.search">
				</template>
			</div>  
      <!-- Navigation -->
			<div class="outline-navigationbar" v-html="treePath.selectedPath">
			</div>
      <!-- code outline -->
			<div class="input-main">
				<div class="outline-content-outer">
					<div v-bind:class="{
						'has-menu-bar': options.menuBar,
						'has-nav-bar': options.navigationBar}">
							<template v-if="!isEmpty(rootNode)">
								<tree-component 
									:childs='rootNode.childs'
									:level= 0
									:type="'root'"
									:node_value='rootNode.value'
									:showChild ='true'
									:node_field="rootNode.field"
									:node_index="'0'">
								</tree-component>
							</template>
					</div>
				</div>
			</div>
            <!-- <button @click="test()">SetMainPath</button> -->
		</div>
		<!-- Error notification -->
		<div class="notification is-danger" id="errorMes" v-show="errorNodes.line">
			<button class="delete" @click.prevent="hideNoti('errorMes')"></button>
			Line {{errorNodes.line}} has error: {{errorNodes.msg}}
		</div>
		<!--Space for parent to add more html  -->
		<!-- <slot name="no1"></slot> 
		<slot name="no2"></slot>  -->
	</div>
</template>

<script>
import { eventBus } from '../../main.js'

import TreeNode from './TreeNode'

var AJV = require('ajv');

// Add addons functions
var Highlighter = require('../common_assets/Highlighter.js');
var autocomplete = require('../common_assets/Autocomplete.js');

//Main assets
var History = require('./assets/History.js')
var TreePath = require('./assets/TreePath.js');

var Node = require('../common_assets/Node.js');
var Validator = require('../common_assets/Validator.js')
var util = require('../common_assets/util.js');

var error = '<i class="fas fa-exclamation-triangle"></i>';
var no_error  = '<i class="fas fa-check-circle"></i>';

export default {
	name: 'outline-component',
	data: function(){
		return {
			history: null,
			errorNodes: {},
			has_error: no_error,
			treePath: {},
			rootNode: {}
		}
	},
	components: {
		'tree-component': TreeNode
	},
	// Use prop to transfer data from parent to child, and event from child to parent
	props: {
		debounce: {
			type: Number
		},
		options: {
			type: Object
		},
		node: {
		}
	},
	methods: {
		// :TODO
		_validateCustom: function(){
			try {
				Validator.formatValidator(this.rootNode);
				this.errorNodes = {};
			} catch (err){
				let pkg = {
					line: this.treePath.getLine(err.index),
					msg: err.msg
				};
				this.errorNodes = pkg;
				eventBus.$emit('ruleViolation',pkg);
			}
		},
		// :TODO
		updateExpand: function(option,val){
			var msg = {isExpanded: option, val: val};
			eventBus.$emit('updateExpand',msg);
		},
		// :TODO
		_onChange: function(){
		},
		_setRoot: function(node) {
			this.clear();
			this.rootNode = node;
			this.treePath.setMainPath(node);
		},
		setData: function(json){
			if (json === undefined) {
				this.clear();
			} else {
				var params = {
					field: 'root',
					value: json
				}
				var node = new Node(params);
				this._setRoot(node);
			}
		},
		clear: function(){
			var path = new TreePath();
			if (this.rootNode) this.rootNode = {};
			if (this.treePath) this.treePath = path; 
		},
		refresh: function(){
		},
		isEmpty: function(obj){
			if (!obj) return false
			for(var key in obj) {
				if(obj.hasOwnProperty(key))
					return false;
			}
			return true;
		},
		setPath: function(path) {
			var found = this.treePath.path.find(function(obj){
				return obj.index == path
			});

			if (found) this.treePath.selectedPath = found.nav;
		},
		showNoti: function(req){
			if (this.has_error == error){
				let notification = document.getElementById(req);
				notification.classList.remove('do-show');
				void notification.offsetWidth;
				notification.classList.add('do-show');
			}
		},
		hideNoti: function(req){
			let notification = document.getElementById(req);
			notification.classList.remove('do-show');
		}
	},
	watch: {
		node: function(val) {
			if (val != this.rootNode) {
				this._setRoot(val);
			}
			this._validateCustom();
		},
		errorNodes: function(val){
			let err = (val.msg != "" && val.msg != undefined);
			this.has_error= ( err ? error : no_error);
			if (err) {
				this.showNoti('errorMes');
			}
		}
	},
	created(){
		eventBus.$on('node_selected', (val) =>{
			this.setPath(val);
		});
		eventBus.$on('activeLine_Change', (val) =>{
			if (this.treePath.getPath(val)) {
				this.treePath.selectedPath = this.treePath.getPath(val).nav;
				this.updateExpand(true,this.treePath.getPath(val).index);
			}
		});
		eventBus.$on('onChangeValue', (option) =>{
			try {
				this.rootNode.setNodebyIndex(option.index,option.target,option.change);
				this.$emit('json_onChange',this.rootNode.getValue());
			} catch (err){
				this.errorNodes = err;
			}
		});
		eventBus.$on('jsonSyntax_error', (val) =>{
			this.errorNodes = val;
		});
	},
	mounted() {
		this._setRoot(this.node);
		this._setOptions();
		this._validateCustom();
	},
}
</script>

