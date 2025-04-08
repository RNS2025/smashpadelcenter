type SpotStatus = "match owner" | "occupied" | "reserved" | "available";

interface SpotInfo {
  status: SpotStatus;
  username?: string;
  spotIndex: number;
}

export default SpotInfo;
