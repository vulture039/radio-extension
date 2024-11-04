<script setup lang="ts">
import type { Schedule } from "aws-cdk-lib/aws-events";
import type { Schema } from "../../amplify/data/resource";
import type { Schedules } from "../types/schedules";
import { get, post, del } from "aws-amplify/api";
import { computed, onMounted, ref } from "vue";

const programs = ref<Array<Schema["Program"]["type"]>>([]);
const selectedIds = ref<string[]>([]);
const schedules = ref<Schedules>();
const filter = ref<string>("past");

async function getItem() {
  try {
    const restOperation = get({
      apiName: "radioExtensionApi",
      path: "programs",
    });
    const response = await restOperation.response;
    const responseData = await response.body.json();
    console.log("GET succeeded: ", responseData);

    programs.value = responseData as Schema["Program"]["type"][];
  } catch (error: any) {
    console.log("GET failed: ", JSON.parse(error.response.body));
  }
}

async function getSchedules() {
  const promises = programs.value.map(async (program) => {
    return await callApi(program.stationId as string, program.title as string);
  });
  schedules.value = (await Promise.all(promises)) as unknown as Schedules;
}

async function callApi(
  stationId: string,
  title: string
): Promise<Schedules | null> {
  try {
    const restOperation = get({
      apiName: "radioExtensionApi",
      path: `schedules/${stationId}/${title}`,
    });
    const response = await restOperation.response;
    const responseData = (await response.body.json()) as unknown as Schedules;
    if (responseData == null) {
      return null;
    }
    const schedules_: Schedules = responseData;
    console.log("schedules: ", schedules_);
    return schedules_;
  } catch (error: any) {
    console.log("GET failed: ", error);
    console.log("GET failed: ", JSON.parse(error.response.body));
    return null;
  }
}

async function postItem(url: any) {
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
        apiName: "radioExtensionApi",
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

function generateUrl(stationId: string, startTime: string) {
  const date = new Date(startTime);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  const dateTimeString = `${year}${month < 10 ? "0" + month : month}${
    day < 10 ? "0" + day : day
  }${hour < 10 ? "0" + hour : hour}${minute < 10 ? "0" + minute : minute}${
    second < 10 ? "0" + second : second
  }`;

  return "https://radiko.jp/#!/ts/" + stationId + "/" + dateTimeString;
}

onMounted(async () => {
  await getItem();
  await getSchedules();
});

const filteredSchedules = computed(() => {
  if (!Array.isArray(schedules.value)) {
    return [];
  }

  const filterNameList = ["past", "now", "future"];

  if (filter.value === "all") {
    return schedules.value.flatMap((obj) => obj.data);
  } else if (filterNameList.includes(filter.value as string)) {
    return schedules.value
      .flatMap((obj) => obj.data)
      .filter((schedule) => schedule.status === filter.value);
  }
  return [];
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
          <th scope="col">削除</th>
          <th scope="col">放送局</th>
          <th scope="col">番組名</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="program in programs" :key="program.id">
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
    <br />
    <button :class="{ selected: filter === 'past' }" @click="filter = 'past'">
      タイムシフト
    </button>
    <button :class="{ selected: filter === 'now' }" @click="filter = 'now'">
      ライブ
    </button>
    <button
      :class="{ selected: filter === 'future' }"
      @click="filter = 'future'"
    >
      放送予定
    </button>
    <button :class="{ selected: filter === 'all' }" @click="filter = 'all'">
      全て
    </button>

    <table>
      <caption>
        放送予定
      </caption>
      <thead>
        <tr>
          <th scope="col">放送日</th>
          <th scope="col">開始時間</th>
          <th scope="col">番組名</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="schedule in filteredSchedules" :key="schedule.start_time">
          <td v-text="schedule.program_date"></td>
          <td v-text="schedule.start_time_s"></td>
          <td>
            <a
              :href="generateUrl(schedule.station_id, schedule.start_time)"
              v-text="schedule.title"
              target="_blank"
            ></a>
          </td>
        </tr>
      </tbody>
    </table>
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
