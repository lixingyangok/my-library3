<template>
  <nav class="nav" >
    <NuxtLink to="/" >
      root
    </NuxtLink>
    <NuxtLink to="/a1" >
      a1
    </NuxtLink>
    <NuxtLink to="/a2" >
      a2
    </NuxtLink>
    <NuxtLink to="/b1" >
      b1
    </NuxtLink>
  </nav>
  <!-- <NuxtLayout> -->
      <!-- <NuxtWelcome /> -->
      <NuxtPage />
  <!-- </NuxtLayout> -->
</template>


<style lang="scss" scoped>
.h1{
  font-weight: bold;
  em{
    color: red;
  }
}
.nav{
  margin: 0 0 15px;
  padding: 0 0 10px;
  border-bottom: dashed 1px purple;
  a{
    display: inline-block;
    margin: 0 2em 0 0;
    padding: 0.3em 1em;
    background-color: wheat;
  }
}

:global(body){
  padding: 50px;
}
:global(body){
  a{
    padding: 50px;
  }
}


</style>
