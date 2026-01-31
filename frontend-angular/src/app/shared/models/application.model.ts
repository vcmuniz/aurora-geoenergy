export interface Application {
  id: string;
  name: string;
  ownerTeam: string;
  repoUrl?: string;
  createdAt: Date;
}

export interface ApplicationRequest {
  name: string;
  ownerTeam: string;
  repoUrl?: string;
}

export interface ApplicationResponse extends Application {}
