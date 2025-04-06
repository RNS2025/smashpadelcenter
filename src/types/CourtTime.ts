interface CourtTime {
  tid: string;
  status: "Ledig" | "Reserveret" | "Ikke tilgængelig" | "Ukendt";
}

export default CourtTime;
