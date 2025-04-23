import { PrivateEvent } from "../types/PrivateEvent.ts";

const mockEvents: PrivateEvent[] = [
    {
        id: "1",
        username: "user1",
        title: "Mock-turnering",
        description: "Test af turnering",
        eventFormat: "Mexicano",
        totalSpots: 6,
        courtBooked: true,
        eventDateTime: "2025-04-26T17:00:00Z",
        startTime: "2025-04-26T17:00:00Z",
        endTime: "2025-04-26T19:00:00Z",
        location: "SMASH Padelcenter Stensballe",
        level: "2.2 - 2.8",
        openRegistration: true,
        participants: [
            "user1",
            "user2",
            "user3",
            "user4",
            "user5",
        ],
        joinRequests: [
            "user9"
        ],
        createdAt: new Date().toISOString(),
        accessUrl: "/private-tournament/user1/1",
    },
    {
        id: "2",
        username: "user2",
        title: "Test-Turnering",
        description: "Vi skal bare have det sjovt",
        eventFormat: "Americano",
        totalSpots: 6,
        courtBooked: true,
        eventDateTime: "2025-04-27T16:00:00Z",
        startTime: "2025-04-27T16:00:00Z",
        endTime: "2025-04-27T18:00:00Z",
        location: "SMASH Padelcenter Horsens",
        level: "2.0 - 3.0",
        openRegistration: false,
        participants: [
            "user1",
            "user2",
            "user3",
        ],
        joinRequests: [
            "user9"
        ],
        createdAt: new Date().toISOString(),
        accessUrl: "/private-tournament/user2/2",
    },
    {
        id: "3",
        username: "user3",
        title: "Formiddagspadel",
        description: "Altid sjovt at spille padel om formiddagen",
        eventFormat: "Mexicano",
        totalSpots: 8,
        courtBooked: true,
        eventDateTime: "2025-04-29T06:00:00Z",
        startTime: "2025-04-29T06:00:00Z",
        endTime: "2025-04-29T08:00:00Z",
        location: "SMASH Padelcenter Horsens",
        level: "2.0 - 3.0",
        openRegistration: true,
        participants: [
            "user2",
            "user3",
            "user4",
        ],
        joinRequests: [
        ],
        createdAt: new Date().toISOString(),
        accessUrl: "/private-tournament/user3/3",
    },
];

export default mockEvents;
