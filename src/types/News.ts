// NewsType.ts
export interface News {
  id: number;
  title: string;
  content: string;
  imageUrl: string;
  postedToFacebook: boolean;
  postedToInstagram: boolean;
  createdAt: string;
}
