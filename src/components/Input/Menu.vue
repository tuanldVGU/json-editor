<template>
	<nav class="navbar is-dark">
		<div class="navbar-brand">
				<div class="navbar-item"> </div>
		</div>
		<div class="navbar-menu">
			<div class="navbar-start">
				<a class="navbar-item" title="New" @click="newFile()">
					<span class="icon"><i class="fas fa-plus-circle"></i></span><p> New</p>
				</a>

				<input type="file" ref="jsonFiles" id="loadJSON"  class="inputfile navbar-item" @change="loadFile">
				<label for="loadJSON">
					<span class="icon"><i class="fas fa-file-upload"></i></span> Load
				</label>

				<a class="navbar-item" title="Save" @click="exportJSON()">
					<span class="icon"><i class="fas fa-save"></i></span><p> Save</p>
				</a>

				<a class="navbar-item" title="Export to SQL" @click="exportSQL()">
					<span class="icon"><i class="fas fa-file-export"></i></span><p> Export</p>
				</a>

				<div class="navbar-item filename">
					<div class="name-input">
						{{fileName}}.json
					</div>
					<span class="icon close-btn" @click="newFile()">
						<i class="fas fa-times-circle"></i>
					</span>
				</div>
			</div>
			<div class="navbar-end">
				<div class="navbar-item has-dropdown is-hoverable">
					<a class="navbar-link is-arrowless"><i class="fas fa-ellipsis-h"></i></a> 
					<div class="navbar-dropdown is-right">
						<a class="navbar-item" @click="openConfig()">Config</a>
						<p class="navbar-item">v0.33</p>
					</div>
				</div>
			</div>
		</div>
		<div class="modal" id="saveModal">
			<div class="modal-background"></div>
			<div class="modal-content">
				<label class="label">Save as</label>
				<div class="field has-addons">
					<div class="control is-expanded">
						<input class="input" type="text" placeholder="Text input" v-model="fileName">
					</div>
					<p class="control">
						<a class="button is-static">
							{{fileExt}}
						</a>
					</p>
					<div class="control">
						<a class="button is-primary" id="saveLink" :download="fileName+fileExt" @click="closeSaveModal()">Save</a>
					</div>
				</div>
			</div>
			<button class="modal-close is-large" aria-label="close" @click="closeSaveModal()"></button>
		</div>
	</nav>
</template>

<script>
import { eventBus } from '../../main.js';

var util = require('../common_assets/util.js');
var exporter = require('../../assets/js/exportDM.js');
var defaultName = 'index';

export default {
	name: 'menu-component',
	props: {
		json_data: {
		}
	},
	data () {
		return {
			fileName: defaultName,
			fileExt: '.json'
		}
	},
	methods: {
		newFile: function(event) {
			if (this.json_data !== []) this.emitToEditor([]);
			this.fileName = defaultName;
		},
		loadFile: function(event) {
			var me = this;
			var files = event.target.files;
			var outputs = [];
			for (var i = 0, f; f= files[i]; i++){
				var reader = new FileReader();
				reader.onload = (function (file){
					return function(e){
						try {
							var json = JSON.parse(e.target.result);
							me.emitToEditor(json);
							me.fileName = file.name.split('.')[0];
							console.log('Result: '+JSON.stringify(json)); 
						} catch (err){
							console.error('JSON file has some errors:',err);
							alert('File is invalid');
						}
					}
				})(f);
				reader.readAsText(f);
			}
		},
		saveFile: function (data,file_ext){
			this.fileExt = file_ext;
			var element = document.getElementById('saveLink');

			var file = new Blob([data],{type:"octet/stream"})

			element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(data));

			document.getElementById('saveModal').classList.add('is-active');
		},
		exportJSON: function(){
			let is_error = document.getElementById('input_error');
  		if (is_error.style.display == "none"){
				let jsonString =JSON.stringify(this.json_data,undefined,4);
				this.saveFile(jsonString,'.json');
			} else alert('Please fix all the error.');
		},
		exportSQL: function (){
			let is_error = document.getElementById('input_error');
  		if (is_error.style.display == "none"){
				let data = exporter.toSQL(this.json_data);
				this.saveFile(data,'.sql');
			} else alert('Please fix all the error.');
		},
		openConfig: function(){
			util.openModal('config-modal');
		},
		emitToEditor: function(val){
			let pkg ={
				msg: val,
				from: 'menu'
			}
			this.$emit('json_onChange', pkg);
		},
		closeSaveModal: function(){
			document.getElementById('saveModal').classList.remove('is-active');
		}
	},
	created() {
		eventBus.$on('sys_action',(val)=>{
			switch (val) {
				case 'new':
					this.newFile();
					break;
				case 'load':
					this.loadFile();
					break;
				case 'new':
					this.saveFile();
					break;
			}
		});
	}
}
</script>

