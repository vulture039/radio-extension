<script setup lang="ts">
import ProgramList from "./components/ProgramList.vue";
import { Authenticator } from "@aws-amplify/ui-vue";
import "@aws-amplify/ui-vue/styles.css";
</script>

<template>
  <main>
    <authenticator>
      <template v-slot="{ user, signOut }">
        <h1>Hello {{ user.username }}!</h1>
        <button @click="signOut">Sign Out</button>
        <ProgramList />
      </template>
    </authenticator>
  </main>
</template>

<style scoped></style>
