import "./assets/main.css";

import { createApp } from "vue";
import App from "./App.vue";
// add for set-up-data
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";
import { fetchAuthSession } from "aws-amplify/auth";

// セッションからidTokenを取得
const getIdToken = async () => {
  const session = await fetchAuthSession();
  return session.tokens?.idToken?.toString() || "";
};

Amplify.configure(outputs, {
  API: {
    REST: {
      headers: async () => {
        return { Authorization: await getIdToken() };
      },
    },
  },
});

const existingConfig = Amplify.getConfig();
Amplify.configure({
  ...existingConfig,
  API: {
    ...existingConfig.API,
    REST: outputs.custom.API,
  },
});

createApp(App).mount("#app");
