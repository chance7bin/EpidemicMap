<template>
  <div id="app">
<!--    <img src="./assets/logo.png">-->
<!--    <router-view/>-->
    <student-map></student-map>
  </div>
</template>

<script>
import StudentMap from "./components/StudentMap";
export default {
  name: 'App',
  components: {StudentMap}
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /*text-align: center;*/
  /*color: #2c3e50;*/
  /*margin-top: 60px;*/
}
</style>
