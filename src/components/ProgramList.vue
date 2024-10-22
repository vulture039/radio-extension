<script setup lang="ts">
import type { Schema } from "../../amplify/data/resource";
import { get, post, del } from "aws-amplify/api";
import { onMounted, ref } from "vue";

const programs_ = ref<Array<Schema["Program"]["type"]>>([]);
const selectedIds = ref<string[]>([]);

async function getItem() {
  try {
    const restOperation = get({
      apiName: "programsApi",
      path: "programs",
    });
    const response = await restOperation.response;
    const responseData = await response.body.json();
    console.log("GET succeeded: ", responseData);

    programs_.value = responseData as Schema["Program"]["type"][];
  } catch (error: any) {
    console.log("GET failed: ", JSON.parse(error.response.body));
  }
}

async function postItem(url: any) {
  try {
    const restOperation = post({
      apiName: "programsApi",
      path: "programs",
      options: {
        body: {
          url: url,
        },
      },
    });

    const { body } = await restOperation.response;
    const response = await body.json();

    console.log("POST succeeded: ", response);
  } catch (error: any) {
    console.log("POST failed: ", JSON.parse(error.response.body));
  }
}

async function createProgram() {
  const url = window.prompt("番組ページのURLを入力してください");
  await postItem(url);
  getItem();
}

async function deleteProgram() {
  try {
    const deletePromises = selectedIds.value.map(async (id) => {
      del({
        apiName: "programsApi",
        path: `programs/${id}`,
      });
    });

    // 全ての削除リクエストが完了するまで待機
    await Promise.all(deletePromises);

    console.log("DELETE succeeded: ");
  } catch (error: any) {
    console.log("DELETE failed: ", JSON.parse(error.response.body));
  }
  getItem();
}

onMounted(() => {
  getItem();
});
</script>

<template>
  <div>
    <table>
      <caption>
        お気に入りの番組
      </caption>
      <thead>
        <tr>
          <th scope="col">id</th>
          <th scope="col">削除</th>
          <th scope="col">放送局</th>
          <th scope="col">番組名</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="program in programs_" :key="program.id">
          <th scope="row" v-text="program.id"></th>
          <td>
            <input type="checkbox" v-model="selectedIds" :value="program.id" />
          </td>
          <td v-text="program.stationId"></td>
          <td v-text="program.title"></td>
        </tr>
      </tbody>
    </table>
    <button @click="createProgram">お気に入りに追加する</button>
    <button @click="deleteProgram">お気に入りから削除する</button>
  </div>
</template>

<style scoped>
table {
  border-collapse: collapse;
  border: 2px solid rgb(140 140 140);
  font-family: sans-serif;
  font-size: 0.8rem;
  letter-spacing: 1px;
}

caption {
  caption-side: top;
  padding: 10px;
  font-weight: bold;
}

thead {
  background-color: rgb(228 240 245);
}

th,
td {
  border: 1px solid rgb(160 160 160);
  padding: 8px 10px;
}

td:last-of-type {
  text-align: center;
}

tbody > tr:nth-of-type(even) {
  background-color: rgb(237 238 242);
}

button {
  margin: 10px;
}
</style>
