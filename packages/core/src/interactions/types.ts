export type InteractionPreset = 'glow' | 'lift' | 'none' | 'scale' | 'soft'
export type InteractionStyleValue = null | number | string | undefined
export type InteractionStyleObject = Record<string, InteractionStyleValue>
export type InteractionStyle = InteractionPreset | InteractionStyleObject

export interface ResolvedInteractionStyle {
  base: InteractionStyleObject
  state: InteractionStyleObject
}
