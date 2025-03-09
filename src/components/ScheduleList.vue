<script setup lang="ts">
import { computed, watch, defineProps, ref } from "vue";
import { get } from "aws-amplify/api";
import type { Schema } from "../../amplify/data/resource";
import type { Schedules } from "../types/schedules";

type Program = Schema["Program"]["type"];

const filter = ref<string>("past");
const filterNameList = ["past", "now", "future"];
const schedules = ref<Schedules>();
const props = defineProps<{
  programs: Program[];
}>();
const filteredSchedules = computed(() => {
  if (!Array.isArray(schedules.value)) {
    return [];
  }

  if (filter.value === "all") {
    return schedules.value
      .flatMap((obj) => obj.data)
      .sort((a, b) => b.start_time.localeCompare(a.start_time));
  } else if (filterNameList.includes(filter.value as string)) {
    return schedules.value
      .flatMap((obj) => obj.data)
      .filter((schedule) => schedule.status === filter.value)
      .sort((a, b) => b.start_time.localeCompare(a.start_time));
  }
  return [];
});

watch(
  () => props.programs,
  (newPrograms) => {
    getSchedules(newPrograms);
  }
);

async function getSchedules(programs: Program[]) {
  const promises = programs.map(async (program) => {
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
    return schedules_;
  } catch (error: any) {
    console.log("GET failed: ", error);
    console.log("GET failed: ", JSON.parse(error.response.body));
    return null;
  }
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

function formatDate(startDate: string) {
  return startDate.replace(/(\d{4})(\d{2})(\d{2})/, "$1/$2/$3");
}
function formatStartTime(startTime: string) {
  return startTime.replace(/(\d{2})(\d{2})/, "$1:$2");
}
</script>

<template>
  <div class="schedule-area">
    <h1>放送予定</h1>
    <button :class="{ selected: filter === 'past' }" @click="filter = 'past'">
      タイムフリー
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
      <thead>
        <tr>
          <th scope="col">放送日</th>
          <th scope="col">開始時間</th>
          <th scope="col">番組URL</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="schedule in filteredSchedules" :key="schedule.start_time">
          <td v-text="formatDate(schedule.program_date)"></td>
          <td v-text="formatStartTime(schedule.start_time_s)"></td>
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
.schedule-area {
  margin: 20px;
  text-align: center;
}

table {
  border-collapse: collapse;
  border: 2px solid rgb(140 140 140);
  font-family: sans-serif;
  font-size: 0.8rem;
  letter-spacing: 1px;
  margin: 10px auto;
  margin-top: 10px;
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

button.selected {
  background-color: #007bff;
  color: white;
  border: 2px solid #0056b3;
  box-shadow: 0 4px 6px rgba(0, 123, 255, 0.5);
  font-weight: bold;
}
</style>
