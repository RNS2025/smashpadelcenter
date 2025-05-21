export interface MatchResultSet {
  player1: string;
  player2: string;
}

export interface MatchResultTiebreak {
  player1: string;
  player2: string;
}

export interface DPFMatchResult {
  _id: string;
  matchId: number;
  sets: MatchResultSet[];
  tiebreak?: MatchResultTiebreak;
  tournamentName: string;
  row: string;
  players: {
    firstPlayerName: string;
    secondPlayerName: string;
    thirdPlayerName: string;
    fourthPlayerName: string;
  };
  createdAt: string;
  updatedAt: string;
}
