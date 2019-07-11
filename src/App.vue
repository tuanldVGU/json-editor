<template>
  <div id='app'>
    <app-nav></app-nav>
    <editor-component></editor-component>
    <app-footer></app-footer> 
  </div>
</template>

<script>
import Nav from './layouts/Nav.vue'
import Footer from './layouts/Footer.vue'
import Editor from './components/Editor.vue'

export default {
  name: 'app',
  components: {
    'app-nav': Nav,
    'editor-component': Editor,
    'app-footer': Footer
  },
  data () {
    return {
    }
  }
}
</script>
