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
        <div class="button-area">
          <button @click="signOut">ログアウト</button>
        </div>
        <ScheduleList :programs="programs" />
        <ProgramList :programs="programs" @update-programs="updatePrograms" />
      </template>
    </authenticator>
  </main>
</template>

<style scoped>
.button-area {
  text-align: right;
  margin-right: 20px;
}
button {
  border-radius: 5px;
  cursor: pointer;
  margin: 10px;
  background: #999999;
}
</style>
