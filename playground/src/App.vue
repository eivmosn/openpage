<script setup lang="ts">
import type { GlobalThemeOverrides } from 'naive-ui'
import { getComponents } from '@openpage/ui'
import { NConfigProvider, NMessageProvider } from 'naive-ui'
import ScriptRunnerPlayground from './components/PlaygroundPage.vue'

const components = getComponents()

const playgroundThemeOverrides: GlobalThemeOverrides = {
  common: {
    baseColor: '#ffffff',
    bodyColor: '#f6f8f7',
    borderColor: '#d9e1df',
    borderRadius: '8px',
    borderRadiusSmall: '8px',
    boxShadow1: '0 6px 18px rgba(15, 23, 42, 0.06)',
    boxShadow2: '0 12px 30px rgba(15, 23, 42, 0.09)',
    boxShadow3: '0 18px 44px rgba(15, 23, 42, 0.12)',
    errorColor: '#c2412d',
    errorColorHover: '#d9563f',
    errorColorPressed: '#9f3325',
    fontFamily: 'Geist, Avenir Next, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: '14px',
    placeholderColor: '#94a3a0',
    primaryColor: '#0f766e',
    primaryColorHover: '#11867d',
    primaryColorPressed: '#0b5f59',
    primaryColorSuppl: '#15958b',
    successColor: '#2f855a',
    successColorHover: '#38a169',
    successColorPressed: '#276749',
    textColorBase: '#111827',
    textColor1: '#111827',
    textColor2: '#374151',
    textColor3: '#6b7280',
    warningColor: '#b7791f',
    warningColorHover: '#c9892b',
    warningColorPressed: '#975a16',
  },
}
</script>

<template>
  <NConfigProvider
    :theme-overrides="playgroundThemeOverrides"
    abstract
    :inline-theme-disabled="true"
    cls-prefix="open"
    namespace="open"
  >
    <NMessageProvider>
      <ScriptRunnerPlayground :components="components" />
    </NMessageProvider>
  </NConfigProvider>
</template>
