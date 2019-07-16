<template>
  <div v-bind:class="{
      'outline-expandable': (this.type != 'auto')
      }">
      <div class="node-line node-detail" v-on:click="updateTreePath()">
          <!-- Content menu -->
          <div class="node-contextMenu">
            <div class="dropdown">
              <button class="outline-btn dropdown-btn">
                <span class="icon"><i class="far fa-caret-square-down"></i></span>
              </button>
              <div class="dropdown-content">
                <div class="dropdown-item" v-if="!isRoot()">
                  New node
                  <a title="up" @click="onChangeValue('new','up')"><span class="icon"><i class="fas fa-chevron-circle-up"></i></span></a> 
                  <a title="down" @click="onChangeValue('new','down')"><span class="icon"><i class="fas fa-chevron-circle-down"></i></span></a>
                </div>
                <div class="dropdown-item" v-if="(this.type != 'auto')">
                  New child
                  <a title="Boolean" @click="onChangeValue('new','child-bool')"><span class="icon"><i class="fas fa-check-square"></i></span></a>
                  <a title="String" @click="onChangeValue('new','child-str')"><span class="icon"><i class="fas fa-keyboard"></i></span></a>
                </div>
                <div class="dropdown-item" v-if="!isRoot()">
                  <a @click="onChangeValue('delete','this')">Remove this node</a>
                </div>
              </div>
            </div>
          </div>
          <!-- Value and child node -->
          <div v-bind:style="{marginLeft: (this.level * 24) + 'px'}">
            <table class="node-values" >
              <tbody>
                <tr>
                  <!-- expand button -->
                  <td class="node-detail">
                    <template v-if="(this.type != 'auto')">
                      <button v-html="isExpand" class="outline-btn outline-expand" title="Click to expand this field" @click="updateExpand()">
                      </button>
                    </template>
                  </td>
                  <!-- field -->
                  <td class="node-detail" style="display: block; position: relative;"> 
                    <div v-bind:class="{
                      'outline-readonly': isRoot() || !isNaN(node_field),
                      'node-value': true
                      }" 
                      v-bind:contenteditable="!isRoot() && isNaN(node_field)" 
                      v-on:keydown.enter.prevent="onChangeValue('field',$event)"
                      @input="inputHandle($event)"
                    >{{node_field}}</div>
                  </td>
                  <!-- : -->
                  <td class="node-detail"> 
                    <div v-if="(this.type == 'auto')" class="node-value"> : </div>
                  </td>
                  <!-- value -->
                  <td class="node-detail">
                    <div v-if="nodeValue() == 'bool'" class="node-value">
                      <input type="checkbox" v-model="boolVal">
                      <span class="value-boolean" v-html="boolVal"></span>
                    </div>
                    <div v-else-if="nodeValue() == 'color'" class="node-value" >
                      <div class="value-color" v-bind:style="{ backgroundColor: this.node_value}" style="display: inline-block"></div>
                      <div v-bind:contenteditable="(this.type == 'auto')" style="display: inline-block" v-on:keydown.enter.prevent="onChangeValue('val',$event)">{{node_value}} </div>
                    </div>
                    <div v-else-if="nodeValue() == 'string'" class="node-value" >
                      <div contenteditable="true" class="value-string" v-on:keydown.enter.prevent="onChangeValue('val',$event)">{{node_value}}</div>
                    </div>
                    <div v-else class="node-value" >
                      <div contenteditable="true" v-on:keydown.enter.prevent="onChangeValue('val',$event)" v-html="nodeValue()">{{node_value}}</div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
      </div>
      <!-- render child -->
      <template v-for="(child,index) in childs">
        <tree-component 
            :childs='child.childs'
            :level='level+1'
            :type="child.type"
            :node_value='child.value'
            :showChild ='false'
            :node_field="child.field.toString()"
            :node_index="node_index +'.'+index"
            v-bind:key="child.id"
            v-show="isExpanded"
            >
        </tree-component>
      </template>
  </div>
</template>

<script>
import { eventBus } from '../../main.js';

var util = require('../common_assets/util.js');
var AC = require('../common_assets/Autocomplete.js');
var autocomplete_lib = ['class','association','super','ends','attributes','name','type'];

var expand_btn = '<span class="icon"><i class="fas fa-angle-down"></i></span>';
var collapse_btn = '<span class="icon"><i class="fas fa-angle-right"></i></span>';

export default {  
  name: 'tree-component',
  data: function() {
    return {
      isExpand: this.showChild ? expand_btn : collapse_btn,
      isExpanded: this.showChild,
      boolVal: false
    }
  },
  props: {
    childs: {
      type: Array
    },
    level: {
      type: Number
    },
    type: {
      type: String,
      default: "auto"
    },
    showChild: {
      type: Boolean
    },
    node_field: {
      type: String 
    }, 
    node_value:{

    },
    node_index:{
      type: String
    } 
  },
  methods: {
    isRoot: function(){
      return (this.type === 'root');
    },
    updateExpand: function(option){
      if (option == null) this.isExpanded = !this.isExpanded;
      else if (option.val == -1 || option.val.substr(0,this.node_index.length) == this.node_index ) {
        if (option && option.isExpanded != null ) this.isExpanded = option.isExpanded; 
      }
    },
    nodeValue: function(){
      if (this.childs){
        if (this.type === 'root' || this.type === 'object') return "{"+ this.childs.length+ "}"; 
        if (this.type === 'array') return "["+ this.childs.length+ "]";
      } else {
        var dom;
        if (util.isUrl(this.node_value)){
          dom = "<span class=\"value-link\">"+this.node_value+"</span>";
        } else if (util.isBool(this.node_value)){
          return "bool";
        } else if (util.isHexColor(this.node_value)){
          return "color";
        } else if (this.node_value == null){
          return "null";
        } else {
          return "string";
        }
        return dom;
      }
    },
    updateTreePath: function(){
      eventBus.$emit('node_selected',this.node_index);
    },
    onChangeValue: function(from,event){
      var msg = {
        target: from,
        index: this.node_index,
        change: (typeof event == "boolean" || typeof event == "string") ? event : event.target.innerText
      };
      eventBus.$emit('onChangeValue',msg);
    },
    inputHandle: function(event){
      AC.autocomplete(event.target,autocomplete_lib,this.node_index);
    }
  },
  watch: {
    isExpanded: function(val){
      this.isExpand = (val === true ? expand_btn : collapse_btn);
    },
    boolVal: function(val){
      this.onChangeValue('val',val);
    },
    node_value: function(val){
      this.boolVal = (typeof this.node_value == 'boolean') ? this.node_value : false;
    }
  },
  created() {
    eventBus.$on('updateExpand', (val) =>{
      this.updateExpand(val)
    });
  },
  mounted(){
    this.boolVal = (typeof this.node_value == 'boolean') ? this.node_value : false;
  }
}
</script>
