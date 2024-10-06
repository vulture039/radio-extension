import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
// add for set-up-data
import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json';

Amplify.configure(outputs);
createApp(App).mount('#app');