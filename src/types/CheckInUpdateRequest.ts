// Interface for check-in update request
interface CheckInUpdateRequest {
  tournamentId: string;
  rowId: string;
  playerId: string;
  playerName: string;
  checkedIn: boolean;
  userId: string;
}

export default CheckInUpdateRequest;
