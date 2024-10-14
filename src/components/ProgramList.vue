<script setup lang="ts">
import type { Schema } from "../../amplify/data/resource";
import { get } from "aws-amplify/api";
import { post } from "aws-amplify/api";
import { onMounted, ref } from "vue";

const programs = ref<Array<Schema["Program"]["type"]>>([]);

async function getItem() {
  try {
    const restOperation = get({
      apiName: "myRestApi",
      path: "items",
    });
    const response = await restOperation.response;
    const responseData = await response.body.json();
    console.log("GET call succeeded: ", responseData);

    programs.value = responseData as Schema["Program"]["type"][];
  } catch (error: any) {
    console.log("GET call failed: ", JSON.parse(error.response.body));
  }
}

async function postItem(url: any) {
  try {
    const restOperation = post({
      apiName: "myRestApi",
      path: "items",
      options: {
        body: {
          url: url,
        },
      },
    });

    const { body } = await restOperation.response;
    const response = await body.json();

    console.log("POST call succeeded: ", response);
  } catch (error: any) {
    console.log("POST call failed: ", JSON.parse(error.response.body));
  }
}

async function createProgram() {
  const url = window.prompt("save url");
  await postItem(url);
  getItem();
}

onMounted(() => {
  getItem();
});
</script>

<template>
  <div>
    <button @click="createProgram">Add new program</button>
    <ul>
      <li v-for="program in programs" :key="program.id">
        {{ program }}
      </li>
    </ul>
  </div>
</template>
