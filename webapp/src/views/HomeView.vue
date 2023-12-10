<template>
  <div class="home">
    <TopComponent />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import TopComponent from '@/components/Top.vue';

export default defineComponent({
  name: 'HomeView',
  components: {
    TopComponent,
  },
});
</script>
