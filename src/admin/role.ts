// Current admin's permission level, set once after sign-in; viewers get a read-only panel.
export type AdminRole = 'owner' | 'editor' | 'viewer' | 'none'
let current: AdminRole = 'none'
export const setAdminRole = (r: AdminRole) => {
  current = r
  document.documentElement.classList.toggle('adm-viewer', r === 'viewer')
}
export const adminRole = () => current
export const canEdit = () => current === 'owner' || current === 'editor'
