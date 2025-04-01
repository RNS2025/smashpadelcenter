// Interface for check-in status
interface CheckInStatus {
  playerId: string;
  playerName: string;
  checkedIn: boolean;
  timestamp: Date;
}

export default CheckInStatus;
