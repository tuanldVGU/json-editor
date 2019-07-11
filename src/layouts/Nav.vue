<template>
    <nav class="navbar is-fixed-top is-dark" role="navigation" aria-label="main navigation">
        <div class="navbar-brand">
            <a class="navbar-item" href="#">
                <span class="border">Json</span> <span class="underline">E</span> ditor
            </a>
        </div>
        <div class="navbar-menu">
            <div class="navbar-start">
                <a class="navbar-item">Home</a>
                <a class="navbar-item" @click="openAbout()">About</a>
            </div>
            <div class="navbar-end">
                <div class="navbar-item">
                </div> 
            </div> 
        </div>
    </nav>
</template>

<script>
var util = require('../components/common_assets/util.js')
export default {
	name: 'app-nav',
	methods: {
		openAbout: function() {
			util.openModal('about-modal');
		}
	}
}
</script>

