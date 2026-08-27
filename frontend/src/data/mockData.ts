import type { Action } from '../types'
export const actions: Action[] = [
  { title: 'Activate cooling centres', description: 'Keep designated public facilities open during the afternoon heat window.', audience: 'Ward offices', priority: 'Immediate', icon: 'building' },
  { title: 'Issue public heat advisory', description: 'Share hydration, shade, and timing guidance through local channels.', audience: 'Communications team', priority: 'Immediate', icon: 'megaphone' },
  { title: 'Support outdoor workers', description: 'Coordinate water, rest breaks, and shade access at high-exposure worksites.', audience: 'Field operations', priority: 'Today', icon: 'people' },
  { title: 'Check high-risk communities', description: 'Prioritise outreach to older adults, children, and people with chronic conditions.', audience: 'Health teams', priority: 'Today', icon: 'heart' },
]
