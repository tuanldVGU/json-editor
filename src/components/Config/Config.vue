<template>
  <div id="config-modal" class="modal">
    <div class="modal-background" @click="closeConfig()"></div>
    <div class="modal-content-right modal-full-height">
      <!-- header -->
      <div class="modal-header has-background-primary">
        <p class="heading-lead">Configuration</p>
        <button class="modal-close is-large" aria-label="close" @click="closeConfig()"></button>
      </div>
      <!-- body -->
      <div class="modal-body">
        <div class="text-center">
          <span class="icon is-large has-text-primary"><i class="fas fa-cog fa-4x"></i></span>
          <h3 class="title is-4">Configuration</h3>
          <h4 class="subtitle is-5">Set up your input and outline.</h4>
        </div>
        <div class="menu">
          <p class="menu-label">Input</p>
          <ul class="menu-list">
            <li class="menu-item" v-for="(v,k) in input" v-bind:key="k">
              <span>{{k}}</span> 
              <label class="switch">
                  <input type="checkbox" v-bind:checked="v" @input="changeValue(0,k,$event)"><span class="slider round"></span>
              </label>
            </li>
            <li class="menu-item"><span>In development</span></li>
          </ul>
          <p class="menu-label">Outline</p>
          <ul class="menu-list">
            <li class="menu-item" v-for="(v,k) in outline" v-bind:key="k">
              <span>{{k}}</span> 
              <label class="switch">
                  <input type="checkbox" v-bind:checked="v" @input="changeValue(1,k,$event)" :disabled="k !='Show' && outline.Show == false"><span class="slider round"></span>
              </label>
            </li>
            <li class="menu-item"><span>In development</span></li>
          </ul>
        </div>
      </div>
      <!-- footer -->
      <!-- <div class="modal-footer">
        <button class="button is-primary is-medium m-5" @click="update()">Save</button>
        <button class="button is-secondary is-medium m-5" @click="reset()">Reset</button>
      </div> -->
    </div>
    
  </div>
</template>
<script>
var util = require('../common_assets/util.js');
export default {
  name: 'config-component',
  data(){
    return {
      input:{},
      outline:{}
    };
  },
  props:{
    inp: {
      type: Object
    },
    out: {
      type: Object
    }
  },
  methods: {
    closeConfig: function(){
			util.closeModal('config-modal');      
    },
    changeValue: function(dest,k,e){
      if (dest == 0) this.input[k]=e.target.checked;
      else this.outline[k]=e.target.checked;
    }
  },
  mounted() {
    this.input = this.inp;
    this.outline = this.out; 
  }
}
</script>

