import { BibliographyEntry, CitationStyle } from './bibliography';

export interface BibliographyProject {
  id: string;
  title: string;
  citationStyle: CitationStyle;
  entries: BibliographyEntry[];
  createdAt: number;
  updatedAt: number;
  lastExportedAt?: number;
  description?: string;
  isFavorite?: boolean;
}

export type AutoSaveState = 'saved' | 'saving' | 'unsaved';

export interface AutoSaveStatus {
  state: AutoSaveState;
  lastSavedAt: number | null;
}
