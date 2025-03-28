import Player from "./Player";
import Row from "./Row";
import Tournament from "./Tournament";

interface TournamentWithPlayers {
  tournament: Tournament;
  rows: {
    row: Row;
    players: Player[];
  }[];
}

export default TournamentWithPlayers;
