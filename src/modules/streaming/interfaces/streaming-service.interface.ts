export interface StreamMetadata {
  title: string;
  artist: string;
  albumArt?: string;
  duration: number;
  genre?: string[];
  releaseDate?: Date;
  popularity?: number;
}

export interface StreamResult {
  streamUrl: string;
  metadata: StreamMetadata;
}

export interface SearchResultItem {
  trackId: string;
  service: 'jamendo' | 'youtube';
  title: string;
  artist: string;
  albumArt?: string;
  duration: number;
}

export interface IStreamingService {
  getMetadata(trackId: string): Promise<Partial<StreamMetadata>>;
  getStreamUrl(trackId: string): Promise<StreamResult>;
  search(query: string, limit?: number): Promise<SearchResultItem[]>;
}
