// Interface for bulk check-in update request
interface BulkCheckInUpdateRequest {
  tournamentId: string;
  rowId: string;
  checkedIn: boolean;
  players: { playerId: string; playerName: string }[];
}

export default BulkCheckInUpdateRequest;
