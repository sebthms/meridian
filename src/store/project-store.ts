import { createProjectStore } from './create-project-store'

export type { HistoryState, ProjectStore, ProjectStoreDependencies, ProjectStorePersistence, SaveStatus, ViewMode } from './create-project-store'
export { createProjectStore, defaultProjectId } from './create-project-store'

export const useProjectStore = createProjectStore()
