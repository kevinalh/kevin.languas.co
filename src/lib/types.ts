export interface RepositoryLanguage {
  name: string;
  color: string | null;
}

export interface RepositoryNode {
  name: string;
  nameWithOwner: string;
  createdAt: string;
  description: string | null;
  url: string;
  stargazerCount: number;
  primaryLanguage: RepositoryLanguage | null;
}

export interface StarredRepository {
  starredAt: string;
  node: RepositoryNode;
}
