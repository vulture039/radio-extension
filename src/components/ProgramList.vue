<script setup lang="ts">
import { onMounted, ref, defineProps, defineEmits } from "vue";
import { get, post, del } from "aws-amplify/api";
import type { Schema } from "../../amplify/data/resource";

type Program = Schema["Program"]["type"];

const programs = ref<Program[]>([]);
const selectedIds = ref<string[]>([]);
const emit = defineEmits<{
  (event: "update-programs", newPrograms: Program[]): void;
}>();

async function getItem() {
  try {
    const restOperation = get({
      apiName: "radioExtensionApi",
      path: "programs",
    });
    const response = await restOperation.response;
    const responseData = await response.body.json();

    programs.value = responseData as Program[];
    emit("update-programs", programs.value);
  } catch (error: any) {
    console.log("GET failed: ", JSON.parse(error.response.body));
  }
}

async function postItem(url: string) {
  try {
    const restOperation = post({
      apiName: "radioExtensionApi",
      path: "programs",
      options: {
        body: {
          url: url,
        },
      },
    });

    const { body } = await restOperation.response;
    const response = await body.json();
  } catch (error: any) {
    console.log("POST failed: ", JSON.parse(error.response.body));
  }
}

async function createProgram() {
  const url = window.prompt("番組ページのURLを入力してください") as string;
  await postItem(url);
  getItem();
}

async function deleteProgram() {
  try {
    const deletePromises = selectedIds.value.map(async (timestamp) => {
      del({
        apiName: "radioExtensionApi",
        path: `programs/${timestamp}`,
      });
    });
    await Promise.all(deletePromises);
  } catch (error: any) {
    console.log("DELETE failed: ", JSON.parse(error.response.body));
  }
  getItem();
}

onMounted(async () => {
  await getItem();
});
</script>

<template>
  <div class="program-area">
    <h1>お気に入り番組</h1>
    <button @click="createProgram">追加</button>
    <button @click="deleteProgram">削除</button>
    <table>
      <thead>
        <tr>
          <th scope="col">削除</th>
          <th scope="col">放送局</th>
          <th scope="col">番組名</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="program in programs" :key="program.timestamp">
          <td>
            <input
              type="checkbox"
              v-model="selectedIds"
              :value="program.timestamp"
            />
          </td>
          <td v-text="program.stationId"></td>
          <td v-text="program.title"></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.program-area {
  margin: 20px;
  padding-top: 20px;
  text-align: center;
}

table {
  border-collapse: collapse;
  border: 2px solid rgb(140 140 140);
  font-family: sans-serif;
  font-size: 0.8rem;
  letter-spacing: 1px;
  margin: 10px auto;
}

thead {
  background-color: #404040;
}

th {
  font-weight: bold;
}

th,
td {
  border: 1px solid rgb(160 160 160);
  padding: 8px 10px;
}

td:last-of-type {
  text-align: center;
}

tr td:last-child {
  text-align: left;
}

button {
  border-radius: 5px;
  cursor: pointer;
  margin: 10px;
  background: #999999;
}

input[type="checkbox"] {
  accent-color: transparent;
}
</style>
