import { SketchConfig } from '../types';
import { createStudio, createVersion, STUDIO_STORAGE_KEY } from './studio';

/** Put a sketch into the editor's local history and navigate to the editor. */
export function openSketchInEditor(config: SketchConfig, title: string): void {
  const studio = createStudio();
  const version = createVersion(config, [], `Opened: ${title}`);
  studio.versions = [version];
  studio.currentId = version.id;
  window.localStorage.setItem(STUDIO_STORAGE_KEY, JSON.stringify(studio));
  window.location.assign('/');
}
