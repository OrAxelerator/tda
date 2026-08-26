export interface UserProfile {
  uid: string;
  displayName: string;
  cardStyle: string;
  gamesPlayed: number;
  gamesWon: number;
  profileBanner: string;
  profileImageUrl: string | null;
}
