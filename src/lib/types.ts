export interface RepositoryLanguage {
  name: string;
  color: string | null;
}

export interface RepositoryNode {
  nameWithOwner: string;
  description: string | null;
  url: string;
  stargazerCount: number;
  primaryLanguage: RepositoryLanguage | null;
}

export interface StarredRepository {
  node: RepositoryNode;
}
