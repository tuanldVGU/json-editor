<template>
	<div class="outline">
    <!-- Title -->
		<nav class="navbar is-primary">
			<div class="navbar-brand">
				<div class="navbar-item">Outline</div>
			</div>
			<div class="navbar-menu">
				<div class="navbar-end">
					<div class="navbar-item"><span class="icon" v-html="has_error"></span></div>
				</div>
			</div>
		</nav>
    <!-- Content -->
		<div class="outline-content">
      <!-- Menu -->
			<template v-if="options.menuBar">
				<div class="outline-menu">
					<!-- expand and collapse -->
					<button class="outline-expandAll menu-btn" title="Expand all fields" @click="updateExpand(true,-1)">
							<span class="icon"><i class="fas fa-expand"></i></span>
					</button>
					<button class="outline-collapseAll menu-btn" title="Collapse all fields" @click="updateExpand(false,-1)">
						<span class="icon"><i class="fas fa-compress"></i></span>
				</button>
					<!-- undo an redo -->
					<template v-if="options.history">
						<button class="outline-undo" title="Undo" @click="_onUndo()"></button>
						<button class="outline-redo" title="Redo" @click="_onRedo()"></button>
					</template>
					<!-- search -->
					<template v-if="options.search">
					</template>
				</div>  
			</template>
      <!-- Navigation -->
			<template v-if="options.navigationBar">
				<div class="outline-navigationbar" v-html="treePath.selectedPath">
				</div>
			</template>
      <!-- code outline -->
			<div v-bind:class="{
				'outline-content-outer': true,
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
            <!-- <button @click="test()">SetMainPath</button> -->
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
var util = require('../common_assets/util.js');

var error = '<i class="fas fa-exclamation-triangle"></i>';
var no_error  = '<i class="fas fa-check-circle"></i>';

export default {
	name: 'outline-component',
	data: function(){
		return {
			history: null,
			// highlighter: new Highlighter(),
			validateSchema: null,
			errorNodes: [],
			has_error: no_error,
			focusTarget: null,
			// autocomplete: new autocomplete(),
			// history: new History(this),
			_debouncedValidate: null,
			searchBox: null,
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
		addError: function(){
			this.errorNodes.push("new_line");
		},
		// :TODO
		_setOptions: function(){
			// compile a JSON schema validator if a JSON schema is provided
			this.setSchema(this.options.schema, this.options.schemaRefs);
			// this._debouncedValidate = util.debounce(this.validate.bind(this),this.debounce);
			if (this.options) this.onSelectionChange(this.options.onSelectionChange);
			if ( this.options.history ) this.history = new History(this);
		},
		// :TODO
		setSchema: function(schema, schemaRefs){
			if (schema){
				// Another JSON Schema Validator
				var ajv;
				try{
					ajv = AJV({ 
						allerrors: true,
						verbose: true,
						schemaID:'auto',
						$data: true
					})
					// support both draft-04 and draft-06 alongside the latest draft-07
					ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'));
					ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json'));
				}catch (err) {
					console.warn('Failed to create an instance of Ajv, JSON Schema validation is not available. Please use a JSONEditor bundle including Ajv, or pass an instance of Ajv as via the configuration option `ajv`.');
				}

				if (ajv) {
					if (schemaRefs){
						for (var ref in schemaRefs) {
							ajv.removeSchema(ref);  // When updating a schema - old refs has to be removed first
							if(schemaRefs[ref]) {
								ajv.addSchema(schemaRefs[ref], ref);
							}
						}
						this.options.schemaRefs = schemaRefs
					}
					this.validatSchema = ajv.complile(schema);
					this.option.schema = schema;

					this.validate();
				}
				// update DOM
				this.refresh();
			} else {
				// remove current schema
				this.validateSchema = null;
				this.options.schema = null;
				this.options.schemaRefs = null;
				// to clear current error messages
				this.validate(); 
				this.refresh();  
			}
		},
		// :TODO
		onSelectionChange: function(){
		},
		// :TODO
		validate: function(){
			var root = this.node;
			if (!root) return;

			var json = root.getValue();

			// execute JSON schema validation
			var schemaErrors = [];
			if (this.validateSchema) {
				var valid = this.validateSchema(json);
				if (!valid) {
						// apply all new errors
					schemaErrors = this.validateSchema.errors
						.map(function (error) {
							return util.improveSchemaError(error);
						})
						.map(function findNode (error) {
							return {
								node: root.findNode(error.dataPath),
								error: error
							}
						})
						.filter(function hasNode (entry) {
							return entry.node != null;
						});
				}
				}

				// execute custom validation and after than merge and render all errors
				// try {
				// 		this.validationSequence++;
				// 		var me = this;
				// 		var seq = this.validationSequence;
				// 		this._validateCustom(json)
				// 				.then(function (customValidationErrors) {
				// 						// only apply when there was no other validation started whilst resolving async results
				// 						if (seq === me.validationSequence) {
				// 								var errorNodes = [].concat(schemaErrors, customValidationErrors || []);
				// 								me._renderValidationErrors(errorNodes);
				// 						}
				// 				})
				// 				.catch(function (err) {
				// 						console.error(err);
				// 				});
				// }
				// catch (err) {
				// 		console.error(err);
				// }
		},
		// :TODO
		_validateCustom: function(){

		},
		// :TODO
		onclick: function() {
		},
		// :TODO
		updateExpand: function(option,val){
			var msg = {isExpanded: option, val: val};
			eventBus.$emit('updateExpand',msg);
		},
		// :TODO
		_onRedo: function(){
			if (this.history){
				this.history.undo();
				this._onChange();
			}
		},
		// :TODO
		_onUndo: function(){
			if (this.history){
				this.history.undo();
				this._onChange();
			}
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

			this.treePath.selectedPath = found.nav;
		}
	},
	watch: {
		node: function(val) {
			// this.setData(val);
			this._setRoot(val);
		},
		errorNodes: function(val){
			this.has_error= (val.length > 0 ? error : no_error);
		}
	},
	created(){
		eventBus.$on('node_selected', (val) =>{
			this.setPath(val);
		});
		eventBus.$on('activeLine_Change', (val) =>{
			this.treePath.selectedPath = this.treePath.path[val].nav;
			this.updateExpand(true,this.treePath.path[val].index);
		});
		eventBus.$on('onChangeValue', (option) =>{
			try {
				this.rootNode.setNodebyIndex(option.index,option.target,option.change);
				this.$emit('json_onChange',this.rootNode.getValue());
			} catch (err){
				this.errorNodes.push(err);
			}
		});
	},
	mounted() {
		this._setRoot(this.node);
		this._setOptions();
	},
}
</script>

