interface Trainer {
  _id: string;
  username: string;
  name: string;
  specialty: string;
  image: string;
  bio: string;
  availability?: {
    date: Date | string;
    timeSlots: {
      startTime: string;
      isBooked: boolean;
      bookedBy?: string;
    }[];
  }[];
}

export type { Trainer };
