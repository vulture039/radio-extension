<script setup lang="ts">
import { ref } from "vue";
import { Authenticator } from "@aws-amplify/ui-vue";
import ProgramList from "./components/ProgramList.vue";
import ScheduleList from "./components/ScheduleList.vue";
import "@aws-amplify/ui-vue/styles.css";
import type { Schema } from "../amplify/data/resource";

type Program = Schema["Program"]["type"];

const programs = ref<Program[]>([]);

function updatePrograms(newPrograms: Program[]) {
  programs.value = newPrograms;
}
</script>

<template>
  <main>
    <authenticator>
      <template v-slot="{ signOut }">
        <button @click="signOut">Sign Out</button>
        <ProgramList :programs="programs" @update-programs="updatePrograms" />
        <ScheduleList :programs="programs" />
      </template>
    </authenticator>
  </main>
</template>

<style scoped></style>
