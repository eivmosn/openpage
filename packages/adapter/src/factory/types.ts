import type { Component } from 'vue'
import type { UiAdapter, UiComponentProps } from '../types'

export type AdapterComponent = Component | string

export type AdapterPropsResolver = (props: UiComponentProps) => Record<string, unknown>

export type AdapterValueResolver = (props: UiComponentProps) => unknown

export type AdapterUpdateValueResolver = (args: unknown[], props: UiComponentProps) => unknown

export interface CreateUiAdapterOptions {
  name: string
  components: Record<string, Component>
  formItem?: Component
}

export interface CreateFieldComponentOptions {
  component: AdapterComponent
  name?: string
  valueProp?: string
  updateEvent?: string
  componentEvent?: string | false
  disabledProp?: string | false
  placeholderProp?: string | false
  resolveProps?: AdapterPropsResolver
  resolveValue?: AdapterValueResolver
  resolveUpdateValue?: AdapterUpdateValueResolver
}

export interface CreateContainerComponentOptions {
  component: AdapterComponent
  name?: string
  renderLabel?: boolean
  resolveProps?: AdapterPropsResolver
}

export interface CreateFormItemComponentOptions {
  component: AdapterComponent
  name?: string
  labelProp?: string | false
  pathProp?: string | false
  requiredProp?: string | false
  resolveProps?: AdapterPropsResolver
}

export interface CreateButtonComponentOptions {
  component: AdapterComponent
  name?: string
  clickEvent?: string
  componentEvent?: string
  disabledProp?: string | false
  resolveProps?: AdapterPropsResolver
  resolveText?: (props: UiComponentProps) => unknown
}

export type CreatedUiAdapter = UiAdapter
