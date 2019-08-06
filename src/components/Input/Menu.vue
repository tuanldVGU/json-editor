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

				<a class="navbar-item" title="Save" @click="saveFile()">
					<span class="icon"><i class="fas fa-save"></i></span><p> Save</p>
				</a>

				<div class="navbar-item filename">
					<div class="name-input">
						{{fileName}}
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
	</nav>
</template>

<script>
import { eventBus } from '../../main.js';

var util = require('../common_assets/util.js');
var defaultName = 'index.json';

export default {
	name: 'menu-component',
	props: {
		'json_data': {
			default: this.default_json
		}
	},
	data () {
		return {
			fileName: defaultName
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
							me.fileName = file.name;
							console.log('Result: '+JSON.stringify(json)); 
						} catch (err){
							console.error('JSON file has some errors',err);
							alert('File is invalid');
						}
					}
				})(f);
				reader.readAsText(f);
			}
		},
		saveFile: function (){
			var me = this;
			var element = document.createElement('a');

			var data = document.getElementById('input').innerText.split('\n');
			data.splice(0,data.length/2);
			var jsonString = data.join('\n');
			var file = new Blob([jsonString],{type:"octet/stream"})

			element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(jsonString));

			element.setAttribute('download', me.fileName);

			element.style.display = 'none';
			document.body.appendChild(element);

			element.click();
			document.body.removeChild(element);
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

