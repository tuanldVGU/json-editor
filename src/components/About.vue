<template>
  <div id="about-modal" class="modal">
    <div class="modal-background" @click="closeAbout()"></div>
    <div class="modal-content">
      <div class="columns aboutme">
        <div class="column is-one-quarter avatar-area">
          <figure class="image">
            <img :src="require('../../static/avatar.jpg')">
          </figure>
          <h4 class="title is-5">Lu Dinh Tuan</h4>
          <h5 class="subtitle is-6">B.Sc Computer Science 2015-2019</h5>
        </div>
        <div class="column is-three-quarters content-area">
          <h4 class="title is-4">Hi, I am a web developer!</h4>
          <h5 class="subtitle">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer ex velit, viverra non vulputate vitae, blandit vitae nisl. Nullam fermentum orci et erat viverra bibendum.</h5>
          <div class="level">
            <div class="level-item has-text-centered">
              <figure class="image is-128x64"><img :src="require('../../static/vgu.png')"></figure>
            </div>
            <div class="level-item has-text-centered">
              <figure class="image is-128x64"><img :src="require('../../static/fuas.png')"></figure>
            </div>
          </div>
        </div>
      </div>
    </div>
    <button class="modal-close is-large" aria-label="close" @click="closeAbout()"></button>
  </div>
</template>
<script>
export default {
  name: "about-component",
  methods: {
    closeAbout: function(){
			let config = document.getElementById('about-modal');
			let html = document.querySelector('html');
			config.classList.remove('is-active');
			html.classList.remove('is-clipped');
		}
  }
}
</script>

