<script setup lang="ts">
import { createNaiveUiAdapter } from '@openpage/adapter'
import { NConfigProvider, NMessageProvider } from 'naive-ui'
import PlaygroundPage from './components/PlaygroundPage.vue'

const adapter = createNaiveUiAdapter()
</script>

<template>
  <NConfigProvider
    :theme-overrides="adapter.themeOverrides" abstract
    :inline-theme-disabled="true"
    cls-prefix="open"
    namespace="open"
  >
    <NMessageProvider>
      <PlaygroundPage :adapter="adapter" />
    </NMessageProvider>
  </NConfigProvider>
</template>
