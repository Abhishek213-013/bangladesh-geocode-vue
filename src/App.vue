<!-- src/App.vue -->
<template>
  <div>
    <router-view /> <!-- This is where all your pages (Home, Details) will be rendered -->
  </div>
</template>

<script>
export default {
  name: "App",
};
</script>

<style>
/* You can add global styles here if you want */
body {
  margin: 0;
  font-family: Arial, sans-serif;
}
</style>
