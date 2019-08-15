<template>
	<div class="editor">
		<div class="columns is-gapless">
			<div :class="{
					column: true,
					'is-two-thirds': outline_options.Show
					}">
				<menu-component 
					:json_data='json'
					@json_onChange="onChange($event)">
				</menu-component>
				<input-component 
					:json_data='json'
					:change_from ='change_from'
					:options='input_options'
					@json_onChange="onChange($event)"
				></input-component>
			</div>
			<div class="column" v-show="outline_options.Show">
				<outline-component 
					:node='node'
					:options='outline_options'
					@json_onChange="onChange($event)"
				></outline-component>
					<!-- <h1 slot="no1">Test</h1>
					<p slot="no2">Lorem isum</p> -->
			</div>
			<!-- Dymamic component and keep them alive-->
			<!-- <keep-alive>
					<component :is="active_component"></component>
			</keep-alive> -->
		</div>
		<config-component 
			:inp="input_options" 
			:out="outline_options">
		</config-component>
		<about-component></about-component>
	</div>
</template>

<script>
import Outline from './Outline/Outline.vue'
import Menu from './Input/Menu.vue'
import Input from './Input/Input.vue'
import Config from './Config/Config.vue'
import About from './About.vue'

var Node = require('./common_assets/Node.js');

export default {
	name: 'editor-component',
	data: function(){
		return {
			json: {},
			node: {},
			change_from: "",
			input_options: {
				View_mode: false,
				Autocomplete: true
			},
			outline_options: {
				Show: false,
				View_mode: true,
				Autocomplete: true,
			},
			defaultJSON: [
				{
					class: "test"
				},
				{
					association: "test_link"
				}
			]
		}
	},
	components: {
		'outline-component': Outline,
		'menu-component': Menu,
		'input-component': Input,
		'config-component': Config,
    'about-component': About
	},
	methods: {
		clear: function(){
			if (this.node) this.rootNode = {};
		},
		_setRoot: function(node){
			this.clear();
			this.node = node;
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
		onChange: function(val){
			this.json = val.msg;
			this.change_from = val.from;
			this.setData(val.msg);
		}
	},
	created(){
		this.json = this.defaultJSON;
		this.setData(this.json);
	}
}
</script>



