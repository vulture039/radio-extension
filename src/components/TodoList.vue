<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { Schema } from "../../amplify/data/resource";

// create a reactive reference to the array of todos
const todos = ref<Array<Schema["Todo"]["type"]>>([]);

import { get } from "aws-amplify/api";
import { post } from "aws-amplify/api";

async function getItem() {
  try {
    const restOperation = get({
      apiName: "myRestApi",
      path: "items",
    });
    const response = await restOperation.response;
    console.log("GET call succeeded: ", response);
    console.log("response json: ", response.body.json());

    const responseData = await response.body.json();
    console.log("response data: ", responseData);

    todos.value = responseData as Schema["Todo"]["type"][];
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

    console.log("POST call succeeded");
    console.log(response);
  } catch (error: any) {
    console.log("POST call failed: ", JSON.parse(error.response.body));
  }
}

async function createTodo() {
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
    <button @click="createTodo">Add new todo</button>
    <ul>
      <li v-for="todo in todos" :key="todo.id">
        {{ todo }}
      </li>
    </ul>
  </div>
</template>
